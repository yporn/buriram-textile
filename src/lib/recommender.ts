// ===================================================================
// เครื่องแนะนำผ้าทอ — Content-based weighted matching
// หัวใจของงานวิจัย: คำนวณคะแนน + เหตุผลที่อธิบายได้ (explainable)
//
// ใช้ที่: src/lib/recommender.ts
// ===================================================================

export type MatchLevel = "full" | "partial" | "none";

export interface DimensionMatch {
  categoryCode: string;      // occasion | color_tone | pattern | material | budget
  categoryNameTh: string;    // "โอกาสใช้งาน"
  level: MatchLevel;
  score: number;             // 0..1
  weight: number;
  reasonTh: string;          // ข้อความอธิบายที่แสดงบนหน้าจอ
}

export interface ScoredFabric {
  fabricId: string;
  score: number;             // 0..1
  label: "เหมาะมาก" | "เหมาะ" | "พอได้";
  dimensions: DimensionMatch[];
}

// --- ข้อมูลนำเข้า ---------------------------------------------------

export interface UserInput {
  /** tag ที่ผู้ใช้เลือก แยกตาม category เช่น { color_tone: ["warm","earth"] } */
  selectedTags: Record<string, string[]>;
  budgetMin?: number | null;
  budgetMax?: number | null;
  /** tag id ของหมวด color_tone ที่เข้ากับโทนผิวผู้ใช้ (resolve จาก SKIN_TONE_COLOR_CODES ที่ชั้นเรียกใช้งาน) */
  skinToneColorTagIds?: string[];
}

export interface FabricInput {
  id: string;
  priceThb: number;
  /** tag ของผ้า แยกตาม category */
  tags: Record<string, string[]>;
}

export interface CategoryConfig {
  code: string;
  nameTh: string;
  weight: number;
}

// --- ค่าคงที่ -------------------------------------------------------

const BUDGET_TOLERANCE = 0.2;   // เกินงบได้ไม่เกิน 20% ยังได้คะแนนครึ่งหนึ่ง
const BUDGET_CATEGORY: CategoryConfig = {
  code: "budget",
  nameTh: "งบประมาณ",
  weight: 0.1,
};

const SKIN_TONE_CATEGORY: CategoryConfig = {
  code: "skin_tone_match",
  nameTh: "ความเหมาะสมกับโทนผิว",
  weight: 0.1,
};

// โทนสีผิว → รหัส tag หมวด color_tone ที่แนะนำ (ตามหลักการจับคู่สีเบื้องต้น)
// UNSPECIFIED ไม่อยู่ในตาราง → ผู้ใช้ไม่ระบุ = ไม่มีผลต่อคะแนน
export const SKIN_TONE_COLOR_CODES: Record<string, string[]> = {
  FAIR: ["bright", "dark", "pastel"],
  MEDIUM: ["earth", "cool", "pastel"],
  TAN: ["warm", "earth", "bright"],
  DARK: ["warm", "bright", "dark"],
};

// --- คะแนนมิติที่เป็น Tag -------------------------------------------

function scoreTagDimension(
  category: CategoryConfig,
  userTags: string[],
  fabricTags: string[]
): DimensionMatch | null {
  // ผู้ใช้ข้ามคำถามนี้ → ไม่นับมิตินี้ (น้ำหนักจะถูกเกลี่ยให้มิติอื่น)
  if (!userTags || userTags.length === 0) return null;

  const matched = userTags.filter((t) => fabricTags.includes(t));
  const score = matched.length / userTags.length;

  let level: MatchLevel = "none";
  if (score >= 1) level = "full";
  else if (score > 0) level = "partial";

  return {
    categoryCode: category.code,
    categoryNameTh: category.nameTh,
    level,
    score,
    weight: category.weight,
    reasonTh: buildTagReason(category.nameTh, matched, userTags),
  };
}

function buildTagReason(nameTh: string, matched: string[], userTags: string[]): string {
  if (matched.length === 0) return `${nameTh}: ไม่ตรงกับที่เลือกไว้`;
  if (matched.length === userTags.length) return `${nameTh}: ตรงกับที่คุณเลือกทั้งหมด`;
  return `${nameTh}: ตรงบางส่วน (${matched.length} จาก ${userTags.length} ข้อ)`;
}

