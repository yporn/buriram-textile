export type ParsedArticleInput = {
  title: string;
  slug: string;
  content: string;
  category: string | null;
  coverUrl: string | null;
  relatedFabricId: string | null;
  isPublished: boolean;
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // รองรับอักษรไทย — แทนอักขระที่ไม่ใช่ตัวอักษร/ตัวเลขด้วย -
    .replace(/^-+|-+$/g, "");
}

export function parseArticleBody(
  body: Record<string, unknown>
): { ok: true; data: ParsedArticleInput } | { ok: false; error: string } {
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกชื่อบทความ" };
  }
  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกเนื้อหาบทความ" };
  }

  const rawSlug = typeof body.slug === "string" && body.slug.trim().length > 0
    ? body.slug
    : body.title;
  const slug = slugify(rawSlug);
  if (slug.length === 0) {
    return { ok: false, error: "slug ไม่ถูกต้อง กรุณาระบุชื่อที่มีตัวอักษรหรือตัวเลข" };
  }

  return {
    ok: true,
    data: {
      title: body.title.trim(),
      slug,
      content: body.content.trim(),
      category:
        typeof body.category === "string" && body.category.trim().length > 0
          ? body.category.trim()
          : null,
      coverUrl:
        typeof body.coverUrl === "string" && body.coverUrl.length > 0
          ? body.coverUrl
          : null,
      relatedFabricId:
        typeof body.relatedFabricId === "string" && body.relatedFabricId.length > 0
          ? body.relatedFabricId
          : null,
      isPublished: typeof body.isPublished === "boolean" ? body.isPublished : false,
    },
  };
}
