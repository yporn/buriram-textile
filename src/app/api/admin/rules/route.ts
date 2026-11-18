import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { parseRuleBody } from "@/lib/admin/rule-input";

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

  const parsed = parseRuleBody(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const rule = await prisma.inferenceRule.create({ data: parsed.data });
    return NextResponse.json({ id: rule.id }, { status: 201 });
  } catch (err) {
    // รหัสกฎซ้ำ
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: `มีกฎรหัส "${parsed.data.code}" อยู่แล้ว กรุณาใช้รหัสอื่น` },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/rules failed:", err);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
