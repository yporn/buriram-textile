// prisma/seed.ts
// ใส่ชุด Tag มาตรฐาน + ชุมชน + ผ้าตัวอย่าง
// รันด้วย: npx prisma db seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    code: "occasion",
    nameTh: "โอกาสใช้งาน",
    question: "คุณต้องการผ้าไปใช้ในโอกาสใด",
    weight: 0.3,
    multiple: false,
    sortOrder: 1,
    tags: [
      { code: "ceremony", nameTh: "งานบุญ / งานพิธี" },
      { code: "wedding", nameTh: "งานแต่งงาน / งานมงคล" },
      { code: "formal_work", nameTh: "ใส่ทำงาน / งานทางการ" },
      { code: "casual", nameTh: "ใส่ลำลอง / ใส่ทั่วไป" },
      { code: "gift_collect", nameTh: "ของฝาก / ของสะสม" },
    ],
  },
  {
    code: "color_tone",
    nameTh: "โทนสี",
    question: "ชอบผ้าโทนสีแบบไหน",
    weight: 0.25,
    multiple: true,
    sortOrder: 2,
    tags: [
      { code: "warm", nameTh: "โทนอุ่น", description: "แดง ส้ม เหลือง ทอง" },
      { code: "cool", nameTh: "โทนเย็น", description: "น้ำเงิน เขียว ม่วง" },
      { code: "earth", nameTh: "โทนธรรมชาติ", description: "น้ำตาล ครีม เทา" },
      { code: "dark", nameTh: "โทนเข้ม", description: "ดำ กรมท่า" },
      { code: "bright", nameTh: "โทนสดใส", description: "ชมพู ฟ้าสด" },
    ],
  },
  {
    code: "pattern",
    nameTh: "ลวดลาย",
    question: "ชอบลวดลายแบบไหน",
    weight: 0.2,
    multiple: true,
    sortOrder: 3,
    tags: [
      { code: "mudmee", nameTh: "ลายมัดหมี่" },
      { code: "khit", nameTh: "ลายขิด" },
      { code: "plain", nameTh: "ผ้าพื้นเรียบ" },
      { code: "stripe_check", nameTh: "ลายริ้ว / ลายตาราง" },
      { code: "local_identity", nameTh: "ลายอัตลักษณ์บุรีรัมย์" },
    ],
  },
  {
    code: "material",
    nameTh: "เนื้อผ้า",
    question: "ต้องการเนื้อผ้าแบบใด",
    weight: 0.15,
    multiple: true,
    sortOrder: 4,
    tags: [
      { code: "silk_pure", nameTh: "ไหมแท้" },
      { code: "silk_blend", nameTh: "ไหมผสม" },
      { code: "cotton", nameTh: "ฝ้าย" },
    ],
  },
];

const COMMUNITIES = [
  { key: "naphoo", name: "กลุ่มทอผ้าบ้านนาโพธิ์", district: "อำเภอนาโพธิ์" },
  { key: "sanuan", name: "กลุ่มทอผ้าบ้านสนวน", district: "อำเภอห้วยราช" },
  { key: "nongtad", name: "กลุ่มทอผ้าบ้านหนองตาด", district: "อำเภอเมืองบุรีรัมย์" },
];

