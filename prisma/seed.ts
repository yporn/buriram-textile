// prisma/seed.ts
// Seed ตัวเดียวสำหรับ:
//   1) TagCategory + Tag (taxonomy ใหม่ตามแบบสอบถามตอนที่ 2-3)
//   2) ลบ tag เก่าที่ไม่อยู่ใน taxonomy ใหม่ (Cascade ลบ FabricTag/SessionAnswer/SessionRating)
//   3) Community
//   4) Fabric + backfill FabricTag ให้ตรง taxonomy ใหม่
//   5) DecisionFactor 9 รายการ (แบบสอบถามตอนที่ 4)
//
// รันด้วย: npx prisma db seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------
// 1) หมวดคำถาม (Tag Categories) + ตัวเลือก (Tags)
//    หมายเหตุ: ทุก category ใหม่เป็น multiple: true
//    (occasion เป็น multi ในแบบสอบถามจริง; pattern/color_tone/material
//    ใช้ Likert ให้ผู้ใช้ให้คะแนนได้หลายรายการ)
// ---------------------------------------------------------------------

const CATEGORIES = [
  {
    code: "occasion",
    nameTh: "โอกาสใช้งาน",
    question: "ท่านใช้ผ้าทอพื้นบ้านในโอกาสใดบ้าง",
    weight: 0.3,
    multiple: true,
    sortOrder: 1,
    tags: [
      { code: "wedding", nameTh: "งานแต่งงาน/งานมงคล" },
      { code: "ceremony", nameTh: "งานบุญ/งานวัด/งานประเพณีท้องถิ่น" },
      { code: "official", nameTh: "งานราชการ/งานทางการ" },
      { code: "social_family", nameTh: "งานเลี้ยงสังสรรค์/งานครอบครัว" },
      { code: "casual", nameTh: "ใส่ประจำวัน/ทำงานทั่วไป" },
      { code: "gift_collect", nameTh: "ซื้อเป็นของขวัญ/ของฝาก" },
    ],
  },
  {
    code: "color_tone",
    nameTh: "โทนสี",
    question: "โทนสีของผ้าที่ชอบ",
    weight: 0.25,
    multiple: true,
    sortOrder: 2,
    tags: [
      { code: "warm", nameTh: "โทนสีร้อน" },
      { code: "cool", nameTh: "โทนสีเย็น" },
      { code: "earth", nameTh: "โทนสีดิน/สีธรรมชาติ" },
      { code: "dark", nameTh: "โทนสุภาพ/สีเข้ม" },
      { code: "bright", nameTh: "โทนสีสดใส/หลากสี" },
      { code: "pastel", nameTh: "โทนสีพาสเทล" },
    ],
  },
  {
    code: "pattern",
    nameTh: "ลวดลาย",
    question: "ลวดลายผ้าที่ชอบ",
    weight: 0.2,
    multiple: true,
    sortOrder: 3,
    tags: [
      { code: "traditional", nameTh: "ลายดั้งเดิม/ลายโบราณ" },
      { code: "modern", nameTh: "ลายประยุกต์/ลายร่วมสมัย" },
      { code: "geometric", nameTh: "ลายเรขาคณิต" },
      { code: "nature", nameTh: "ลายธรรมชาติ" },
      { code: "cultural", nameTh: "ลายที่มีความหมายเชิงวัฒนธรรม/มงคล" },
      { code: "minimal", nameTh: "ลายเรียบ/ลายน้อย" },
    ],
  },
  {
    code: "material",
    nameTh: "เนื้อผ้า",
    question: "เนื้อผ้าที่ชอบ",
    weight: 0.15,
    multiple: true,
    sortOrder: 4,
    tags: [
      { code: "silk", nameTh: "ผ้าไหม" },
      { code: "cotton", nameTh: "ผ้าฝ้าย" },
      { code: "silk_cotton", nameTh: "ผ้าผสมไหม+ฝ้าย" },
      { code: "light", nameTh: "ผ้าเนื้อบาง/เบา" },
      { code: "thick", nameTh: "ผ้าเนื้อหนา/ทนทาน" },
    ],
  },
  {
    code: "skin_tone",
    nameTh: "โทนผิวที่เหมาะสม",
    question: "ผ้านี้เหมาะกับโทนผิวใด (ตรงกับคำตอบตอนที่ 5 ของแบบสอบถาม)",
    weight: 0.1,
    multiple: true,
    sortOrder: 5,
    tags: [
      { code: "fair", nameTh: "ผิวขาว/ขาวเหลือง" },
      { code: "medium", nameTh: "ผิวสองสี/ผิวกลาง" },
      { code: "tan", nameTh: "ผิวสองสี/ผิวแทน" },
      { code: "dark", nameTh: "ผิวเข้ม/ผิวคล้ำ" },
    ],
  },
];

