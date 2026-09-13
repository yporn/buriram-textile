// scripts/replace-identity-images.ts
// แทนที่รูปภาพผ้าอัตลักษณ์ทุกลายด้วยรูปชุดใหม่จาก "untitled folder/รูปภาพ2" บน Desktop
// รันครั้งเดียว ไม่ idempotent (ลบรูปเดิมของแต่ละผ้าทิ้งก่อนเสมอ) — เก็บสคริปต์ไว้เป็นหลักฐานที่มาของข้อมูล
//
// กติกาการแมป (ยืนยันกับผู้ใช้แล้วเมื่อ 2026-09-12):
// - อำเภอที่มีผ้าหลายลาย (กระสัง, พุทไธสง) → รูปชุดเดียวกันของอำเภอนั้นใช้กับทุกลาย
// - "Bเมืองบุรีรัมย์" → district "เมืองบุรีรัมย์" (ผ้าภูกระโดงเมืองแปะ)
// - "Aผ้าประจำจังหวัดบุรีรัมย์" → ข้าม (เป็นรูปผ้าประจำจังหวัด ไม่ผูกกับอำเภอ)
// - "ลำสตึก" → district "สตึก" (พิมพ์ผิด ไม่มีอำเภอชื่อ "ลำสตึก" จริง)
// - "บ้านด่าน05 (2).png" ซ้ำกับ "บ้านด่าน05.png" (เช็คแล้วเป็นภาพเดียวกัน) → ใช้แค่ไฟล์เดียว
//
// รันด้วย: npx tsx --env-file=.env scripts/replace-identity-images.ts

import { readdirSync, readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { supabaseAdmin, FABRIC_IMAGES_BUCKET } from "../src/lib/supabase-admin";

const SOURCE_DIR = "/Users/y.pornwisa/Desktop/untitled folder/รูปภาพ2";

const SKIP_PREFIXES = ["Aผ้าประจำจังหวัดบุรีรัมย์"];
const PREFIX_TO_DISTRICT: Record<string, string> = {
  Bเมืองบุรีรัมย์: "เมืองบุรีรัมย์",
  ลำสตึก: "สตึก",
};
const SKIP_FILES = new Set(["บ้านด่าน05 (2).png"]);

function mimeFor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

async function uploadImage(fileName: string): Promise<string | null> {
  const filePath = path.join(SOURCE_DIR, fileName);
  try {
    const bytes = readFileSync(filePath);
    const ext = fileName.split(".").pop()?.toLowerCase() || "png";
    const objectPath = `identity2/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(FABRIC_IMAGES_BUCKET)
      .upload(objectPath, bytes, { contentType: mimeFor(fileName), upsert: false });
    if (error) {
      console.warn(`  ⚠ อัปโหลดรูปไม่สำเร็จ (${fileName}):`, error.message);
      return null;
    }
    const { data } = supabaseAdmin.storage.from(FABRIC_IMAGES_BUCKET).getPublicUrl(objectPath);
    return data.publicUrl;
  } catch (e) {
    console.warn(`  ⚠ อ่านไฟล์รูปไม่สำเร็จ (${fileName}):`, e);
    return null;
  }
}

function groupFilesByPrefix(): Map<string, string[]> {
  const files = readdirSync(SOURCE_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  const groups = new Map<string, { file: string; n: number }[]>();

  for (const file of files) {
    if (SKIP_FILES.has(file)) continue;
    const match = file.match(/^(.*?)(\d+)(?: \(\d+\))?\.(png|jpg|jpeg|webp)$/i);
    if (!match) {
      console.warn(`  ⚠ ชื่อไฟล์ไม่ตรงรูปแบบที่คาด: ${file}`);
      continue;
    }
    const [, prefix, num] = match;
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix)!.push({ file, n: Number(num) });
  }

  const sorted = new Map<string, string[]>();
  for (const [prefix, entries] of groups) {
    entries.sort((a, b) => a.n - b.n);
    sorted.set(prefix, entries.map((e) => e.file));
  }
  return sorted;
}

async function main() {
  const groups = groupFilesByPrefix();

  console.log(`พบ ${groups.size} กลุ่มไฟล์ในโฟลเดอร์`);

  for (const [prefix, files] of groups) {
    if (SKIP_PREFIXES.includes(prefix)) {
      console.log(`⏭  ข้าม ${prefix} (${files.length} รูป) ตามที่ยืนยันไว้`);
      continue;
    }
    const district = PREFIX_TO_DISTRICT[prefix] ?? prefix;

    const community = await prisma.community.findFirst({ where: { district } });
    if (!community) {
      console.warn(`  ⚠ ไม่พบชุมชน/อำเภอ "${district}" (จากไฟล์ prefix "${prefix}") — ข้าม`);
      continue;
    }

    const fabrics = await prisma.fabric.findMany({
      where: { communityId: community.id },
      select: { id: true, name: true },
    });
    if (fabrics.length === 0) {
      console.warn(`  ⚠ อำเภอ "${district}" ไม่มีผ้าอัตลักษณ์ในฐานข้อมูล — ข้าม`);
      continue;
    }

    console.log(`\n[${district}] ${files.length} รูป → ${fabrics.length} ลาย (${fabrics.map((f) => f.name).join(", ")})`);

    // อัปโหลดรูปของอำเภอนี้ครั้งเดียว แล้วผูก URL เดียวกันให้ทุกลายในอำเภอ
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length === 0) {
      console.warn(`  ⚠ อัปโหลดรูปของ "${district}" ไม่สำเร็จเลยสักรูป — ข้าม ไม่ลบรูปเดิม`);
      continue;
    }

    for (const fabric of fabrics) {
      await prisma.$transaction(async (tx) => {
        await tx.fabricImage.deleteMany({ where: { fabricId: fabric.id } });
        await tx.fabricImage.createMany({
          data: uploadedUrls.map((url, index) => ({
            fabricId: fabric.id,
            url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      });
      console.log(`  ✓ ${fabric.name} — แทนที่ด้วย ${uploadedUrls.length} รูป`);
    }
  }

  console.log("\nเสร็จเรียบร้อย");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
