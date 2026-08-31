// PATCH /api/admin/fabrics/[id]/publish — toggle เผยแพร่/ซ่อน อย่างเดียว (ไม่แตะ field อื่น)
// แยกจาก PATCH หลัก เพื่อให้ปุ่ม toggle ในตารางรายการไม่ต้องส่ง payload เต็มฟอร์ม

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { isPublished?: unknown };
  try {
    body = (await req.json()) as { isPublished?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof body.isPublished !== "boolean") {
    return NextResponse.json({ error: "isPublished must be boolean" }, { status: 400 });
  }

  try {
    await prisma.fabric.update({
      where: { id },
      data: { isPublished: body.isPublished },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/admin/fabrics/${id}/publish failed:`, err);
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
}
