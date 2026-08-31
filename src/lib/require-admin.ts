// ใช้เฉพาะใน Route Handler เท่านั้น (ต้องมี request context ให้ next/headers)
// ห้าม import จาก proxy.ts — ที่นั่นอ่าน cookie ผ่าน NextRequest โดยตรงแทน
//
// เช็คซ้ำในทุก route handler แม้ proxy.ts จะกัน /admin/* ไว้แล้ว
// ตาม Next.js docs: อย่าพึ่ง proxy อย่างเดียวสำหรับ auth เพราะ matcher เปลี่ยนแล้วรูรั่วเงียบได้

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "./admin-auth";

export async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
