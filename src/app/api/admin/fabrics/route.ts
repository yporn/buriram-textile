// POST /api/admin/fabrics — สร้างผ้าใหม่ (ตรวจ auth ซ้ำแม้ proxy.ts จะกัน /admin ไว้แล้ว)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseFabricBody } from "@/lib/admin/fabric-input";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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

  try {
    const fabric = await prisma.$transaction(async (tx) => {
      const created = await tx.fabric.create({
        data: { name, description, story, priceThb, communityId, isPublished },
      });

      if (imageUrls.length > 0) {
        await tx.fabricImage.createMany({
          data: imageUrls.map((url, index) => ({
            fabricId: created.id,
            url,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      }

      if (tagIds.length > 0) {
        await tx.fabricTag.createMany({
          data: tagIds.map((tagId) => ({ fabricId: created.id, tagId })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return NextResponse.json({ id: fabric.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/fabrics failed:", err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
