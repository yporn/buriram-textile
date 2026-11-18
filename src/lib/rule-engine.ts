// ===================================================================
// Rule Engine — กฎการอนุมานข้ามหมวด (R001–R102)
//
// ต่างจาก recommender.ts ที่จับคู่ tag "ภายในหมวดเดียวกัน"
// กฎที่นี่เป็นแบบข้ามหมวด: IF ผู้ใช้มีคุณสมบัติ X → ผ้าที่มี tag Y ได้คะแนนเพิ่ม
// เช่น R020: ผู้ใช้ผิวสองสี → ผ้าโทนสีคราม (+35%)
//
// ฟังก์ชันในไฟล์นี้เป็น pure ทั้งหมด (ไม่แตะ Prisma) เพื่อให้ทดสอบและตรวจสูตรได้ง่าย
// ===================================================================

export type RuleConditionFieldCode =
  | "SKIN_TONE"
  | "BODY_SHAPE"
  | "DRESS_STYLE"
  | "HEIGHT_RANGE"
  | "OCCUPATION"
  | "AGE_RANGE"
  | "GENDER"
  | "OCCASION_TAG"
  | "PREFERRED_TAG";

/** กฎหนึ่งข้อในรูปแบบที่ engine ใช้ (แปลงมาจาก InferenceRule ใน DB แล้ว) */
export interface RuleInput {
  code: string;
  nameTh: string;
  conditionField: RuleConditionFieldCode;
  conditionValue: string;
  /** tag id ที่ผ้าต้องมี จึงจะถือว่ากฎข้อนี้ "ยิง" */
  thenTagId: string;
  weight: number;
  explanationTh: string;
}

/** คุณสมบัติของผู้ใช้ที่ดึงมาจากคำตอบแบบสอบถาม */
export interface RuleUserContext {
  skinTone: string | null;
  bodyShape: string | null;
  dressStyle: string | null;
  heightRange: string | null;
  occupation: string | null;
  ageRange: string | null;
  gender: string | null;
  /** tag code ของโอกาสใช้งานที่ผู้ใช้ติ๊กเลือก */
  occasionTagCodes: string[];
  /** tag code ที่ผู้ใช้ให้คะแนน Likert >= 4 */
  preferredTagCodes: string[];
}

/** กฎที่ถูกกระตุ้นจริงกับผ้าผืนหนึ่ง — เก็บลง matchDetail เพื่อแสดง Rule Trace */
export interface FiredRule {
  code: string;
  nameTh: string;
  weight: number;
  conditionLabelTh: string;
  explanationTh: string;
}

export interface RuleEvaluation {
  fired: FiredRule[];
  /** Σ(น้ำหนักกฎที่ยิง) / Σ(น้ำหนักกฎที่เกี่ยวข้องกับผู้ใช้) — 0..1 */
  ruleScore: number;
  /** จำนวนกฎที่เงื่อนไขตรงกับผู้ใช้คนนี้ (ไม่ว่าผ้าจะมี tag ปลายทางหรือไม่) */
  applicableCount: number;
}

export interface RecommenderWeights {
  baseWeight: number;
  ruleWeight: number;
  budgetTolerance: number;
}

export const DEFAULT_WEIGHTS: RecommenderWeights = {
  baseWeight: 0.6,
  ruleWeight: 0.4,
  budgetTolerance: 0.2,
};

// --- ป้ายข้อความเงื่อนไข (ใช้ประกอบบรรทัด Rule Trace) ------------------

const SKIN_TONE_LABELS: Record<string, string> = {
  FAIR: "ผิวขาว/ขาวเหลือง",
  MEDIUM: "ผิวสองสี/ผิวกลาง",
  TAN: "ผิวสองสี/ผิวแทน",
  DARK: "ผิวเข้ม/ผิวคล้ำ",
};

const BODY_SHAPE_LABELS: Record<string, string> = {
  SLIM: "สรีระผอม/บาง",
  AVERAGE: "สรีระสมส่วน",
  CURVY: "สรีระอวบ/ท้วม",
};

const DRESS_STYLE_LABELS: Record<string, string> = {
  FORMAL: "สไตล์เรียบร้อย/ทางการ",
  CASUAL: "สไตล์สบาย ๆ/ลำลอง",
  MODERN: "สไตล์ทันสมัย",
  TRADITIONAL: "สไตล์อนุรักษ์นิยม",
  MIXED: "สไตล์ผสมผสาน",
};

