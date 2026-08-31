// ===================================================================
// POST /api/recommendations
// รับคำตอบแบบสอบถาม → บันทึก session ครบ 4 ตอน + เรียก recommender
// → บันทึก top-N ลง recommendation_results → คืน sessionId
// ===================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  Gender,
  AgeRange,
  Occupation,
  IncomeRange,
  UsageFrequency,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recommend,
  type CategoryConfig,
  type FabricInput,
  type UserInput,
} from "@/lib/recommender";

// Likert score ≥ 4 (ชอบมาก/ชอบมากที่สุด) = นับเป็น "เลือก" สำหรับ recommender
const RATING_SELECTED_THRESHOLD = 4;
const TOP_N = 5;

type IncomingBody = {
  gender?: unknown;
  ageRange?: unknown;
  occupation?: unknown;
  monthlyIncome?: unknown;
  pastUsageFreq?: unknown;
  occasionTagIds?: unknown;
  budgetMin?: unknown;
  budgetMax?: unknown;
  tagRatings?: unknown;
  factorRatings?: unknown;
};

function toEnum<T extends string>(
  value: unknown,
  enumObj: Record<string, T>
): T | null {
  if (typeof value !== "string") return null;
  return (Object.values(enumObj) as string[]).includes(value)
    ? (value as T)
    : null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function toRatingArray<K extends string>(
  value: unknown,
  idKey: K
): ({ score: number } & Record<K, string>)[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const id = (r as Record<string, unknown>)[idKey];
    const score = (r as Record<string, unknown>).score;
    if (typeof id !== "string") return [];
    if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5)
      return [];
    return [{ [idKey]: id, score } as { score: number } & Record<K, string>];
  });
}

function toNullableInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.trunc(value);
}

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  // ---------- Validate & normalize ----------
  const gender = toEnum(body.gender, Gender);
  const ageRange = toEnum(body.ageRange, AgeRange);
  const occupation = toEnum(body.occupation, Occupation);
  const monthlyIncome = toEnum(body.monthlyIncome, IncomeRange);
  const pastUsageFreq = toEnum(body.pastUsageFreq, UsageFrequency);
  const occasionTagIds = toStringArray(body.occasionTagIds);
  const budgetMin = toNullableInt(body.budgetMin);
  const budgetMax = toNullableInt(body.budgetMax);
  const tagRatings = toRatingArray(body.tagRatings, "tagId");
  const factorRatings = toRatingArray(body.factorRatings, "factorId");

  // ---------- Fetch reference data ----------
  const [categories, fabrics, allTags] = await Promise.all([
    prisma.tagCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.fabric.findMany({
      where: { isPublished: true },
      include: { tags: { include: { tag: { include: { category: true } } } } },
    }),
    prisma.tag.findMany({ select: { id: true, category: { select: { code: true } } } }),
  ]);

  const categoryConfigs: CategoryConfig[] = categories.map((c) => ({
    code: c.code,
    nameTh: c.nameTh,
    weight: c.weight,
  }));

  // tagId → categoryCode
  const tagCategoryMap = new Map<string, string>();
  for (const t of allTags) tagCategoryMap.set(t.id, t.category.code);

  // ---------- Derive selectedTags สำหรับ recommender ----------
  // ใช้ tag IDs เป็น identifier ทั้ง user side และ fabric side (recommender ไม่สนใจว่าเป็น id หรือ code ตราบใดที่เทียบกันได้)
  const selectedTags: Record<string, string[]> = {};
  const pushSelected = (tagId: string) => {
    const catCode = tagCategoryMap.get(tagId);
    if (!catCode) return;
    if (!selectedTags[catCode]) selectedTags[catCode] = [];
    if (!selectedTags[catCode].includes(tagId)) selectedTags[catCode].push(tagId);
  };
  // ตอนที่ 2: occasion checkbox → เลือกตรง ๆ
  for (const tagId of occasionTagIds) pushSelected(tagId);
  // ตอนที่ 3: Likert score ≥ threshold → นับเป็นเลือก
  for (const r of tagRatings) {
    if (r.score >= RATING_SELECTED_THRESHOLD) pushSelected(r.tagId);
  }

  // ---------- Build FabricInput ----------
  const fabricInputs: FabricInput[] = fabrics.map((f) => {
    const tagsByCategory: Record<string, string[]> = {};
    for (const ft of f.tags) {
      const cc = ft.tag.category.code;
      if (!tagsByCategory[cc]) tagsByCategory[cc] = [];
      tagsByCategory[cc].push(ft.tagId);
    }
    return { id: f.id, priceThb: f.priceThb, tags: tagsByCategory };
  });

  const userInput: UserInput = { selectedTags, budgetMin, budgetMax };

  // ---------- Run recommender ----------
  const scored = recommend(fabricInputs, userInput, categoryConfigs, TOP_N);

  // ---------- Persist ทุกอย่างในทรานแซกชันเดียว ----------
  try {
    const sessionId = await prisma.$transaction(async (tx) => {
      const session = await tx.recommendationSession.create({
        data: {
          gender,
          ageRange,
          occupation,
          monthlyIncome,
          pastUsageFreq,
          budgetMin,
          budgetMax,
        },
      });

      if (occasionTagIds.length > 0) {
        await tx.sessionAnswer.createMany({
          data: occasionTagIds.map((tagId) => ({ sessionId: session.id, tagId })),
          skipDuplicates: true,
        });
      }

      if (tagRatings.length > 0) {
        await tx.sessionRating.createMany({
          data: tagRatings.map((r) => ({
            sessionId: session.id,
            tagId: r.tagId,
            score: r.score,
          })),
          skipDuplicates: true,
        });
      }

      if (factorRatings.length > 0) {
        await tx.sessionDecisionFactor.createMany({
          data: factorRatings.map((r) => ({
            sessionId: session.id,
            factorId: r.factorId,
            score: r.score,
          })),
          skipDuplicates: true,
        });
      }

      if (scored.length > 0) {
        await tx.recommendationResult.createMany({
          data: scored.map((r, i) => ({
            sessionId: session.id,
            fabricId: r.fabricId,
            score: r.score,
            rank: i + 1,
            matchDetail: {
              label: r.label,
              dimensions: r.dimensions,
            } as unknown as Prisma.InputJsonValue,
          })),
        });
      }

      return session.id;
    });

    return NextResponse.json({
      sessionId,
      resultCount: scored.length,
    });
  } catch (err) {
    console.error("POST /api/recommendations failed:", err);
    return NextResponse.json(
      { error: "internal error saving session" },
      { status: 500 }
    );
  }
}
