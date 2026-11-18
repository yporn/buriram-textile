import { RuleConditionField } from "@prisma/client";

export type ParsedRuleInput = {
  code: string;
  nameTh: string;
  conditionField: RuleConditionField;
  conditionValue: string;
  thenTagId: string;
  weight: number;
  explanationTh: string;
  isActive: boolean;
  sortOrder: number;
};

const CONDITION_FIELDS = Object.values(RuleConditionField) as string[];

export function parseRuleBody(
  body: Record<string, unknown>
): { ok: true; data: ParsedRuleInput } | { ok: false; error: string } {
  if (typeof body.code !== "string" || body.code.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกรหัสกฎ (เช่น R001)" };
  }
  if (typeof body.nameTh !== "string" || body.nameTh.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกชื่อกฎ" };
  }
  if (
    typeof body.conditionField !== "string" ||
    !CONDITION_FIELDS.includes(body.conditionField)
  ) {
    return { ok: false, error: "เงื่อนไขไม่ถูกต้อง" };
  }
  if (
    typeof body.conditionValue !== "string" ||
    body.conditionValue.trim().length === 0
  ) {
    return { ok: false, error: "กรุณาระบุค่าของเงื่อนไข" };
  }
  if (typeof body.thenTagId !== "string" || body.thenTagId.trim().length === 0) {
    return { ok: false, error: "กรุณาเลือกคุณลักษณะผ้าปลายทาง" };
  }
  if (
    typeof body.weight !== "number" ||
    !Number.isFinite(body.weight) ||
    body.weight <= 0 ||
    body.weight > 1
  ) {
    return { ok: false, error: "น้ำหนักต้องเป็นตัวเลขมากกว่า 0 และไม่เกิน 1 (เช่น 0.40)" };
  }
  if (
    typeof body.explanationTh !== "string" ||
    body.explanationTh.trim().length === 0
  ) {
    return { ok: false, error: "กรุณากรอกคำอธิบายเหตุผล" };
  }

  return {
    ok: true,
    data: {
      code: body.code.trim().toUpperCase(),
      nameTh: body.nameTh.trim(),
      conditionField: body.conditionField as RuleConditionField,
      conditionValue: body.conditionValue.trim(),
      thenTagId: body.thenTagId.trim(),
      weight: body.weight,
      explanationTh: body.explanationTh.trim(),
      isActive: body.isActive !== false,
      sortOrder:
        typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
          ? Math.trunc(body.sortOrder)
          : 0,
    },
  };
}

export type ParsedSettingsInput = {
  baseWeight: number;
  ruleWeight: number;
  budgetTolerance: number;
};

export function parseSettingsBody(
  body: Record<string, unknown>
): { ok: true; data: ParsedSettingsInput } | { ok: false; error: string } {
  const inRange = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

  if (!inRange(body.baseWeight) || !inRange(body.ruleWeight)) {
    return { ok: false, error: "น้ำหนักต้องอยู่ระหว่าง 0 ถึง 1" };
  }
  // ให้รวมกันได้ 1 พอดี ไม่งั้นคะแนนรวมจะตีความยากในเชิงวิจัย
  if (Math.abs(body.baseWeight + body.ruleWeight - 1) > 1e-6) {
    return {
      ok: false,
      error: "น้ำหนักคะแนนเดิม + น้ำหนักคะแนนกฎ ต้องรวมกันได้ 1.00 พอดี",
    };
  }
  if (
    typeof body.budgetTolerance !== "number" ||
    !Number.isFinite(body.budgetTolerance) ||
    body.budgetTolerance < 0 ||
    body.budgetTolerance > 1
  ) {
    return { ok: false, error: "ค่าผ่อนผันงบประมาณต้องอยู่ระหว่าง 0 ถึง 1" };
  }

  return {
    ok: true,
    data: {
      baseWeight: body.baseWeight,
      ruleWeight: body.ruleWeight,
      budgetTolerance: body.budgetTolerance,
    },
  };
}