const HEIGHT_RANGE_LABELS: Record<string, string> = {
  UNDER_155: "ส่วนสูงต่ำกว่า 155 ซม.",
  RANGE_155_165: "ส่วนสูง 155–165 ซม.",
  RANGE_166_175: "ส่วนสูง 166–175 ซม.",
  OVER_175: "ส่วนสูงมากกว่า 175 ซม.",
};

const OCCUPATION_LABELS: Record<string, string> = {
  STUDENT: "อาชีพนักเรียน/นักศึกษา",
  CIVIL_SERVANT: "อาชีพข้าราชการ/พนักงานรัฐวิสาหกิจ",
  COMPANY_EMPLOYEE: "อาชีพพนักงานบริษัท",
  BUSINESS_OWNER: "อาชีพเจ้าของกิจการ",
  HOMEMAKER: "อาชีพแม่บ้าน/พ่อบ้าน",
  OTHER: "อาชีพอื่น ๆ",
};

const AGE_RANGE_LABELS: Record<string, string> = {
  UNDER_20: "อายุต่ำกว่า 20 ปี",
  AGE_21_30: "อายุ 21–30 ปี",
  AGE_31_40: "อายุ 31–40 ปี",
  AGE_41_50: "อายุ 41–50 ปี",
  OVER_50: "อายุมากกว่า 50 ปี",
};

const GENDER_LABELS: Record<string, string> = {
  MALE: "เพศชาย",
  FEMALE: "เพศหญิง",
  UNSPECIFIED: "ไม่ระบุเพศ",
};

const ENUM_LABELS: Partial<Record<RuleConditionFieldCode, Record<string, string>>> = {
  SKIN_TONE: SKIN_TONE_LABELS,
  BODY_SHAPE: BODY_SHAPE_LABELS,
  DRESS_STYLE: DRESS_STYLE_LABELS,
  HEIGHT_RANGE: HEIGHT_RANGE_LABELS,
  OCCUPATION: OCCUPATION_LABELS,
  AGE_RANGE: AGE_RANGE_LABELS,
  GENDER: GENDER_LABELS,
};

/**
 * ข้อความ "ตรงกับ..." ที่ขึ้นต้นบรรทัด Rule Trace
 *
 * สำหรับเงื่อนไขแบบ tag (OCCASION_TAG / PREFERRED_TAG) ค่า conditionValue คือ "tag code"
 * จึงต้องส่ง conditionTagLabel ซึ่งเป็นชื่อไทยของ tag **ฝั่งเงื่อนไข** เข้ามา
 * (ไม่ใช่ tag ปลายทาง — คนละตัวกัน) ถ้าไม่ส่งมาจะ fallback เป็น code
 */
export function conditionLabel(
  field: RuleConditionFieldCode,
  value: string,
  conditionTagLabel?: string
): string {
  if (field === "OCCASION_TAG") return `ตรงโอกาสใช้งาน ${conditionTagLabel ?? value}`;
  if (field === "PREFERRED_TAG") return `ตรงกับสิ่งที่ชอบ ${conditionTagLabel ?? value}`;
  return `ตรงกับ${ENUM_LABELS[field]?.[value] ?? value}`;
}

// --- ตรวจว่าเงื่อนไข IF ของกฎตรงกับผู้ใช้คนนี้ไหม ----------------------

function conditionMatchesUser(rule: RuleInput, ctx: RuleUserContext): boolean {
  switch (rule.conditionField) {
    case "SKIN_TONE":
      return ctx.skinTone === rule.conditionValue;
    case "BODY_SHAPE":
      return ctx.bodyShape === rule.conditionValue;
    case "DRESS_STYLE":
      return ctx.dressStyle === rule.conditionValue;
    case "HEIGHT_RANGE":
      return ctx.heightRange === rule.conditionValue;
    case "OCCUPATION":
      return ctx.occupation === rule.conditionValue;
    case "AGE_RANGE":
      return ctx.ageRange === rule.conditionValue;
    case "GENDER":
      return ctx.gender === rule.conditionValue;
    case "OCCASION_TAG":
      return ctx.occasionTagCodes.includes(rule.conditionValue);
    case "PREFERRED_TAG":
      return ctx.preferredTagCodes.includes(rule.conditionValue);
    default:
      return false;
  }
}

