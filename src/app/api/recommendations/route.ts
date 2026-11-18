// ===================================================================
// POST /api/recommendations
// รับคำตอบแบบสอบถาม → บันทึก session ครบ 4 ตอน + เรียก recommender
// → บันทึก top-N ลง recommendation_results → คืน sessionId
// ===================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  Gender,
  MaritalStatus,
  AgeRange,
  Occupation,
  IncomeRange,
  UsageFrequency,
  SkinTone,
  BodyShape,
  HeightRange,
  DressStyle,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  recommend,
  type CategoryConfig,
  type FabricInput,
  type RuleScoringContext,
  type UserInput,
} from "@/lib/recommender";
import {
  applicableRules,
  DEFAULT_WEIGHTS,
  type RuleConditionFieldCode,
  type RuleInput,
  type RuleUserContext,
} from "@/lib/rule-engine";

// Likert score ≥ 4 (ชอบมาก/ชอบมากที่สุด) = นับเป็น "เลือก" สำหรับ recommender
const RATING_SELECTED_THRESHOLD = 4;
const TOP_N = 5;

// SkinTone enum ของผู้ใช้ → tag code ในหมวด "skin_tone" (แอดมินติดแท็กนี้ไว้กับผ้าที่เหมาะ)
const SKIN_TONE_TAG_CODES: Record<string, string> = {
  FAIR: "fair",
  MEDIUM: "medium",
  TAN: "tan",
  DARK: "dark",
};

// BodyShape enum ของผู้ใช้ → tag code ในหมวด "body_shape"
const BODY_SHAPE_TAG_CODES: Record<string, string> = {
  SLIM: "slim",
  AVERAGE: "average",
  CURVY: "curvy",
};

// DressStyle enum ของผู้ใช้ → tag code ในหมวด "dress_style"
const DRESS_STYLE_TAG_CODES: Record<string, string> = {
  FORMAL: "formal",
  CASUAL: "casual",
  MODERN: "modern",
  TRADITIONAL: "traditional",
  MIXED: "mixed",
};

