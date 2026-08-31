// รันครั้งเดียวตอน setup โปรเจกต์ใหม่ — สร้าง Supabase Storage bucket สำหรับรูปผ้า
// ใช้: npx tsx --env-file=.env scripts/setup-storage.ts

import { supabaseAdmin, FABRIC_IMAGES_BUCKET } from "../src/lib/supabase-admin";

async function main() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) throw listError;

  const exists = buckets?.some((b) => b.name === FABRIC_IMAGES_BUCKET);
  if (exists) {
    console.log(`Bucket "${FABRIC_IMAGES_BUCKET}" มีอยู่แล้ว ข้ามการสร้าง`);
    return;
  }

  const { error } = await supabaseAdmin.storage.createBucket(FABRIC_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (error) throw error;

  console.log(`สร้าง bucket "${FABRIC_IMAGES_BUCKET}" (public) สำเร็จ`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