/**
 * คัดเฉพาะกฎที่เงื่อนไขตรงกับผู้ใช้คนนี้ — ทำครั้งเดียวต่อ session
 * แล้วใช้ซ้ำกับผ้าทุกผืน (ไม่ต้องคำนวณใหม่ 28 รอบ)
 */
export function applicableRules(rules: RuleInput[], ctx: RuleUserContext): RuleInput[] {
  return rules.filter((r) => conditionMatchesUser(r, ctx));
}

/**
 * ให้คะแนนกฎกับผ้าหนึ่งผืน
 * @param applicable กฎที่ผ่าน applicableRules() มาแล้ว
 * @param fabricTagIds tag id ทั้งหมดของผ้าผืนนี้
 * @param conditionTagLabels map "tag code" → ชื่อไทย ของ tag ฝั่งเงื่อนไข
 *        (ใช้เฉพาะกฎแบบ OCCASION_TAG / PREFERRED_TAG เพื่อประกอบข้อความ trace)
 */
export function evaluateRules(
  applicable: RuleInput[],
  fabricTagIds: Set<string>,
  conditionTagLabels?: Map<string, string>
): RuleEvaluation {
  const fired: FiredRule[] = [];
  let firedWeight = 0;
  let totalWeight = 0;

  for (const rule of applicable) {
    totalWeight += rule.weight;
    if (!fabricTagIds.has(rule.thenTagId)) continue;

    firedWeight += rule.weight;
    fired.push({
      code: rule.code,
      nameTh: rule.nameTh,
      weight: rule.weight,
      conditionLabelTh: conditionLabel(
        rule.conditionField,
        rule.conditionValue,
        conditionTagLabels?.get(rule.conditionValue)
      ),
      explanationTh: rule.explanationTh,
    });
  }

  // เรียงกฎที่ยิงตามน้ำหนักมาก→น้อย ให้ trace อ่านแล้วเห็นเหตุผลหลักก่อน
  fired.sort((a, b) => b.weight - a.weight);

  return {
    fired,
    ruleScore: totalWeight > 0 ? firedWeight / totalWeight : 0,
    applicableCount: applicable.length,
  };
}

/**
 * รวมคะแนนฐาน (จับคู่ tag รายหมวด) กับคะแนนกฎ
 *
 * ถ้าไม่มีกฎที่เกี่ยวข้องเลย (ผู้ใช้ข้ามคำถาม หรือยังไม่ได้ seed กฎ) จะคืนคะแนนฐานตรง ๆ
 * ไม่งั้นคะแนนทุกผืนจะถูกคูณ baseWeight แล้วหล่นทั้งกระดานโดยไม่มีเหตุผล
 */
export function combineScores(
  baseScore: number,
  ruleScore: number,
  applicableCount: number,
  weights: RecommenderWeights
): number {
  if (applicableCount === 0) return baseScore;
  return weights.baseWeight * baseScore + weights.ruleWeight * ruleScore;
}

// --- Hard gate (งบประมาณ) --------------------------------------------

export interface HardGateResult {
  passed: boolean;
  reasonTh: string;
}

/**
 * ประตูงบประมาณ — ปัจจุบันเป็น "soft gate": ใช้แสดงผลใน Rule Trace เท่านั้น
 * ไม่ได้ตัดผ้าออกจากผลลัพธ์ (งบยังคิดคะแนนผ่านมิติ budget เดิมใน recommender.ts)
 */
export function evaluateHardGate(
  priceThb: number,
  budgetMax: number | null | undefined,
  tolerance: number
): HardGateResult | null {
  if (budgetMax == null) return null; // ผู้ใช้ไม่ได้ระบุงบ → ไม่มีประตูให้ผ่าน

  const ceiling = budgetMax * (1 + tolerance);
  const price = priceThb.toLocaleString();
  const max = budgetMax.toLocaleString();

  if (priceThb <= budgetMax) {
    return {
      passed: true,
      reasonTh: `ราคา ${price} บาท อยู่ในขอบเขตงบประมาณไม่เกิน ${max} บาท`,
    };
  }
  if (priceThb <= ceiling) {
    return {
      passed: true,
      reasonTh: `ราคา ${price} บาท สูงกว่างบ ${max} บาทเล็กน้อย แต่ยังอยู่ในเกณฑ์ที่ยอมรับได้`,
    };
  }
  return {
    passed: false,
    reasonTh: `ราคา ${price} บาท สูงกว่างบประมาณไม่เกิน ${max} บาท`,
  };
}
