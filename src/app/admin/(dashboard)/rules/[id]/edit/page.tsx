import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RuleForm, type TagOption } from "../../RuleForm";

export const dynamic = "force-dynamic";

export default async function EditRulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rule, tags] = await Promise.all([
    prisma.inferenceRule.findUnique({ where: { id } }),
    prisma.tag.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { category: true },
    }),
  ]);

  if (!rule) notFound();

  const tagOptions: TagOption[] = tags.map((t) => ({
    id: t.id,
    code: t.code,
    nameTh: t.nameTh,
    categoryCode: t.category.code,
    categoryNameTh: t.category.nameTh,
  }));

  return (
    <div>
      <Link
        href="/admin/rules"
        className="text-sm text-rust underline underline-offset-4 hover:text-walnut"
      >
        ← กลับไปรายการกฎ
      </Link>
      <h1 className="font-heading text-walnut text-2xl mt-4 mb-6">
        แก้ไขกฎ {rule.code}
      </h1>
      <RuleForm
        mode="edit"
        ruleId={rule.id}
        tags={tagOptions}
        initial={{
          code: rule.code,
          nameTh: rule.nameTh,
          conditionField: rule.conditionField,
          conditionValue: rule.conditionValue,
          thenTagId: rule.thenTagId,
          weight: rule.weight,
          explanationTh: rule.explanationTh,
          isActive: rule.isActive,
          sortOrder: rule.sortOrder,
        }}
      />
    </div>
  );
}
