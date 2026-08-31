// POST /api/admin/upload — รับไฟล์รูปผ้า อัปโหลดเข้า Supabase Storage คืน public URL
// ใช้ service_role key ฝั่ง server เท่านั้น (src/lib/supabase-admin.ts)

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin, FABRIC_IMAGES_BUCKET } from "@/lib/supabase-admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFor(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const path = `${crypto.randomUUID()}.${extensionFor(file.type)}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FABRIC_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Supabase Storage upload failed:", uploadError);
    return NextResponse.json({ error: "อัปโหลดรูปไม่สำเร็จ" }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(FABRIC_IMAGES_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