// ---------------------------------------------------------------------
// 2) Tag เก่าที่ต้องลบ (ไม่อยู่ใน taxonomy ใหม่)
//    การลบจะ Cascade ไป FabricTag, SessionAnswer, SessionRating อัตโนมัติ
// ---------------------------------------------------------------------

const OLD_TAG_CODES_TO_REMOVE: Record<string, string[]> = {
  pattern: ["mudmee", "khit", "plain", "stripe_check", "local_identity"],
  material: ["silk_pure", "silk_blend"],
  occasion: ["formal_work"],
};

// ---------------------------------------------------------------------
// 3) ชุมชนผู้ทอ
// ---------------------------------------------------------------------

const COMMUNITIES = [
  { key: "naphoo", name: "กลุ่มทอผ้าบ้านนาโพธิ์", district: "อำเภอนาโพธิ์" },
  { key: "sanuan", name: "กลุ่มทอผ้าบ้านสนวน", district: "อำเภอห้วยราช" },
  { key: "nongtad", name: "กลุ่มทอผ้าบ้านหนองตาด", district: "อำเภอเมืองบุรีรัมย์" },
];

// ---------------------------------------------------------------------
// 4) ผ้าตัวอย่าง — tag remap ให้ตรง taxonomy ใหม่
// ---------------------------------------------------------------------

