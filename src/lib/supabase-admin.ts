// Supabase client สิทธิ์ service_role — ใช้ฝั่ง server เท่านั้น (admin routes)
// ห้าม import ไฟล์นี้จาก Client Component เด็ดขาด — service_role bypass RLS ทั้งหมด

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const FABRIC_IMAGES_BUCKET = "fabric-images";
