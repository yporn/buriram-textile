import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RuleForm, type TagOption } from "../RuleForm";

export const dynamic = "force-dynamic";

async function getTags(): Promise<TagOption[]> {
  const tags = await prisma.tag.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: true },
  });
  return tags.map((t) => ({
    id: t.id,
    code: t.code,
    nameTh: t.nameTh,
    categoryCode: t.category.code,
    categoryNameTh: t.category.nameTh,
  }));
}

export default async function NewRulePage() {
  const tags = await getTags();

  return (
    <div>
      <Link
        href="/admin/rules"
        className="text-sm text-rust underline underline-offset-4 hover:text-walnut"
      >
        ← กลับไปรายการกฎ
      </Link>
      <h1 className="font-heading text-walnut text-2xl mt-4 mb-6">เพิ่มกฎใหม่</h1>
      <RuleForm mode="create" tags={tags} />
    </div>
  );
}
