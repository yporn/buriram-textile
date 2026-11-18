import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseRuleBody } from "@/lib/admin/rule-input";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;

  // สลับเปิด/ปิดใช้งานอย่างเดียว (จากปุ่มในตาราง) — ไม่ต้องส่งทั้งฟอร์มมา
  if (Object.keys(raw).length === 1 && typeof raw.isActive === "boolean") {
    try {
      await prisma.inferenceRule.update({
        where: { id },
        data: { isActive: raw.isActive },
      });
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error(`PATCH /api/admin/rules/${id} (toggle) failed:`, err);
      return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
    }
  }

  const parsed = parseRuleBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await prisma.inferenceRule.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: `มีกฎรหัส "${parsed.data.code}" อยู่แล้ว กรุณาใช้รหัสอื่น` },
        { status: 409 }
      );
    }
    console.error(`PATCH /api/admin/rules/${id} failed:`, err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    await prisma.inferenceRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/admin/rules/${id} failed:`, err);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
