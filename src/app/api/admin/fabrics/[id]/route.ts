import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseFabricBody } from "@/lib/admin/fabric-input";

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

  const parsed = parseFabricBody(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, description, story, priceThb, communityId, isPublished, imageUrls, tagIds } =
    parsed.data;

  const existing = await prisma.fabric.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบผ้าที่ต้องการแก้ไข" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.fabric.update({
        where: { id },
        data: { name, description, story, priceThb, communityId, isPublished },
      });

      // รูป: ล้างของเดิมแล้วสร้างใหม่ตามลำดับที่ฟอร์มส่งมา รูปแรก = primary
      await tx.fabricImage.deleteMany({ where: { fabricId: id } });
      if (imageUrls.length > 0) {
        await tx.fabricImage.createMany({
          data: imageUrls.map((url, index) => ({
            fabricId: id,
            url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      }

      // Tag: ล้างของเดิมแล้วสร้างใหม่ตามที่ฟอร์มส่งมา (ง่ายกว่า diff และปริมาณ tag ต่อผ้าน้อย)
      await tx.fabricTag.deleteMany({ where: { fabricId: id } });
      if (tagIds.length > 0) {
        await tx.fabricTag.createMany({
          data: tagIds.map((tagId) => ({ fabricId: id, tagId })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`PATCH /api/admin/fabrics/${id} failed:`, err);
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
    await prisma.fabric.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/admin/fabrics/${id} failed:`, err);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