const FABRICS = [
  {
    name: "ผ้าซิ่นตีนแดง",
    priceThb: 4500,
    community: "naphoo",
    description: "ผ้าซิ่นไหมแท้ ตีนซิ่นสีแดงสด อัตลักษณ์เด่นของบุรีรัมย์",
    story: "ผ้าซิ่นตีนแดงเป็นเอกลักษณ์ประจำจังหวัดบุรีรัมย์ สืบทอดจากราชสำนักในอดีต",
    tags: ["ceremony", "wedding", "warm", "cultural", "traditional", "silk"],
  },
  {
    name: "ผ้ามัดหมี่ลายภูเขาไฟ",
    priceThb: 2800,
    community: "sanuan",
    description: "ผ้าไหมผสม ลายมัดหมี่ที่ได้แรงบันดาลใจจากภูเขาไฟบุรีรัมย์",
    story: "ลายนี้ออกแบบจากรูปทรงภูเขาไฟกระโดง สัญลักษณ์ของจังหวัด",
    tags: ["official", "gift_collect", "earth", "traditional", "nature", "cultural", "silk_cotton"],
  },
  {
    name: "ผ้าขิดฝ้ายลายดอก",
    priceThb: 890,
    community: "nongtad",
    description: "ผ้าฝ้ายทอมือ ลายขิดดอกไม้ เนื้อนุ่ม ใส่สบาย",
    story: "ลายขิดดอกไม้เป็นลายพื้นบ้านที่นิยมทอไว้ใช้ในครัวเรือน",
    tags: ["casual", "bright", "traditional", "nature", "cotton", "light"],
  },
  {
    name: "ผ้าไหมมัดหมี่โทนคราม",
    priceThb: 3600,
    community: "sanuan",
    description: "ผ้าไหมแท้ย้อมคราม ลายมัดหมี่ดั้งเดิม",
    story: "ย้อมด้วยครามธรรมชาติ ให้สีที่ลึกและเปลี่ยนเฉดตามแสง",
    tags: ["official", "ceremony", "cool", "dark", "traditional", "silk"],
  },
  {
    name: "ผ้าพื้นไหมสีทอง",
    priceThb: 5200,
    community: "naphoo",
    description: "ผ้าไหมพื้นเรียบ สีทองอ่อน เหมาะกับงานพิธีสำคัญ",
    story: "ทอด้วยเทคนิคไหมเส้นเล็ก ให้ผิวผ้าเรียบเงางาม",
    tags: ["wedding", "ceremony", "warm", "minimal", "silk"],
  },
  {
    name: "ผ้าฝ้ายลายตารางสีดิน",
    priceThb: 650,
    community: "nongtad",
    description: "ผ้าฝ้ายลายตาราง โทนน้ำตาลดิน ใส่ลำลองได้ทุกวัน",
    story: "ย้อมสีจากเปลือกไม้ในท้องถิ่น สีจึงนุ่มและไม่ฉูดฉาด",
    tags: ["casual", "social_family", "earth", "geometric", "cotton", "light"],
  },
  {
    name: "ผ้าไหมมัดหมี่ลายนาค",
    priceThb: 6800,
    community: "sanuan",
    description: "ผ้าไหมแท้ ลายนาคโบราณ ใช้เวลาทอกว่าสองเดือน",
    story: "ลายนาคสื่อถึงความอุดมสมบูรณ์ตามความเชื่อของชาวอีสาน",
    tags: ["ceremony", "gift_collect", "dark", "traditional", "cultural", "silk", "thick"],
  },
  {
    name: "ผ้าขิดไหมผสมโทนชมพู",
    priceThb: 1900,
    community: "naphoo",
    description: "ผ้าไหมผสม ลายขิด โทนชมพูอ่อน สดใส",
    story: "ลายขิดทอยกดอก ให้สัมผัสนูนเป็นเอกลักษณ์",
    tags: ["casual", "social_family", "pastel", "traditional", "silk_cotton"],
  },
];

// ---------------------------------------------------------------------
// 5) ปัจจัยการตัดสินใจ (แบบสอบถามตอนที่ 4) — Likert 1..5
// ---------------------------------------------------------------------

const DECISION_FACTORS = [
  { code: "price", nameTh: "ราคา/งบประมาณ" },
  { code: "pattern_beauty", nameTh: "ความสวยงามของลวดลาย" },
  { code: "cultural_meaning", nameTh: "ความหมายเชิงวัฒนธรรมของลวดลาย" },
  { code: "occasion_fit", nameTh: "ความเหมาะสมกับโอกาสใช้งาน" },
  { code: "body_fit", nameTh: "ความเหมาะสมกับรูปร่าง/สีผิวของตนเอง" },
  { code: "trend", nameTh: "ความทันสมัย/เทรนด์แฟชั่น" },
  { code: "quality", nameTh: "คุณภาพและความทนทานของผ้า" },
  { code: "community", nameTh: "แหล่งผลิต/ชุมชนที่ผลิต" },
  { code: "recommendation", nameTh: "คำแนะนำจากผู้อื่น" },
];

// ---------------------------------------------------------------------

