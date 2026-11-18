// prisma/seed-rules.ts
// Seed กฎการอนุมาน (InferenceRule) ชุดตั้งต้น + ค่าถ่วงน้ำหนัก (RecommenderSetting)
//
// *** แยกจาก prisma/seed.ts โดยตั้งใจ ***
// seed.ts ลบ tag ที่ไม่อยู่ใน taxonomy แล้ว cascade ลบ SessionAnswer/SessionRating
// ซึ่งจะทำลายข้อมูลวิจัยที่เก็บมาแล้ว — ไฟล์นี้ upsert by code อย่างเดียว รันซ้ำได้ปลอดภัย
//
// รันด้วย: npx tsx prisma/seed-rules.ts

import { PrismaClient, RuleConditionField } from "@prisma/client";

const prisma = new PrismaClient();

type SeedRule = {
  code: string;
  nameTh: string;
  conditionField: RuleConditionField;
  conditionValue: string;
  /** "<categoryCode>:<tagCode>" ของ tag ปลายทาง */
  thenTag: string;
  weight: number;
  explanationTh: string;
};

// ---------------------------------------------------------------------
// กฎตั้งต้น — อิงจาก tag vocabulary จริงในฐานข้อมูล
// R002 / R020 / R028 ตั้งรหัสให้ตรงกับตัวอย่างในเอกสารงานวิจัย
// ---------------------------------------------------------------------
const RULES: SeedRule[] = [
  // ----- โอกาสใช้งาน → ลวดลาย / เนื้อผ้า -----
  {
    code: "R001",
    nameTh: "งานราชการ เลือกลายดั้งเดิม",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "official",
    thenTag: "pattern:traditional",
    weight: 0.3,
    explanationTh: "ลายดั้งเดิมให้ความสุภาพ เหมาะกับบริบทงานราชการ",
  },
  {
    code: "R002",
    nameTh: "งานราชการ เลือกลายเชิงวัฒนธรรม",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "official",
    thenTag: "pattern:cultural",
    weight: 0.4,
    explanationTh: "ลายที่มีความหมายเชิงวัฒนธรรม เสริมยศตำแหน่งในงานทางการ",
  },
  {
    code: "R003",
    nameTh: "งานแต่งงาน เลือกลายมงคล",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "wedding",
    thenTag: "pattern:cultural",
    weight: 0.4,
    explanationTh: "ลายมงคลเหมาะกับงานแต่งงานและงานมงคล",
  },
  {
    code: "R004",
    nameTh: "งานแต่งงาน เลือกผ้าไหม",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "wedding",
    thenTag: "material:silk",
    weight: 0.35,
    explanationTh: "ผ้าไหมให้ความหรูหราสมฐานะงานพิธี",
  },
  {
    code: "R005",
    nameTh: "งานบุญ/ประเพณี เลือกลายดั้งเดิม",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "ceremony",
    thenTag: "pattern:traditional",
    weight: 0.35,
    explanationTh: "ลายโบราณสอดคล้องกับงานบุญและประเพณีท้องถิ่น",
  },
  {
    code: "R006",
    nameTh: "ใส่ประจำวัน เลือกลายเรียบ",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "casual",
    thenTag: "pattern:minimal",
    weight: 0.3,
    explanationTh: "ลายเรียบใส่ง่าย เหมาะกับการใช้งานประจำวัน",
  },
  {
    code: "R007",
    nameTh: "ใส่ประจำวัน เลือกผ้าฝ้าย",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "casual",
    thenTag: "material:cotton",
    weight: 0.3,
    explanationTh: "ผ้าฝ้ายระบายอากาศดี สวมใส่สบายทุกวัน",
  },
  {
    code: "R008",
    nameTh: "ซื้อเป็นของฝาก เลือกลายเชิงวัฒนธรรม",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "gift_collect",
    thenTag: "pattern:cultural",
    weight: 0.3,
    explanationTh: "ลายที่มีเรื่องเล่าเชิงวัฒนธรรม เหมาะเป็นของฝากที่ระลึก",
  },
  {
    code: "R009",
    nameTh: "งานสังสรรค์ครอบครัว เลือกลายประยุกต์",
    conditionField: RuleConditionField.OCCASION_TAG,
    conditionValue: "social_family",
    thenTag: "pattern:modern",
    weight: 0.25,
    explanationTh: "ลายร่วมสมัยดูผ่อนคลาย เข้ากับงานเลี้ยงสังสรรค์",
  },

  // ----- โทนสีผิว → โทนสีผ้า -----
  {
    code: "R018",
    nameTh: "ผิวขาว เลือกโทนพาสเทล",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "FAIR",
    thenTag: "color_tone:pastel",
    weight: 0.35,
    explanationTh: "โทนพาสเทลขับผิวขาวให้ดูสว่างนวล",
  },
  {
    code: "R019",
    nameTh: "ผิวขาว เลือกโทนสีสดใส",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "FAIR",
    thenTag: "color_tone:bright",
    weight: 0.3,
    explanationTh: "โทนสีสดใสตัดกับผิวขาวได้ชัดเจน ดูมีชีวิตชีวา",
  },
  {
    code: "R020",
    nameTh: "ผิวสองสี เลือกโทนสีเย็น",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "MEDIUM",
    thenTag: "color_tone:cool",
    weight: 0.35,
    explanationTh: "โทนสีครามและสีเย็นสร้างความกลมกลืนนวลตากับผิวสองสี",
  },
  {
    code: "R021",
    nameTh: "ผิวสองสี เลือกโทนสีดิน",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "MEDIUM",
    thenTag: "color_tone:earth",
    weight: 0.3,
    explanationTh: "โทนสีดินธรรมชาติเข้ากับผิวสองสีอย่างกลมกลืน",
  },
  {
    code: "R022",
    nameTh: "ผิวแทน เลือกโทนสีดิน",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "TAN",
    thenTag: "color_tone:earth",
    weight: 0.35,
    explanationTh: "โทนสีดินขับผิวแทนให้ดูอบอุ่นเป็นธรรมชาติ",
  },
  {
    code: "R023",
    nameTh: "ผิวแทน เลือกโทนสีร้อน",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "TAN",
    thenTag: "color_tone:warm",
    weight: 0.3,
    explanationTh: "โทนสีร้อนเสริมความอบอุ่นให้ผิวแทน",
  },
  {
    code: "R024",
    nameTh: "ผิวเข้ม เลือกโทนสีสดใส",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "DARK",
    thenTag: "color_tone:bright",
    weight: 0.35,
    explanationTh: "โทนสีสดใสตัดกับผิวเข้มทำให้ใบหน้าดูโดดเด่น",
  },
  {
    code: "R025",
    nameTh: "ผิวเข้ม เลือกโทนสีร้อน",
    conditionField: RuleConditionField.SKIN_TONE,
    conditionValue: "DARK",
    thenTag: "color_tone:warm",
    weight: 0.3,
    explanationTh: "โทนสีร้อนช่วยขับผิวเข้มให้ดูมีมิติ",
  },

  // ----- รูปร่าง → ลวดลาย -----
  {
    code: "R027",
    nameTh: "สรีระอวบ เลือกลายเรียบ",
    conditionField: RuleConditionField.BODY_SHAPE,
    conditionValue: "CURVY",
    thenTag: "pattern:minimal",
    weight: 0.3,
    explanationTh: "ลายเรียบน้อยช่วยไม่ให้สรีระดูใหญ่ขึ้น",
  },
  {
    code: "R028",
    nameTh: "สรีระอวบ เลือกลายเรขาคณิต",
    conditionField: RuleConditionField.BODY_SHAPE,
    conditionValue: "CURVY",
    thenTag: "pattern:geometric",
    weight: 0.25,
    explanationTh: "ลายขิดริ้วตั้งสร้างเส้นนำสายตาในแนวดิ่ง ช่วยพรางสรีระ",
  },
  {
    code: "R029",
    nameTh: "สรีระผอม เลือกลายธรรมชาติ",
    conditionField: RuleConditionField.BODY_SHAPE,
    conditionValue: "SLIM",
    thenTag: "pattern:nature",
    weight: 0.25,
    explanationTh: "ลายธรรมชาติที่มีรายละเอียดช่วยเพิ่มมิติให้สรีระผอม",
  },
  {
    code: "R030",
    nameTh: "สรีระสมส่วน เลือกลายดั้งเดิม",
    conditionField: RuleConditionField.BODY_SHAPE,
    conditionValue: "AVERAGE",
    thenTag: "pattern:traditional",
    weight: 0.2,
    explanationTh: "สรีระสมส่วนใส่ลายดั้งเดิมได้ลงตัว ไม่ต้องพรางสัดส่วน",
  },

  // ----- สไตล์การแต่งกาย → ลวดลาย -----
  {
    code: "R041",
    nameTh: "สไตล์ทางการ เลือกลายดั้งเดิม",
    conditionField: RuleConditionField.DRESS_STYLE,
    conditionValue: "FORMAL",
    thenTag: "pattern:traditional",
    weight: 0.3,
    explanationTh: "ลายดั้งเดิมสอดคล้องกับการแต่งกายแบบเรียบร้อยทางการ",
  },
  {
    code: "R042",
    nameTh: "สไตล์ทันสมัย เลือกลายประยุกต์",
    conditionField: RuleConditionField.DRESS_STYLE,
    conditionValue: "MODERN",
    thenTag: "pattern:modern",
    weight: 0.3,
    explanationTh: "ลายร่วมสมัยเข้ากับการแต่งกายทันสมัย",
  },
  {
    code: "R043",
    nameTh: "สไตล์อนุรักษ์นิยม เลือกลายเชิงวัฒนธรรม",
    conditionField: RuleConditionField.DRESS_STYLE,
    conditionValue: "TRADITIONAL",
    thenTag: "pattern:cultural",
    weight: 0.3,
    explanationTh: "ลายที่มีความหมายเชิงวัฒนธรรมตรงกับรสนิยมอนุรักษ์นิยม",
  },
  {
    code: "R044",
    nameTh: "สไตล์ลำลอง เลือกผ้าฝ้าย",
    conditionField: RuleConditionField.DRESS_STYLE,
    conditionValue: "CASUAL",
    thenTag: "material:cotton",
    weight: 0.25,
    explanationTh: "ผ้าฝ้ายเนื้อสบายเข้ากับการแต่งกายลำลอง",
  },

  // ----- อาชีพ / ช่วงอายุ → ลวดลาย -----
  {
    code: "R061",
    nameTh: "ข้าราชการ เลือกลายเชิงวัฒนธรรม",
    conditionField: RuleConditionField.OCCUPATION,
    conditionValue: "CIVIL_SERVANT",
    thenTag: "pattern:cultural",
    weight: 0.3,
    explanationTh: "ลายเชิงวัฒนธรรมเหมาะกับการแต่งกายของข้าราชการ",
  },
  {
    code: "R062",
    nameTh: "นักเรียน/นักศึกษา เลือกลายประยุกต์",
    conditionField: RuleConditionField.OCCUPATION,
    conditionValue: "STUDENT",
    thenTag: "pattern:modern",
    weight: 0.25,
    explanationTh: "ลายร่วมสมัยเข้ากับวัยเรียนและการใช้งานในชีวิตประจำวัน",
  },
  {
    code: "R071",
    nameTh: "อายุมากกว่า 50 ปี เลือกลายดั้งเดิม",
    conditionField: RuleConditionField.AGE_RANGE,
    conditionValue: "OVER_50",
    thenTag: "pattern:traditional",
    weight: 0.25,
    explanationTh: "ลายโบราณสอดคล้องกับรสนิยมของผู้ใหญ่วัย 50 ปีขึ้นไป",
  },
  {
    code: "R072",
    nameTh: "อายุ 21–30 ปี เลือกลายประยุกต์",
    conditionField: RuleConditionField.AGE_RANGE,
    conditionValue: "AGE_21_30",
    thenTag: "pattern:modern",
    weight: 0.25,
    explanationTh: "ลายร่วมสมัยตรงกับรสนิยมคนรุ่นใหม่",
  },
];