// --- คะแนนงบประมาณ (soft constraint ไม่ตัดทิ้ง) ---------------------

function scoreBudget(
  price: number,
  min?: number | null,
  max?: number | null
): DimensionMatch | null {
  if (min == null && max == null) return null; // ผู้ใช้ไม่ได้ระบุงบ

  let score = 1;
  let level: MatchLevel = "full";
  let reasonTh = `งบประมาณ: อยู่ในช่วงที่กำหนด`;

  if (max != null && price > max) {
    const over = (price - max) / max;
    if (over <= BUDGET_TOLERANCE) {
      score = 0.5;
      level = "partial";
      reasonTh = `งบประมาณ: สูงกว่างบเล็กน้อย (${price.toLocaleString()} บาท)`;
    } else {
      score = 0;
      level = "none";
      reasonTh = `งบประมาณ: สูงกว่างบที่ตั้งไว้ (${price.toLocaleString()} บาท)`;
    }
  }
  // ถูกกว่างบขั้นต่ำ ไม่ถือเป็นข้อเสีย → คงคะแนนเต็ม

  return {
    categoryCode: BUDGET_CATEGORY.code,
    categoryNameTh: BUDGET_CATEGORY.nameTh,
    level,
    score,
    weight: BUDGET_CATEGORY.weight,
    reasonTh,
  };
}

// --- คะแนนความเหมาะสมกับโทนผิว (soft, advisory) ---------------------

function scoreSkinToneMatch(
  fabricColorTags: string[],
  recommendedTagIds: string[]
): DimensionMatch | null {
  if (!recommendedTagIds || recommendedTagIds.length === 0) return null; // ไม่ระบุโทนผิว → ข้ามมิตินี้

  const matched = fabricColorTags.some((t) => recommendedTagIds.includes(t));

  return {
    categoryCode: SKIN_TONE_CATEGORY.code,
    categoryNameTh: SKIN_TONE_CATEGORY.nameTh,
    level: matched ? "full" : "none",
    score: matched ? 1 : 0,
    weight: SKIN_TONE_CATEGORY.weight,
    reasonTh: matched
      ? `${SKIN_TONE_CATEGORY.nameTh}: โทนสีผ้านี้เข้ากับโทนผิวของคุณ`
      : `${SKIN_TONE_CATEGORY.nameTh}: โทนสีผ้านี้อาจไม่ค่อยเข้ากับโทนผิวของคุณ`,
  };
}

// --- ให้คะแนนผ้าหนึ่งผืน --------------------------------------------

export function scoreFabric(
  fabric: FabricInput,
  input: UserInput,
  categories: CategoryConfig[]
): ScoredFabric {
  const dimensions: DimensionMatch[] = [];

  for (const cat of categories) {
    if (cat.code === BUDGET_CATEGORY.code) continue;
    const dim = scoreTagDimension(
      cat,
      input.selectedTags[cat.code] ?? [],
      fabric.tags[cat.code] ?? []
    );
    if (dim) dimensions.push(dim);
  }

  const budgetDim = scoreBudget(fabric.priceThb, input.budgetMin, input.budgetMax);
  if (budgetDim) dimensions.push(budgetDim);

  const skinToneDim = scoreSkinToneMatch(
    fabric.tags["color_tone"] ?? [],
    input.skinToneColorTagIds ?? []
  );
  if (skinToneDim) dimensions.push(skinToneDim);

  // ถ่วงน้ำหนักแล้ว normalize ด้วยผลรวมน้ำหนักของ "มิติที่ผู้ใช้ตอบ" เท่านั้น
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const weighted = dimensions.reduce((s, d) => s + d.weight * d.score, 0);
  const score = totalWeight > 0 ? weighted / totalWeight : 0;

  return {
    fabricId: fabric.id,
    score,
    label: score >= 0.75 ? "เหมาะมาก" : score >= 0.5 ? "เหมาะ" : "พอได้",
    dimensions,
  };
}

// --- แนะนำผ้า Top-N -------------------------------------------------

export function recommend(
  fabrics: FabricInput[],
  input: UserInput,
  categories: CategoryConfig[],
  topN = 5
): ScoredFabric[] {
  return fabrics
    .map((f) => scoreFabric(f, input, categories))
    .filter((r) => r.score > 0) // ไม่ตรงเลยสักมิติ ไม่ต้องแนะนำ
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
