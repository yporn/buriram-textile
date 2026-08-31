// ===================================================================
// POST /api/feedback
// upsert Feedback ต่อ 1 session (unique on sessionId)
// รับ isRelevant (บังคับ) + comment (ไม่บังคับ)
// ===================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingBody = {
  sessionId?: unknown;
  isRelevant?: unknown;
  comment?: unknown;
};

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.sessionId !== "string" || body.sessionId.length === 0) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }
  if (typeof body.isRelevant !== "boolean") {
    return NextResponse.json(
      { error: "isRelevant must be boolean" },
      { status: 400 }
    );
  }

  const sessionId = body.sessionId;
  const isRelevant = body.isRelevant;
  const comment =
    typeof body.comment === "string" && body.comment.trim().length > 0
      ? body.comment.trim()
      : null;

  const session = await prisma.recommendationSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!session) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  try {
    await prisma.feedback.upsert({
      where: { sessionId },
      update: { isRelevant, comment },
      create: { sessionId, isRelevant, comment },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/feedback failed:", err);
    return NextResponse.json(
      { error: "internal error saving feedback" },
      { status: 500 }
    );
  }
}
