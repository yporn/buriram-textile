// scripts/seed-stories.ts
// สร้างบทความ Storytelling เริ่มต้น 6 เรื่อง โดยดึงเนื้อหาจาก Fabric.story ที่มีอยู่แล้ว
// (นำเข้าจากเอกสารทางการของสำนักงานวัฒนธรรมจังหวัดบุรีรัมย์ ผ่าน scripts/seed-identity-fabrics.ts)
// เลือกผ้าที่มีเรื่องราวเข้มข้นและครอบคลุมหมวดหมู่ให้หลากหลาย
//
// รันด้วย: npx tsx --env-file=.env scripts/seed-stories.ts

import { prisma } from "../src/lib/prisma";

const PICKS: { fabricName: string; title: string; category: string }[] = [
  {
    fabricName: "ลายโคมหลักหิน",
    title: "ลายโคมหลักหิน: ภูมิปัญญาแห่งอำเภอพลับพลาชัย",
    category: "ภูมิปัญญา",
  },
  {
    fabricName: "ผ้าซิ่นหัวแดงตีนแดง ลายนพเก้า",
    title: "ผ้าซิ่นหัวแดงตีนแดง ลายนพเก้า: การแต่งกายที่สืบทอดจากรุ่นสู่รุ่น",
    category: "การแต่งกาย",
  },
  {
    fabricName: "ผ้ามัดหมี่ลายขอฯ ปลาเค้า",
    title: "ลายขอฯ ปลาเค้า: ลวดลายมัดหมี่แห่งอำเภอชำนิ",
    category: "ลวดลาย",
  },
  {
    fabricName: "ผ้าภูอัคนีลายดอกฝ้ายคำ",
    title: "ผ้าภูอัคนี ลายดอกฝ้ายคำ: เรื่องเล่าจากชุมชนเฉลิมพระเกียรติ",
    category: "ชุมชน",
  },
  {
    fabricName: "ผ้าโควา",
    title: "ผ้าโควา: ฝีมือช่างทอแห่งอำเภอโนนสุวรรณ",
    category: "ช่างทอ",
  },
  {
    fabricName: "ลายหางกระรอกคู่",
    title: "ลายหางกระรอกคู่: ผ้าในพิธีมงคลของชาวบุรีรัมย์",
    category: "พิธีกรรมและประเพณี",
  },
];

async function main() {
  let created = 0;
  for (const pick of PICKS) {
    const fabric = await prisma.fabric.findFirst({
      where: { name: pick.fabricName },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    });
    if (!fabric || !fabric.story) {
      console.warn(`⚠ ไม่พบผ้าหรือไม่มี story: ${pick.fabricName}`);
      continue;
    }

    const slug = pick.title
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      console.log(`ข้าม (มีอยู่แล้ว): ${pick.title}`);
      continue;
    }

    await prisma.article.create({
      data: {
        title: pick.title,
        slug,
        content: fabric.story,
        category: pick.category,
        coverUrl: fabric.images[0]?.url ?? null,
        relatedFabricId: fabric.id,
        isPublished: true,
      },
    });
    created++;
    console.log(`✓ สร้างบทความ: ${pick.title}`);
  }
  console.log(`\nสร้างบทความใหม่ทั้งหมด ${created} เรื่อง`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