async function main() {
  console.log("กำลังใส่ข้อมูลเริ่มต้น...");

  // ---------- 1) upsert categories ----------
  const categoryIdByCode = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const c = await prisma.tagCategory.upsert({
      where: { code: cat.code },
      update: {
        nameTh: cat.nameTh,
        question: cat.question,
        weight: cat.weight,
        multiple: cat.multiple,
        sortOrder: cat.sortOrder,
      },
      create: {
        code: cat.code,
        nameTh: cat.nameTh,
        question: cat.question,
        weight: cat.weight,
        multiple: cat.multiple,
        sortOrder: cat.sortOrder,
      },
    });
    categoryIdByCode.set(cat.code, c.id);
  }
  console.log(`อัปเดต category แล้ว ${categoryIdByCode.size} หมวด`);

  // ---------- 2) ลบ tag เก่าที่ไม่อยู่ใน taxonomy ใหม่ ----------
  let removedTagCount = 0;
  for (const [catCode, codes] of Object.entries(OLD_TAG_CODES_TO_REMOVE)) {
    const catId = categoryIdByCode.get(catCode);
    if (!catId) continue;
    const res = await prisma.tag.deleteMany({
      where: { categoryId: catId, code: { in: codes } },
    });
    removedTagCount += res.count;
  }
  console.log(`ลบ tag เก่าที่ไม่ใช้แล้ว ${removedTagCount} รายการ`);

  // ---------- 3) upsert tag ใหม่ ทั้งหมด ----------
  const tagIdByCode = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const catId = categoryIdByCode.get(cat.code)!;
    for (const [i, t] of cat.tags.entries()) {
      const tag = await prisma.tag.upsert({
        where: { categoryId_code: { categoryId: catId, code: t.code } },
        update: { nameTh: t.nameTh, sortOrder: i },
        create: {
          categoryId: catId,
          code: t.code,
          nameTh: t.nameTh,
          sortOrder: i,
        },
      });
      tagIdByCode.set(t.code, tag.id);
    }
  }
  console.log(`ใส่/อัปเดต tag แล้ว ${tagIdByCode.size} รายการ`);

  // ---------- 4) ชุมชนผู้ทอ ----------
  const communityIdByKey = new Map<string, string>();
  for (const c of COMMUNITIES) {
    const existing = await prisma.community.findFirst({ where: { name: c.name } });
    const community =
      existing ??
      (await prisma.community.create({
        data: { name: c.name, district: c.district },
      }));
    communityIdByKey.set(c.key, community.id);
  }
  console.log(`ใส่ชุมชนแล้ว ${communityIdByKey.size} กลุ่ม`);

  // ---------- 5) ผ้า + reset FabricTag ให้ตรง taxonomy ใหม่ ----------
  for (const f of FABRICS) {
    let fabric = await prisma.fabric.findFirst({ where: { name: f.name } });
    if (!fabric) {
      fabric = await prisma.fabric.create({
        data: {
          name: f.name,
          description: f.description,
          story: f.story,
          priceThb: f.priceThb,
          communityId: communityIdByKey.get(f.community)!,
        },
      });
    } else {
      // update meta ให้ตรง seed (กันข้อมูลค้าง)
      await prisma.fabric.update({
        where: { id: fabric.id },
        data: {
          description: f.description,
          story: f.story,
          priceThb: f.priceThb,
          communityId: communityIdByKey.get(f.community)!,
        },
      });
    }

    // ล้าง FabricTag เดิม แล้วสร้างใหม่จากรายการที่ระบุ
    await prisma.fabricTag.deleteMany({ where: { fabricId: fabric.id } });
    const tagLinks = f.tags
      .map((code) => tagIdByCode.get(code))
      .filter((id): id is string => Boolean(id))
      .map((tagId) => ({ fabricId: fabric!.id, tagId }));
    if (tagLinks.length !== f.tags.length) {
      console.warn(
        `⚠ ผ้า "${f.name}" มี tag code ที่หาไม่เจอ:`,
        f.tags.filter((c) => !tagIdByCode.get(c))
      );
    }
    await prisma.fabricTag.createMany({ data: tagLinks });
  }
  console.log(`ตั้งค่า tag ให้ผ้าทั้งหมด ${FABRICS.length} ผืน`);

  // ---------- 6) ปัจจัยการตัดสินใจ ----------
  for (const [i, df] of DECISION_FACTORS.entries()) {
    await prisma.decisionFactor.upsert({
      where: { code: df.code },
      update: { nameTh: df.nameTh, sortOrder: i + 1 },
      create: { code: df.code, nameTh: df.nameTh, sortOrder: i + 1 },
    });
  }
  console.log(`ใส่ decision factor แล้ว ${DECISION_FACTORS.length} รายการ`);

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
