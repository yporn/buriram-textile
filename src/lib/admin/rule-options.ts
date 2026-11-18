// ตัวเลือกสำหรับฟอร์ม Rule Manager — แยกจาก rule-engine.ts เพราะที่นี่เป็นเรื่อง UI ล้วน ๆ

export const CONDITION_FIELD_OPTIONS = [
  { value: "SKIN_TONE", label: "โทนสีผิวของผู้ใช้" },
  { value: "BODY_SHAPE", label: "รูปร่างของผู้ใช้" },
  { value: "DRESS_STYLE", label: "สไตล์การแต่งกายของผู้ใช้" },
  { value: "HEIGHT_RANGE", label: "ส่วนสูงของผู้ใช้" },
  { value: "OCCUPATION", label: "อาชีพของผู้ใช้" },
  { value: "AGE_RANGE", label: "ช่วงอายุของผู้ใช้" },
  { value: "GENDER", label: "เพศของผู้ใช้" },
  { value: "OCCASION_TAG", label: "โอกาสใช้งานที่ผู้ใช้เลือก" },
  { value: "PREFERRED_TAG", label: "สิ่งที่ผู้ใช้ให้คะแนนชอบ (Likert ≥ 4)" },
] as const;

export type ConditionFieldValue = (typeof CONDITION_FIELD_OPTIONS)[number]["value"];

/** ตัวเลือกค่าของเงื่อนไขแบบ enum — ต้องตรงกับ enum ใน schema.prisma */
export const CONDITION_VALUE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  SKIN_TONE: [
    { value: "FAIR", label: "ผิวขาว/ขาวเหลือง" },
    { value: "MEDIUM", label: "ผิวสองสี/ผิวกลาง" },
    { value: "TAN", label: "ผิวสองสี/ผิวแทน" },
    { value: "DARK", label: "ผิวเข้ม/ผิวคล้ำ" },
  ],
  BODY_SHAPE: [
    { value: "SLIM", label: "ผอม/บาง" },
    { value: "AVERAGE", label: "สมส่วน/ปานกลาง" },
    { value: "CURVY", label: "อวบ/ท้วม" },
  ],
  DRESS_STYLE: [
    { value: "FORMAL", label: "เรียบร้อย/สุภาพ/ทางการ" },
    { value: "CASUAL", label: "สบาย ๆ / ลำลอง" },
    { value: "MODERN", label: "ทันสมัย/เก๋ไก๋" },
    { value: "TRADITIONAL", label: "อนุรักษ์นิยม/ดั้งเดิม" },
    { value: "MIXED", label: "ผสมผสาน" },
  ],
  HEIGHT_RANGE: [
    { value: "UNDER_155", label: "ต่ำกว่า 155 ซม." },
    { value: "RANGE_155_165", label: "155–165 ซม." },
    { value: "RANGE_166_175", label: "166–175 ซม." },
    { value: "OVER_175", label: "มากกว่า 175 ซม." },
  ],
  OCCUPATION: [
    { value: "STUDENT", label: "นักเรียน/นักศึกษา" },
    { value: "CIVIL_SERVANT", label: "ข้าราชการ/พนักงานรัฐวิสาหกิจ" },
    { value: "COMPANY_EMPLOYEE", label: "พนักงานบริษัท" },
    { value: "BUSINESS_OWNER", label: "ธุรกิจส่วนตัว/เจ้าของกิจการ" },
    { value: "HOMEMAKER", label: "แม่บ้าน/พ่อบ้าน" },
    { value: "OTHER", label: "อื่น ๆ" },
  ],
  AGE_RANGE: [
    { value: "UNDER_20", label: "ต่ำกว่า 20 ปี" },
    { value: "AGE_21_30", label: "21–30 ปี" },
    { value: "AGE_31_40", label: "31–40 ปี" },
    { value: "AGE_41_50", label: "41–50 ปี" },
    { value: "OVER_50", label: "มากกว่า 50 ปี" },
  ],
  GENDER: [
    { value: "MALE", label: "ชาย" },
    { value: "FEMALE", label: "หญิง" },
    { value: "UNSPECIFIED", label: "ไม่ระบุ" },
  ],
};

/** เงื่อนไขสองแบบนี้ใช้ "tag code" เป็นค่า ไม่ใช่ enum — ต้องดึงตัวเลือกจากฐานข้อมูล */
export const TAG_CONDITION_FIELDS = ["OCCASION_TAG", "PREFERRED_TAG"];

/** หมวด tag ที่ใช้เป็นเงื่อนไขได้ แยกตามชนิดเงื่อนไข */
export const TAG_CONDITION_CATEGORIES: Record<string, string[]> = {
  OCCASION_TAG: ["occasion"],
  PREFERRED_TAG: ["color_tone", "pattern", "material"],
};

export function conditionFieldLabel(field: string): string {
  return CONDITION_FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field;
}

/** แปลงค่าเงื่อนไขเป็นข้อความอ่านง่าย (ใช้ในตารางรายการกฎ) */
export function conditionValueLabel(
  field: string,
  value: string,
  tagLabelByCode?: Map<string, string>
): string {
  if (TAG_CONDITION_FIELDS.includes(field)) {
    return tagLabelByCode?.get(value) ?? value;
  }
  return CONDITION_VALUE_OPTIONS[field]?.find((o) => o.value === value)?.label ?? value;
}
