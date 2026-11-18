// ===================================================================
// POST /api/satisfaction
// บันทึกแบบสอบถามความพึงพอใจในการใช้งานระบบ (ภาคผนวก ข)
// ไม่ผูกกับ session — เป็นแบบสอบถามทั่วไป
// ===================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GENDER_VALUES = ["MALE", "FEMALE", "UNSPECIFIED"] as const;
const AGE_RANGE_VALUES = [
  "UNDER_20",
  "AGE_21_30",
  "AGE_31_40",
  "AGE_41_50",
  "OVER_50",
] as const;
const OCCUPATION_VALUES = [
  "STUDENT",
  "CIVIL_SERVANT",
  "PRIVATE_EMPLOYEE",
  "BUSINESS_OWNER",
  "AGRICULTURE",
  "OTHER",
] as const;
const FAMILIARITY_VALUES = [
  "EXPERT",
  "REGULAR_INTEREST",
  "SPECIAL_OCCASION_ONLY",
  "LOW_BUT_INTERESTED",
] as const;
const TECH_EXPERIENCE_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;

type QKey =
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10"
  | "q11" | "q12" | "q13" | "q14" | "q15" | "q16" | "q17" | "q18" | "q19";

const Q_KEYS: readonly QKey[] = [
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
  "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19",
];

function isOneOf<T extends string>(values: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

function isLikertScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

type IncomingBody = Record<string, unknown>;

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!isOneOf(GENDER_VALUES, body.gender)) {
    return NextResponse.json({ error: "gender is invalid" }, { status: 400 });
  }
  if (!isOneOf(AGE_RANGE_VALUES, body.ageRange)) {
    return NextResponse.json({ error: "ageRange is invalid" }, { status: 400 });
  }
  if (!isOneOf(OCCUPATION_VALUES, body.occupation)) {
    return NextResponse.json({ error: "occupation is invalid" }, { status: 400 });
  }
  if (!isOneOf(FAMILIARITY_VALUES, body.familiarity)) {
    return NextResponse.json({ error: "familiarity is invalid" }, { status: 400 });
  }
  if (!isOneOf(TECH_EXPERIENCE_VALUES, body.techExperience)) {
    return NextResponse.json(
      { error: "techExperience is invalid" },
      { status: 400 }
    );
  }

  const ratings = {} as Record<QKey, number>;
  for (const key of Q_KEYS) {
    const v = body[key];
    if (!isLikertScore(v)) {
      return NextResponse.json({ error: `${key} must be an integer 1-5` }, { status: 400 });
    }
    ratings[key] = v;
  }

  const genderOther =
    typeof body.genderOther === "string" && body.genderOther.trim().length > 0
      ? body.genderOther.trim()
      : null;
  const occupationOther =
    typeof body.occupationOther === "string" && body.occupationOther.trim().length > 0
      ? body.occupationOther.trim()
      : null;
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim()
      : null;

  try {
    await prisma.satisfactionSurvey.create({
      data: {
        gender: body.gender,
        genderOther,
        ageRange: body.ageRange,
        occupation: body.occupation,
        occupationOther,
        familiarity: body.familiarity,
        techExperience: body.techExperience,
        comment,
        ...ratings,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/satisfaction failed:", err);
    return NextResponse.json(
      { error: "internal error saving satisfaction survey" },
      { status: 500 }
    );
  }
}
