// scripts/seed-identity-fabrics.ts
// นำเข้าลายผ้าอัตลักษณ์ 28 อำเภอ (ข้อมูลจริงจากสำนักงานวัฒนธรรมจังหวัดบุรีรัมย์)
// แทนที่ข้อมูลทดสอบเดิมทั้งหมด — รันครั้งเดียว ไม่ idempotent (ลบของเก่าทิ้งก่อนเสมอ)
// รันไปแล้วครั้งหนึ่งเมื่อ 2026-08-23 — เก็บสคริปต์ไว้เป็นหลักฐานที่มาของข้อมูล ไม่ได้มีไว้รันซ้ำ
//
// อ่านข้อมูลที่แปลงจาก docs/*.docx (พาร์สด้วย python ชั่วคราว ไม่ได้เก็บสคริปต์แปลงไว้)
// ไว้ที่ /tmp/merged_fabrics.json และ /tmp/communities.json — ไฟล์เหล่านี้เป็นไฟล์ชั่วคราว
// ที่ถูกลบไปแล้วหลัง seed เสร็จ ถ้าต้องการรันใหม่ต้องแตกไฟล์ .docx แล้วสร้างไฟล์ JSON ทั้งสองใหม่ก่อน
// รันด้วย: npx tsx --env-file=.env scripts/seed-identity-fabrics.ts

import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { supabaseAdmin, FABRIC_IMAGES_BUCKET } from "../src/lib/supabase-admin";

const DEFAULT_PRICE_THB = 3500;

type FabricRecord = {
  name: string;
  district: string;
  images: string[]; // absolute file paths บนเครื่อง
  tags: string[]; // tag codes
  final_description: string;
  final_story: string;
};

type CommunityRecord = {
  district: string;
  name: string;
  story: string;
};

function mimeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

async function uploadImage(filePath: string): Promise<string | null> {
  try {
    const bytes = readFileSync(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() || "png";
    const objectPath = `identity/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(FABRIC_IMAGES_BUCKET)
      .upload(objectPath, bytes, { contentType: mimeFor(filePath), upsert: false });
    if (error) {
      console.warn(`  ⚠ อัปโหลดรูปไม่สำเร็จ (${filePath}):`, error.message);
      return null;
    }
    const { data } = supabaseAdmin.storage.from(FABRIC_IMAGES_BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  } catch (e) {
    console.warn(`  ⚠ อ่านไฟล์รูปไม่สำเร็จ (${filePath}):`, e);
    return null;
  }
}

async function main() {
  const fabrics: FabricRecord[] = JSON.parse(
    readFileSync("/tmp/merged_fabrics.json", "utf-8")
  );
  const communities: CommunityRecord[] = JSON.parse(
    readFileSync("/tmp/communities.json", "utf-8")
  );

  console.log(`โหลดข้อมูล: ${communities.length} ชุมชน, ${fabrics.length} ผ้า`);

  // ---------- 1) ลบข้อมูลผ้า/ชุมชนเดิมทั้งหมด ----------
  // ลบ Fabric ก่อน (cascade ลบ FabricTag/FabricImage/Favorite/RecommendationResult ที่ผูกอยู่)
  const deletedFabrics = await prisma.fabric.deleteMany({});
  const deletedCommunities = await prisma.community.deleteMany({});
  console.log(`ลบข้อมูลเดิม: ผ้า ${deletedFabrics.count} ผืน, ชุมชน ${deletedCommunities.count} กลุ่ม`);

  // ---------- 2) สร้างชุมชน 23 อำเภอ ----------
  const communityIdByDistrict = new Map<string, string>();
  for (const c of communities) {
    const created = await prisma.community.create({
      data: { name: c.name, district: c.district, story: c.story || null },
    });
    communityIdByDistrict.set(c.district, created.id);
  }
  console.log(`สร้างชุมชนแล้ว ${communityIdByDistrict.size} กลุ่ม`);

  // ---------- 3) เตรียม tag id map ----------
  const allTags = await prisma.tag.findMany({ select: { id: true, code: true } });
  const tagIdByCode = new Map(allTags.map((t) => [t.code, t.id]));

  // ---------- 4) สร้างผ้าทีละผืน พร้อมอัปโหลดรูป ----------
  let fabricCount = 0;
  let imageCount = 0;
  let imageFailCount = 0;

  for (const f of fabrics) {
    const communityId = communityIdByDistrict.get(f.district) ?? null;

    const fabric = await prisma.fabric.create({
      data: {
        name: f.name,
        description: f.final_description || f.name,
        story: f.final_story || null,
        priceThb: DEFAULT_PRICE_THB,
        communityId,
      },
    });
    fabricCount++;

    // tag
    const tagIds = f.tags
      .map((code) => tagIdByCode.get(code))
      .filter((id): id is string => Boolean(id));
    if (tagIds.length > 0) {
      await prisma.fabricTag.createMany({
        data: tagIds.map((tagId) => ({ fabricId: fabric.id, tagId })),
        skipDuplicates: true,
      });
    }

    // รูป — อัปโหลดทีละไฟล์ รูปแรกเป็น primary
    for (const [i, filePath] of f.images.entries()) {
      const url = await uploadImage(filePath);
      if (!url) {
        imageFailCount++;
        continue;
      }
      await prisma.fabricImage.create({
        data: {
          fabricId: fabric.id,
          url,
          isPrimary: i === 0,
          sortOrder: i,
        },
      });
      imageCount++;
    }

    console.log(`  ✓ [${f.district}] ${f.name} — ${f.images.length} รูป, ${tagIds.length} tag`);
  }

  console.log("\n สรุป:");
  console.log(`  ผ้า: ${fabricCount} ผืน`);
  console.log(`  รูปภาพ: อัปโหลดสำเร็จ ${imageCount} รูป, ล้มเหลว ${imageFailCount} รูป`);
  console.log("เสร็จเรียบร้อย — เข้าไปตรวจสอบ/แก้ราคาได้ที่ /admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
