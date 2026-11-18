"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONDITION_FIELD_OPTIONS,
  CONDITION_VALUE_OPTIONS,
  TAG_CONDITION_CATEGORIES,
  TAG_CONDITION_FIELDS,
} from "@/lib/admin/rule-options";

const INPUT_CLASS =
  "w-full bg-clay border border-clay-deep rounded-sm px-3 py-2 text-walnut focus:outline-none focus:border-umber-deep";

export type TagOption = {
  id: string;
  code: string;
  nameTh: string;
  categoryCode: string;
  categoryNameTh: string;
};

export type RuleFormInitial = {
  code: string;
  nameTh: string;
  conditionField: string;
  conditionValue: string;
  thenTagId: string;
  weight: number;
  explanationTh: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY: RuleFormInitial = {
  code: "",
  nameTh: "",
  conditionField: "SKIN_TONE",
  conditionValue: "",
  thenTagId: "",
  weight: 0.3,
  explanationTh: "",
  isActive: true,
  sortOrder: 0,
};

export function RuleForm({
  mode,
  ruleId,
  initial,
  tags,
}: {
  mode: "create" | "edit";
  ruleId?: string;
  initial?: RuleFormInitial;
  tags: TagOption[];
}) {
  const router = useRouter();
  const base = initial ?? EMPTY;

  const [code, setCode] = useState(base.code);
  const [nameTh, setNameTh] = useState(base.nameTh);
  const [conditionField, setConditionField] = useState(base.conditionField);
  const [conditionValue, setConditionValue] = useState(base.conditionValue);
  const [thenTagId, setThenTagId] = useState(base.thenTagId);
  const [weight, setWeight] = useState(String(base.weight));
  const [explanationTh, setExplanationTh] = useState(base.explanationTh);
  const [isActive, setIsActive] = useState(base.isActive);
  const [sortOrder, setSortOrder] = useState(String(base.sortOrder));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTagCondition = TAG_CONDITION_FIELDS.includes(conditionField);
  const conditionTagOptions = isTagCondition
    ? tags.filter((t) =>
        (TAG_CONDITION_CATEGORIES[conditionField] ?? []).includes(t.categoryCode)
      )
    : [];
  const enumOptions = CONDITION_VALUE_OPTIONS[conditionField] ?? [];

  // เปลี่ยนชนิดเงื่อนไขแล้วค่าเดิมใช้ไม่ได้อีก — ล้างทิ้งเพื่อบังคับให้เลือกใหม่
  function changeConditionField(next: string) {
    setConditionField(next);
    setConditionValue("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = mode === "create" ? "/api/admin/rules" : `/api/admin/rules/${ruleId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          nameTh,
          conditionField,
          conditionValue,
          thenTagId,
          weight: Number(weight),
          explanationTh,
          isActive,
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      }
      router.push("/admin/rules");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="bg-clay border border-clay-deep rounded-sm p-5 space-y-4">
        <div className="grid sm:grid-cols-[140px_1fr] gap-4">
          <Field label="รหัสกฎ">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="R001"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="ชื่อกฎ">
            <input
              value={nameTh}
              onChange={(e) => setNameTh(e.target.value)}
              required
              placeholder="งานราชการ เลือกลายเชิงวัฒนธรรม"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="border-t border-clay-deep pt-4">
          <p className="font-heading text-walnut text-sm mb-3">
            เงื่อนไข (IF) — ผู้ใช้ต้องมีคุณสมบัตินี้
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="ประเภทเงื่อนไข">
              <select
                value={conditionField}
                onChange={(e) => changeConditionField(e.target.value)}
                className={INPUT_CLASS}
              >
                {CONDITION_FIELD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ค่าของเงื่อนไข">
              <select
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                required
                className={INPUT_CLASS}
              >
                <option value="">— เลือก —</option>
                {isTagCondition
                  ? conditionTagOptions.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.categoryNameTh} · {t.nameTh}
                      </option>
                    ))
                  : enumOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="border-t border-clay-deep pt-4">
          <p className="font-heading text-walnut text-sm mb-3">
            ผลลัพธ์ (THEN) — ผ้าที่มีคุณลักษณะนี้จะได้คะแนนเพิ่ม
          </p>
          <div className="grid sm:grid-cols-[1fr_140px] gap-4">
            <Field label="คุณลักษณะผ้าปลายทาง">
              <select
                value={thenTagId}
                onChange={(e) => setThenTagId(e.target.value)}
                required
                className={INPUT_CLASS}
              >
                <option value="">— เลือก —</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.categoryNameTh} · {t.nameTh}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="น้ำหนัก (0.01–1.00)">
              <input
                type="number"
                step="0.05"
                min="0.01"
                max="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>

        <Field label="คำอธิบายเหตุผล (แสดงใน Rule Trace ให้ผู้ใช้เห็น)">
          <textarea
            value={explanationTh}
            onChange={(e) => setExplanationTh(e.target.value)}
            required
            rows={2}
            placeholder="ลายที่มีความหมายเชิงวัฒนธรรม เสริมยศตำแหน่งในงานทางการ"
            className={INPUT_CLASS}
          />
        </Field>

        <div className="grid sm:grid-cols-[140px_1fr] gap-4 items-end">
          <Field label="ลำดับการแสดง">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <label className="flex items-center gap-2.5 pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#7A3016]"
            />
            <span className="text-sm text-umber">เปิดใช้งานกฎข้อนี้</span>
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm text-rust bg-rust/5 border border-rust/30 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-rust text-clay font-medium px-6 py-2.5 rounded-sm hover:bg-[#5C230F] disabled:opacity-50 transition"
      >
        {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มกฎ" : "บันทึกการแก้ไข"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-umber block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