const FABRICS = [
  {
    name: "ผ้าซิ่นตีนแดง",
    priceThb: 4500,
    community: "naphoo",
    description: "ผ้าซิ่นไหมแท้ ตีนซิ่นสีแดงสด อัตลักษณ์เด่นของบุรีรัมย์",
    story: "ผ้าซิ่นตีนแดงเป็นเอกลักษณ์ประจำจังหวัดบุรีรัมย์ สืบทอดจากราชสำนักในอดีต",
    tags: ["ceremony", "wedding", "warm", "local_identity", "silk_pure"],
  },
  {
    name: "ผ้ามัดหมี่ลายภูเขาไฟ",
    priceThb: 2800,
    community: "sanuan",
    description: "ผ้าไหมผสม ลายมัดหมี่ที่ได้แรงบันดาลใจจากภูเขาไฟบุรีรัมย์",
    story: "ลายนี้ออกแบบจากรูปทรงภูเขาไฟกระโดง สัญลักษณ์ของจังหวัด",
    tags: ["formal_work", "gift_collect", "earth", "mudmee", "silk_blend"],
  },
  {
    name: "ผ้าขิดฝ้ายลายดอก",
    priceThb: 890,
    community: "nongtad",
    description: "ผ้าฝ้ายทอมือ ลายขิดดอกไม้ เนื้อนุ่ม ใส่สบาย",
    story: "ลายขิดดอกไม้เป็นลายพื้นบ้านที่นิยมทอไว้ใช้ในครัวเรือน",
    tags: ["casual", "bright", "khit", "cotton"],
  },
  {
    name: "ผ้าไหมมัดหมี่โทนคราม",
    priceThb: 3600,
    community: "sanuan",
    description: "ผ้าไหมแท้ย้อมคราม ลายมัดหมี่ดั้งเดิม",
    story: "ย้อมด้วยครามธรรมชาติ ให้สีที่ลึกและเปลี่ยนเฉดตามแสง",
    tags: ["formal_work", "ceremony", "cool", "dark", "mudmee", "silk_pure"],
  },
  {
    name: "ผ้าพื้นไหมสีทอง",
    priceThb: 5200,
    community: "naphoo",
    description: "ผ้าไหมพื้นเรียบ สีทองอ่อน เหมาะกับงานพิธีสำคัญ",
    story: "ทอด้วยเทคนิคไหมเส้นเล็ก ให้ผิวผ้าเรียบเงางาม",
    tags: ["wedding", "ceremony", "warm", "plain", "silk_pure"],
  },
  {
    name: "ผ้าฝ้ายลายตารางสีดิน",
    priceThb: 650,
    community: "nongtad",
    description: "ผ้าฝ้ายลายตาราง โทนน้ำตาลดิน ใส่ลำลองได้ทุกวัน",
    story: "ย้อมสีจากเปลือกไม้ในท้องถิ่น สีจึงนุ่มและไม่ฉูดฉาด",
    tags: ["casual", "earth", "stripe_check", "cotton"],
  },
  {
    name: "ผ้าไหมมัดหมี่ลายนาค",
    priceThb: 6800,
    community: "sanuan",
    description: "ผ้าไหมแท้ ลายนาคโบราณ ใช้เวลาทอกว่าสองเดือน",
    story: "ลายนาคสื่อถึงความอุดมสมบูรณ์ตามความเชื่อของชาวอีสาน",
    tags: ["ceremony", "gift_collect", "dark", "mudmee", "local_identity", "silk_pure"],
  },
  {
    name: "ผ้าขิดไหมผสมโทนชมพู",
    priceThb: 1900,
    community: "naphoo",
    description: "ผ้าไหมผสม ลายขิด โทนชมพูอ่อน สดใส",
    story: "ลายขิดทอยกดอก ให้สัมผัสนูนเป็นเอกลักษณ์",
    tags: ["casual", "formal_work", "bright", "khit", "silk_blend"],
  },
];

async function main() {
  console.log("กำลังใส่ข้อมูลเริ่มต้น...");

  const tagMap = new Map<string, string>();

  for (const cat of CATEGORIES) {
    const category = await prisma.tagCategory.upsert({
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

    for (const [i, t] of cat.tags.entries()) {
      const tag = await prisma.tag.upsert({
        where: { categoryId_code: { categoryId: category.id, code: t.code } },
        update: { nameTh: t.nameTh, description: (t as any).description ?? null, sortOrder: i },
        create: {
          categoryId: category.id,
          code: t.code,
          nameTh: t.nameTh,
          description: (t as any).description ?? null,
          sortOrder: i,
        },
      });
      tagMap.set(t.code, tag.id);
    }
  }
  console.log(`ใส่ tag แล้ว ${tagMap.size} รายการ`);

  const communityMap = new Map<string, string>();
  for (const c of COMMUNITIES) {
    const existing = await prisma.community.findFirst({ where: { name: c.name } });
    const community =
      existing ??
      (await prisma.community.create({
        data: { name: c.name, district: c.district },
      }));
    communityMap.set(c.key, community.id);
  }
  console.log(`ใส่ชุมชนแล้ว ${communityMap.size} กลุ่ม`);

  for (const f of FABRICS) {
    const existing = await prisma.fabric.findFirst({ where: { name: f.name } });
    if (existing) continue;

    await prisma.fabric.create({
      data: {
        name: f.name,
        description: f.description,
        story: f.story,
        priceThb: f.priceThb,
        communityId: communityMap.get(f.community)!,
        tags: {
          create: f.tags.map((code) => ({ tagId: tagMap.get(code)! })),
        },
      },
    });
  }
  console.log(`ใส่ผ้าแล้ว ${FABRICS.length} ผืน`);
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
