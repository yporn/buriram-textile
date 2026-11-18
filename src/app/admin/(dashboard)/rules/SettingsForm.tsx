"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INPUT_CLASS =
  "w-full bg-clay border border-clay-deep rounded-sm px-3 py-2 text-walnut focus:outline-none focus:border-umber-deep";

export function SettingsForm({
  initial,
}: {
  initial: { baseWeight: number; ruleWeight: number; budgetTolerance: number };
}) {
  const router = useRouter();
  const [baseWeight, setBaseWeight] = useState(String(initial.baseWeight));
  const [ruleWeight, setRuleWeight] = useState(String(initial.ruleWeight));
  const [budgetTolerance, setBudgetTolerance] = useState(String(initial.budgetTolerance));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ให้ช่องสองช่องนี้บวกกันได้ 1 เสมอ — ปรับช่องหนึ่งแล้วอีกช่องขยับตาม
  function changeBase(v: string) {
    setBaseWeight(v);
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && n <= 1) {
      setRuleWeight((1 - n).toFixed(2));
    }
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/recommender-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseWeight: Number(baseWeight),
          ruleWeight: Number(ruleWeight),
          budgetTolerance: Number(budgetTolerance),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-clay border border-clay-deep rounded-sm p-5 mb-6"
    >
      <h2 className="font-heading text-walnut text-base mb-1">ค่าถ่วงน้ำหนักของสูตรคะแนน</h2>
      <p className="text-xs text-umber mb-4 leading-relaxed">
        คะแนนรวม = (น้ำหนักคะแนนเดิม × คะแนนจับคู่คุณลักษณะ) + (น้ำหนักคะแนนกฎ × คะแนนจากกฎ)
        <br />
        การแก้ค่าตรงนี้มีผลกับการแนะนำครั้งถัดไปเท่านั้น ผลลัพธ์ที่บันทึกไปแล้วจะไม่เปลี่ยนย้อนหลัง
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="น้ำหนักคะแนนเดิม">
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={baseWeight}
            onChange={(e) => changeBase(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="น้ำหนักคะแนนกฎ (ปรับอัตโนมัติ)">
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={ruleWeight}
            onChange={(e) => {
              setRuleWeight(e.target.value);
              setSaved(false);
            }}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="ผ่อนผันงบประมาณ (0.2 = เกินได้ 20%)">
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={budgetTolerance}
            onChange={(e) => {
              setBudgetTolerance(e.target.value);
              setSaved(false);
            }}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-rust bg-rust/5 border border-rust/30 rounded-sm px-4 py-2 mt-4">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-rust text-clay font-medium px-5 py-2 rounded-sm hover:bg-[#5C230F] disabled:opacity-50 transition text-sm"
        >
          {submitting ? "กำลังบันทึก..." : "บันทึกค่าน้ำหนัก"}
        </button>
        {saved && <span className="text-xs text-ochre-text">บันทึกแล้ว</span>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-umber block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
