export type ParsedFabricInput = {
  name: string;
  description: string;
  story: string | null;
  priceThb: number;
  communityId: string | null;
  isPublished: boolean;
  imageUrls: string[];
  tagIds: string[];
};

export function parseFabricBody(
  body: Record<string, unknown>
): { ok: true; data: ParsedFabricInput } | { ok: false; error: string } {
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกชื่อผ้า" };
  }
  if (typeof body.description !== "string" || body.description.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกคำอธิบาย" };
  }
  if (
    typeof body.priceThb !== "number" ||
    !Number.isFinite(body.priceThb) ||
    body.priceThb < 0
  ) {
    return { ok: false, error: "ราคาต้องเป็นตัวเลขที่ไม่ติดลบ" };
  }
  const tagIds = Array.isArray(body.tagIds)
    ? body.tagIds.filter((t): t is string => typeof t === "string")
    : [];

  return {
    ok: true,
    data: {
      name: body.name.trim(),
      description: body.description.trim(),
      story:
        typeof body.story === "string" && body.story.trim().length > 0
          ? body.story.trim()
          : null,
      priceThb: Math.trunc(body.priceThb),
      communityId:
        typeof body.communityId === "string" && body.communityId.length > 0
          ? body.communityId
          : null,
      isPublished: typeof body.isPublished === "boolean" ? body.isPublished : true,
      imageUrls: Array.isArray(body.imageUrls)
        ? body.imageUrls.filter(
            (u): u is string => typeof u === "string" && u.length > 0
          )
        : [],
      tagIds,
    },
  };
}
