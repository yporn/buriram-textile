import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseCommunityBody } from "@/lib/admin/community-input";

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

  const parsed = parseCommunityBody(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await prisma.community.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/admin/communities/${id} failed:`, err);
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
    await prisma.community.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Foreign key violation — ยังมีผ้าผูกอยู่กับชุมชนนี้
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "ลบไม่ได้ เพราะยังมีผ้าที่ผูกกับชุมชนนี้อยู่ กรุณาย้ายหรือลบผ้าก่อน" },
        { status: 409 }
      );
    }
    console.error(`DELETE /api/admin/communities/${id} failed:`, err);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