async function main() {
  // ---------- ค่าถ่วงน้ำหนักเริ่มต้น ----------
  await prisma.recommenderSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", baseWeight: 0.6, ruleWeight: 0.4, budgetTolerance: 0.2 },
  });
  console.log("ตั้งค่าน้ำหนักเริ่มต้นแล้ว (base 0.6 / rule 0.4 / tolerance 0.2)");

  // ---------- map "category:tag" → tag id ----------
  const tags = await prisma.tag.findMany({
    select: { id: true, code: true, category: { select: { code: true } } },
  });
  const tagIdByKey = new Map(tags.map((t) => [`${t.category.code}:${t.code}`, t.id]));

  let created = 0;
  const missing: string[] = [];

  for (const [i, rule] of RULES.entries()) {
    const thenTagId = tagIdByKey.get(rule.thenTag);
    if (!thenTagId) {
      missing.push(`${rule.code} → ไม่พบ tag "${rule.thenTag}"`);
      continue;
    }

    await prisma.inferenceRule.upsert({
      where: { code: rule.code },
      update: {
        nameTh: rule.nameTh,
        conditionField: rule.conditionField,
        conditionValue: rule.conditionValue,
        thenTagId,
        weight: rule.weight,
        explanationTh: rule.explanationTh,
        sortOrder: i + 1,
      },
      create: {
        code: rule.code,
        nameTh: rule.nameTh,
        conditionField: rule.conditionField,
        conditionValue: rule.conditionValue,
        thenTagId,
        weight: rule.weight,
        explanationTh: rule.explanationTh,
        sortOrder: i + 1,
      },
    });
    created++;
  }

  console.log(`ใส่กฎการอนุมานแล้ว ${created} ข้อ`);
  if (missing.length > 0) {
    console.warn(`ข้ามไป ${missing.length} ข้อ เพราะหา tag ปลายทางไม่เจอ:`);
    for (const m of missing) console.warn("  - " + m);
  }
  console.log("เสร็จเรียบร้อย");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
