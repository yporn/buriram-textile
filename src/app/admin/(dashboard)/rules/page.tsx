import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  conditionFieldLabel,
  conditionValueLabel,
} from "@/lib/admin/rule-options";
import { RuleRowActions } from "./RuleRowActions";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

async function getData() {
  const [rules, settings, tags] = await Promise.all([
    prisma.inferenceRule.findMany({
      orderBy: [{ code: "asc" }],
      include: { thenTag: { include: { category: true } } },
    }),
    prisma.recommenderSetting.findUnique({ where: { id: "singleton" } }),
    prisma.tag.findMany({ select: { code: true, nameTh: true } }),
  ]);
  return { rules, settings, tags };
}

export default async function AdminRulesPage() {
  const { rules, settings, tags } = await getData();
  const tagLabelByCode = new Map(tags.map((t) => [t.code, t.nameTh]));
  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-walnut text-2xl">กฎการแนะนำ</h1>
          <p className="text-sm text-umber mt-1">
            ทั้งหมด {rules.length} ข้อ · เปิดใช้งาน {activeCount} ข้อ
          </p>
        </div>
        <Link
          href="/admin/rules/new"
          className="bg-rust text-clay font-medium px-5 py-2.5 rounded-sm hover:bg-[#5C230F] transition"
        >
          + เพิ่มกฎใหม่
        </Link>
      </div>

      <SettingsForm
        initial={{
          baseWeight: settings?.baseWeight ?? 0.6,
          ruleWeight: settings?.ruleWeight ?? 0.4,
          budgetTolerance: settings?.budgetTolerance ?? 0.2,
        }}
      />

      {rules.length === 0 ? (
        <p className="text-umber italic">
          ยังไม่มีกฎในระบบ — รัน{" "}
          <code className="text-xs bg-clay-deep/60 px-1.5 py-0.5 rounded-sm">
            npx tsx prisma/seed-rules.ts
          </code>{" "}
          เพื่อใส่ชุดตั้งต้น หรือกดเพิ่มกฎใหม่
        </p>
      ) : (
        <div className="bg-clay border border-clay-deep rounded-sm divide-y divide-clay-deep">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`p-4 flex items-start justify-between gap-4 flex-wrap ${
                r.isActive ? "" : "opacity-55"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-heading text-walnut">{r.code}</span>
                  <span className="text-walnut text-sm">{r.nameTh}</span>
                  <span className="font-heading text-rust text-sm">
                    +{Math.round(r.weight * 100)}%
                  </span>
                  {!r.isActive && (
                    <span className="text-[11px] text-umber border border-clay-deep rounded-sm px-1.5 py-0.5">
                      ปิดใช้งาน
                    </span>
                  )}
                </div>
                <p className="text-xs text-umber mt-1.5 leading-relaxed">
                  <span className="text-umber-deep">IF</span>{" "}
                  {conditionFieldLabel(r.conditionField)} ={" "}
                  {conditionValueLabel(r.conditionField, r.conditionValue, tagLabelByCode)}{" "}
                  <span className="text-umber-deep">➔ THEN</span>{" "}
                  {r.thenTag.category.nameTh} · {r.thenTag.nameTh}
                </p>
                <p className="text-xs text-umber/80 mt-1 italic">{r.explanationTh}</p>
              </div>
              <RuleRowActions ruleId={r.id} code={r.code} isActive={r.isActive} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