type IncomingBody = {
  gender?: unknown;
  maritalStatus?: unknown;
  ageRange?: unknown;
  occupation?: unknown;
  monthlyIncome?: unknown;
  pastUsageFreq?: unknown;
  occasionTagIds?: unknown;
  budgetMin?: unknown;
  budgetMax?: unknown;
  tagRatings?: unknown;
  factorRatings?: unknown;
  skinTone?: unknown;
  bodyShape?: unknown;
  heightRange?: unknown;
  dressStyle?: unknown;
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
  const maritalStatus = toEnum(body.maritalStatus, MaritalStatus);
  const ageRange = toEnum(body.ageRange, AgeRange);
  const occupation = toEnum(body.occupation, Occupation);
  const monthlyIncome = toEnum(body.monthlyIncome, IncomeRange);
  const pastUsageFreq = toEnum(body.pastUsageFreq, UsageFrequency);
  const occasionTagIds = toStringArray(body.occasionTagIds);
  const budgetMin = toNullableInt(body.budgetMin);
  const budgetMax = toNullableInt(body.budgetMax);
  const tagRatings = toRatingArray(body.tagRatings, "tagId");
  const factorRatings = toRatingArray(body.factorRatings, "factorId");
  const skinTone = toEnum(body.skinTone, SkinTone);
  const bodyShape = toEnum(body.bodyShape, BodyShape);
  const heightRange = toEnum(body.heightRange, HeightRange);
  const dressStyle = toEnum(body.dressStyle, DressStyle);

  // ---------- Fetch reference data ----------
  const [categories, fabrics, allTags, rules, settings] = await Promise.all([
    prisma.tagCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.fabric.findMany({
      where: { isPublished: true },
      include: { tags: { include: { tag: { include: { category: true } } } } },
    }),
    prisma.tag.findMany({
      select: {
        id: true,
        code: true,
        nameTh: true,
        category: { select: { code: true } },
      },
    }),
    prisma.inferenceRule.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.recommenderSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  const categoryConfigs: CategoryConfig[] = categories.map((c) => ({
    code: c.code,
    nameTh: c.nameTh,
    weight: c.weight,
  }));

  // tagId → categoryCode
  const tagCategoryMap = new Map<string, string>();
  for (const t of allTags) tagCategoryMap.set(t.id, t.category.code);

  // โทนผิวที่ผู้ใช้ตอบ → tag id ในหมวด skin_tone (ถ้าแอดมินตั้งหมวดนี้ไว้)
  const skinToneTagId = skinTone
    ? allTags.find(
        (t) => t.category.code === "skin_tone" && t.code === SKIN_TONE_TAG_CODES[skinTone]
      )?.id
    : undefined;

  // รูปร่างที่ผู้ใช้ตอบ → tag id ในหมวด body_shape
  const bodyShapeTagId = bodyShape
    ? allTags.find(
        (t) => t.category.code === "body_shape" && t.code === BODY_SHAPE_TAG_CODES[bodyShape]
      )?.id
    : undefined;

  // สไตล์การแต่งกายที่ผู้ใช้ตอบ → tag id ในหมวด dress_style
  const dressStyleTagId = dressStyle
    ? allTags.find(
        (t) => t.category.code === "dress_style" && t.code === DRESS_STYLE_TAG_CODES[dressStyle]
      )?.id
    : undefined;

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
  // ตอนที่ 5: โทนผิว/รูปร่าง/สไตล์ → เลือก tag หมวดที่เกี่ยวข้องโดยอัตโนมัติ
  if (skinToneTagId) pushSelected(skinToneTagId);
  if (bodyShapeTagId) pushSelected(bodyShapeTagId);
  if (dressStyleTagId) pushSelected(dressStyleTagId);

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

  // ---------- Build rule context (กฎการอนุมาน R001–R102) ----------
  // เงื่อนไขกฎแบบ tag เก็บเป็น "tag code" ไม่ใช่ id → ต้องแปลงคำตอบผู้ใช้เป็น code ก่อน
  const tagCodeById = new Map(allTags.map((t) => [t.id, t.code]));

  // ป้ายชื่อ tag ฝั่งเงื่อนไข (key = tag code) — จำกัดเฉพาะหมวดที่เป็นเงื่อนไขแบบ tag ได้จริง
  // (occasion มาจากตอนที่ 2, ส่วน color_tone/pattern/material มาจาก Likert ตอนที่ 3)
  // หมวด skin_tone/body_shape/dress_style เป็นเงื่อนไขแบบ enum ไม่ใช่ tag จึงตัดออก
  // ซึ่งทำให้ code ไม่ชนกันเลย (เช่น "traditional" มีทั้งใน pattern และ dress_style)
  const CONDITION_TAG_CATEGORIES = ["occasion", "color_tone", "pattern", "material"];
  const conditionTagLabels = new Map(
    allTags
      .filter((t) => CONDITION_TAG_CATEGORIES.includes(t.category.code))
      .map((t) => [t.code, t.nameTh])
  );

  const ruleUserContext: RuleUserContext = {
    skinTone,
    bodyShape,
    dressStyle,
    heightRange,
    occupation,
    ageRange,
    gender,
    occasionTagCodes: occasionTagIds.flatMap((id) => {
      const code = tagCodeById.get(id);
      return code ? [code] : [];
    }),
    preferredTagCodes: tagRatings.flatMap((r) => {
      if (r.score < RATING_SELECTED_THRESHOLD) return [];
      const code = tagCodeById.get(r.tagId);
      return code ? [code] : [];
    }),
  };

  const ruleInputs: RuleInput[] = rules.map((r) => ({
    code: r.code,
    nameTh: r.nameTh,
    conditionField: r.conditionField as RuleConditionFieldCode,
    conditionValue: r.conditionValue,
    thenTagId: r.thenTagId,
    weight: r.weight,
    explanationTh: r.explanationTh,
  }));

  const ruleContext: RuleScoringContext = {
    applicable: applicableRules(ruleInputs, ruleUserContext),
    fabricTagIds: new Map(
      fabrics.map((f) => [f.id, new Set(f.tags.map((ft) => ft.tagId))])
    ),
    conditionTagLabels,
    weights: settings
      ? {
          baseWeight: settings.baseWeight,
          ruleWeight: settings.ruleWeight,
          budgetTolerance: settings.budgetTolerance,
        }
      : DEFAULT_WEIGHTS,
  };

  // ---------- Run recommender ----------
  const scored = recommend(
    fabricInputs,
    userInput,
    categoryConfigs,
    TOP_N,
    ruleContext
  );

  // ---------- Persist ทุกอย่างในทรานแซกชันเดียว ----------
  try {
    const sessionId = await prisma.$transaction(async (tx) => {
      const session = await tx.recommendationSession.create({
        data: {
          gender,
          maritalStatus,
          ageRange,
          occupation,
          monthlyIncome,
          pastUsageFreq,
          budgetMin,
          budgetMax,
          skinTone,
          bodyShape,
          heightRange,
          dressStyle,
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
              ruleTrace: r.ruleTrace ?? [],
              hardGate: r.hardGate ?? null,
              scoreBreakdown: r.scoreBreakdown ?? null,
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
