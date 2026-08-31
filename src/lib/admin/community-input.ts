export type ParsedCommunityInput = {
  name: string;
  district: string;
  story: string | null;
  contact: string | null;
};

export function parseCommunityBody(
  body: Record<string, unknown>
): { ok: true; data: ParsedCommunityInput } | { ok: false; error: string } {
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกชื่อชุมชน" };
  }
  if (typeof body.district !== "string" || body.district.trim().length === 0) {
    return { ok: false, error: "กรุณากรอกอำเภอ" };
  }
  return {
    ok: true,
    data: {
      name: body.name.trim(),
      district: body.district.trim(),
      story:
        typeof body.story === "string" && body.story.trim().length > 0
          ? body.story.trim()
          : null,
      contact:
        typeof body.contact === "string" && body.contact.trim().length > 0
          ? body.contact.trim()
          : null,
    },
  };
}
