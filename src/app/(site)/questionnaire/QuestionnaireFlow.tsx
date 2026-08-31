"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// =====================================================================
// Types (props จาก Server)
// =====================================================================

export type TagInput = {
  id: string;
  code: string;
  nameTh: string;
  description: string | null;
};

export type CategoryTagsInput = {
  code: string; // occasion | color_tone | pattern | material
  nameTh: string;
  question: string;
  multiple: boolean;
  tags: TagInput[];
};

export type DecisionFactorInput = {
  id: string;
  code: string;
  nameTh: string;
};

// =====================================================================
// ตัวเลือกที่ hardcode (ไม่ได้อยู่ใน DB — เป็น enum/preset ตามแบบสอบถาม)
// =====================================================================

const GENDER_OPTIONS = [
  { value: "MALE", label: "ชาย" },
  { value: "FEMALE", label: "หญิง" },
  { value: "UNSPECIFIED", label: "ไม่ต้องการระบุ" },
] as const;

const AGE_OPTIONS = [
  { value: "UNDER_20", label: "ต่ำกว่า 20 ปี" },
  { value: "AGE_21_30", label: "21–30 ปี" },
  { value: "AGE_31_40", label: "31–40 ปี" },
  { value: "AGE_41_50", label: "41–50 ปี" },
  { value: "OVER_50", label: "มากกว่า 50 ปี" },
] as const;

const OCCUPATION_OPTIONS = [
  { value: "STUDENT", label: "นักเรียน/นักศึกษา" },
  { value: "CIVIL_SERVANT", label: "ข้าราชการ/พนักงานรัฐวิสาหกิจ" },
  { value: "COMPANY_EMPLOYEE", label: "พนักงานบริษัท" },
  { value: "BUSINESS_OWNER", label: "ประกอบธุรกิจส่วนตัว/เจ้าของกิจการ" },
  { value: "HOMEMAKER", label: "แม่บ้าน/พ่อบ้าน" },
  { value: "OTHER", label: "อื่น ๆ" },
] as const;

const INCOME_OPTIONS = [
  { value: "UNDER_10K", label: "ต่ำกว่า 10,000 บาท" },
  { value: "RANGE_10K_20K", label: "10,001–20,000 บาท" },
  { value: "RANGE_20K_30K", label: "20,001–30,000 บาท" },
  { value: "RANGE_30K_40K", label: "30,001–40,000 บาท" },
  { value: "RANGE_40K_50K", label: "40,001–50,000 บาท" },
  { value: "OVER_50K", label: "มากกว่า 50,000 บาท" },
] as const;

const USAGE_FREQUENCY_OPTIONS = [
  { value: "REGULAR", label: "เคยใช้เป็นประจำ" },
  { value: "SOMETIMES", label: "เคยใช้บางครั้ง" },
  { value: "RARELY", label: "เคยใช้นาน ๆ ครั้ง" },
  { value: "NEVER_BUT_INTERESTED", label: "ไม่เคยใช้ แต่สนใจ" },
] as const;

const BUDGET_OPTIONS = [
  { key: "under_500", label: "ต่ำกว่า 500 บาท", min: null, max: 500 },
  { key: "500_1500", label: "500–1,500 บาท", min: 500, max: 1500 },
  { key: "1500_3000", label: "1,501–3,000 บาท", min: 1500, max: 3000 },
  { key: "3000_5000", label: "3,001–5,000 บาท", min: 3000, max: 5000 },
  { key: "over_5000", label: "มากกว่า 5,000 บาท", min: 5000, max: null },
] as const;

const LIKERT_PREFERENCE = [
  { score: 5, label: "ชอบมากที่สุด" },
  { score: 4, label: "ชอบมาก" },
  { score: 3, label: "ปานกลาง" },
  { score: 2, label: "ชอบน้อย" },
  { score: 1, label: "ไม่ชอบ" },
] as const;

const LIKERT_IMPORTANCE = [
  { score: 5, label: "สำคัญมากที่สุด" },
  { score: 4, label: "สำคัญมาก" },
  { score: 3, label: "ปานกลาง" },
  { score: 2, label: "สำคัญน้อย" },
  { score: 1, label: "ไม่สำคัญ" },
] as const;

// =====================================================================
// State + payload
// =====================================================================

type DemographicsState = {
  gender: string | null;
  ageRange: string | null;
  occupation: string | null;
  monthlyIncome: string | null;
};

type BehaviorState = {
  pastUsageFreq: string | null;
  occasionTagIds: string[];
  budgetKey: string | null;
};

type RatingsState = Record<string, number>; // id → 1..5

export type SubmitPayload = {
  gender: string | null;
  ageRange: string | null;
  occupation: string | null;
  monthlyIncome: string | null;
  pastUsageFreq: string | null;
  occasionTagIds: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  tagRatings: { tagId: string; score: number }[]; // ตอนที่ 3
  factorRatings: { factorId: string; score: number }[]; // ตอนที่ 4
};

const PART_TITLES = [
  "ตอนที่ 1 · ข้อมูลทั่วไป",
  "ตอนที่ 2 · พฤติกรรมและความชอบในการเลือกใช้ผ้าทอ",
  "ตอนที่ 3 · ความชอบด้านลวดลาย สี และรูปแบบ",
  "ตอนที่ 4 · ปัจจัยที่มีผลต่อการตัดสินใจเลือกผ้าทอพื้นบ้าน",
];

// =====================================================================
// Main component
// =====================================================================

export function QuestionnaireFlow({
  categories,
  factors,
}: {
  categories: CategoryTagsInput[];
  factors: DecisionFactorInput[];
}) {
  const [part, setPart] = useState(0);
  const [demographics, setDemographics] = useState<DemographicsState>({
    gender: null,
    ageRange: null,
    occupation: null,
    monthlyIncome: null,
  });
  const [behavior, setBehavior] = useState<BehaviorState>({
    pastUsageFreq: null,
    occasionTagIds: [],
    budgetKey: null,
  });
  const [tagRatings, setTagRatings] = useState<RatingsState>({});
  const [factorRatings, setFactorRatings] = useState<RatingsState>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);

  const router = useRouter();

  const occasionCategory = categories.find((c) => c.code === "occasion");
  const preferenceCategories = categories.filter((c) =>
    ["color_tone", "pattern", "material"].includes(c.code)
  );

  const payload = useMemo<SubmitPayload>(() => {
    const budget = BUDGET_OPTIONS.find((o) => o.key === behavior.budgetKey);
    return {
      gender: demographics.gender,
      ageRange: demographics.ageRange,
      occupation: demographics.occupation,
      monthlyIncome: demographics.monthlyIncome,
      pastUsageFreq: behavior.pastUsageFreq,
      occasionTagIds: behavior.occasionTagIds,
      budgetMin: budget?.min ?? null,
      budgetMax: budget?.max ?? null,
      tagRatings: Object.entries(tagRatings).map(([tagId, score]) => ({
        tagId,
        score,
      })),
      factorRatings: Object.entries(factorRatings).map(([factorId, score]) => ({
        factorId,
        score,
      })),
    };
  }, [demographics, behavior, tagRatings, factorRatings]);

  const isLast = part === PART_TITLES.length - 1;

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        sessionId: string;
        resultCount: number;
      };
      setSavedSessionId(data.sessionId);
      setResultCount(data.resultCount);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "ส่งข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (isLast) {
      void submit();
      return;
    }
    setPart((p) => p + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (part > 0) {
      setPart((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function reset() {
    setPart(0);
    setDemographics({
      gender: null,
      ageRange: null,
      occupation: null,
      monthlyIncome: null,
    });
    setBehavior({ pastUsageFreq: null, occasionTagIds: [], budgetKey: null });
    setTagRatings({});
    setFactorRatings({});
    setSavedSessionId(null);
    setResultCount(null);
    setSubmitError(null);
  }

  if (savedSessionId) {
    return (
      <SubmittedPanel
        sessionId={savedSessionId}
        resultCount={resultCount ?? 0}
        onReset={reset}
        onGoResults={() => router.push(`/results/${savedSessionId}`)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <ProgressBar current={part + 1} total={PART_TITLES.length} />
      <h1 className="font-heading text-indigo text-xl sm:text-2xl mt-6 leading-snug">
        {PART_TITLES[part]}
      </h1>

      <div className="mt-8 space-y-6">
        {part === 0 && (
          <PartDemographics value={demographics} onChange={setDemographics} />
        )}
        {part === 1 && (
          <PartBehavior
            value={behavior}
            onChange={setBehavior}
            occasionCategory={occasionCategory}
          />
        )}
        {part === 2 && (
          <PartPreferences
            categories={preferenceCategories}
            ratings={tagRatings}
            onChange={setTagRatings}
          />
        )}
        {part === 3 && (
          <PartFactors
            factors={factors}
            ratings={factorRatings}
            onChange={setFactorRatings}
          />
        )}
      </div>

      {submitError && (
        <p className="mt-6 text-sm text-brick bg-brick/5 border border-brick/30 rounded-sm px-4 py-3">
          ส่งข้อมูลไม่สำเร็จ: {submitError} — ลองกดส่งอีกครั้ง
        </p>
      )}

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={part === 0 || submitting}
          className="text-sm text-earth hover:text-indigo disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← ตอนก่อนหน้า
        </button>
        <button
          type="button"
          onClick={next}
          disabled={submitting}
          className="bg-brick text-cream font-medium px-6 py-2.5 rounded-sm hover:bg-[#7a2424] disabled:bg-earth/40 disabled:cursor-not-allowed transition"
        >
          {isLast
            ? submitting
              ? "กำลังส่ง..."
              : "ส่งแบบสอบถาม"
            : "ตอนถัดไป →"}
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// ตอนที่ 1 — Demographics
// =====================================================================

function PartDemographics({
  value,
  onChange,
}: {
  value: DemographicsState;
  onChange: (next: DemographicsState) => void;
}) {
  return (
    <>
      <QuestionCard label="เพศ">
        <RadioGroup
          name="gender"
          options={GENDER_OPTIONS}
          value={value.gender}
          onChange={(v) => onChange({ ...value, gender: v })}
        />
      </QuestionCard>
      <QuestionCard label="อาชีพ">
        <RadioGroup
          name="occupation"
          options={OCCUPATION_OPTIONS}
          value={value.occupation}
          onChange={(v) => onChange({ ...value, occupation: v })}
        />
      </QuestionCard>
      <QuestionCard label="อายุ">
        <RadioGroup
          name="ageRange"
          options={AGE_OPTIONS}
          value={value.ageRange}
          onChange={(v) => onChange({ ...value, ageRange: v })}
        />
      </QuestionCard>
      <QuestionCard label="รายได้เฉลี่ยต่อเดือน">
        <RadioGroup
          name="monthlyIncome"
          options={INCOME_OPTIONS}
          value={value.monthlyIncome}
          onChange={(v) => onChange({ ...value, monthlyIncome: v })}
        />
      </QuestionCard>
    </>
  );
}

// =====================================================================
// ตอนที่ 2 — Behavior
// =====================================================================

function PartBehavior({
  value,
  onChange,
  occasionCategory,
}: {
  value: BehaviorState;
  onChange: (next: BehaviorState) => void;
  occasionCategory: CategoryTagsInput | undefined;
}) {
  return (
    <>
      <QuestionCard label="ท่านเคยใช้ผ้าทอพื้นบ้านหรือผ้าไทยหรือไม่">
        <RadioGroup
          name="pastUsageFreq"
          options={USAGE_FREQUENCY_OPTIONS}
          value={value.pastUsageFreq}
          onChange={(v) => onChange({ ...value, pastUsageFreq: v })}
        />
      </QuestionCard>

      {occasionCategory && (
        <QuestionCard
          label="ท่านใช้ผ้าทอพื้นบ้านในโอกาสใดบ้าง"
          hint="ตอบได้มากกว่า 1 ข้อ"
        >
          <CheckboxGroup
            options={occasionCategory.tags.map((t) => ({
              value: t.id,
              label: t.nameTh,
            }))}
            values={value.occasionTagIds}
            onChange={(ids) => onChange({ ...value, occasionTagIds: ids })}
          />
        </QuestionCard>
      )}

      <QuestionCard label="งบประมาณที่ท่านยินดีจ่ายสำหรับผ้าทอพื้นบ้าน">
        <RadioGroup
          name="budget"
          options={BUDGET_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
          value={value.budgetKey}
          onChange={(v) => onChange({ ...value, budgetKey: v })}
        />
      </QuestionCard>
    </>
  );
}

// =====================================================================
// ตอนที่ 3 — Likert รายการชอบ (ลวดลาย/สี/เนื้อผ้า)
// =====================================================================

function PartPreferences({
  categories,
  ratings,
  onChange,
}: {
  categories: CategoryTagsInput[];
  ratings: RatingsState;
  onChange: (next: RatingsState) => void;
}) {
  return (
    <QuestionCard
      label="กรุณาให้คะแนนความชอบในแต่ละด้าน"
      hint="1 = ไม่ชอบ, 5 = ชอบมากที่สุด"
    >
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.code}>
            <p className="font-heading text-earth-deep text-sm mb-3">
              {cat.nameTh}
            </p>
            <div className="space-y-2">
              {cat.tags.map((t) => (
                <LikertRow
                  key={t.id}
                  label={t.nameTh}
                  value={ratings[t.id] ?? null}
                  options={LIKERT_PREFERENCE}
                  onChange={(score) => onChange({ ...ratings, [t.id]: score })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </QuestionCard>
  );
}

// =====================================================================
// ตอนที่ 4 — Likert ปัจจัยตัดสินใจ
// =====================================================================

function PartFactors({
  factors,
  ratings,
  onChange,
}: {
  factors: DecisionFactorInput[];
  ratings: RatingsState;
  onChange: (next: RatingsState) => void;
}) {
  return (
    <QuestionCard
      label="กรุณาให้คะแนนความสำคัญของปัจจัยต่อไปนี้"
      hint="1 = ไม่สำคัญ, 5 = สำคัญมากที่สุด"
    >
      <div className="space-y-2">
        {factors.map((f) => (
          <LikertRow
            key={f.id}
            label={f.nameTh}
            value={ratings[f.id] ?? null}
            options={LIKERT_IMPORTANCE}
            onChange={(score) => onChange({ ...ratings, [f.id]: score })}
          />
        ))}
      </div>
    </QuestionCard>
  );
}

// =====================================================================
// Reusable UI
// =====================================================================

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-earth mb-2">
        <span>ตอนที่ {current} จาก {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full bg-cream-deep rounded-sm overflow-hidden">
        <div
          className="h-full bg-brick transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestionCard({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream border border-cream-deep rounded-sm p-5 sm:p-6">
      <div className="mb-4">
        <p className="font-heading text-indigo text-base sm:text-lg leading-snug">
          {label}
        </p>
        {hint && <p className="text-xs text-earth mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function RadioGroup<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly { value: T; label: string }[];
  value: string | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={[
              "flex items-center gap-3 p-3 rounded-sm border-2 cursor-pointer transition",
              checked
                ? "border-brick bg-brick/5"
                : "border-cream-deep hover:border-earth-deep",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={[
                "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                checked ? "border-brick" : "border-earth/50",
              ].join(" ")}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-brick" />}
            </span>
            <span className="text-sm text-indigo">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = values.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={[
              "flex items-center gap-3 p-3 rounded-sm border-2 cursor-pointer transition",
              checked
                ? "border-brick bg-brick/5"
                : "border-cream-deep hover:border-earth-deep",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={[
                "h-4 w-4 border-2 shrink-0 flex items-center justify-center",
                checked ? "border-brick bg-brick" : "border-earth/50",
              ].join(" ")}
            >
              {checked && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 text-cream"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 6l3 3 5-6" />
                </svg>
              )}
            </span>
            <span className="text-sm text-indigo">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function LikertRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: readonly { score: number; label: string }[];
  onChange: (score: number) => void;
}) {
  return (
    <div className="border-b border-cream-deep pb-3 last:border-0 last:pb-0">
      <p className="text-sm text-indigo mb-2">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {options.map((o) => {
          const checked = value === o.score;
          return (
            <button
              type="button"
              key={o.score}
              onClick={() => onChange(o.score)}
              aria-pressed={checked}
              className={[
                "px-1 py-2 rounded-sm border text-xs sm:text-sm leading-tight transition",
                checked
                  ? "border-brick bg-brick text-cream"
                  : "border-cream-deep bg-cream text-earth hover:border-earth-deep",
              ].join(" ")}
              title={o.label}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================================
// SubmittedPanel — บันทึกสำเร็จ (สร้าง session ใน DB แล้ว)
// หน้า /results/[sessionId] จะทำในงาน 4
// =====================================================================

function SubmittedPanel({
  sessionId,
  resultCount,
  onReset,
  onGoResults,
}: {
  sessionId: string;
  resultCount: number;
  onReset: () => void;
  onGoResults: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="border border-cream-deep bg-cream-deep/40 p-5 sm:p-8 rounded-sm">
        <p className="font-heading text-gold-text text-sm tracking-wide">
          บันทึกคำตอบเรียบร้อย
        </p>
        <h2 className="font-heading text-indigo text-2xl sm:text-3xl mt-2">
          ระบบวิเคราะห์เสร็จแล้ว
        </h2>
        <p className="text-sm text-earth mt-3 leading-relaxed">
          แนะนำผ้าให้ทั้งหมด {resultCount} ผืน · session id{" "}
          <code className="text-xs bg-cream px-1.5 py-0.5 border border-cream-deep rounded-sm">
            {sessionId}
          </code>
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onGoResults}
            className="bg-brick text-cream font-medium px-6 py-3 rounded-sm hover:bg-[#7a2424] transition"
          >
            ดูผลการแนะนำ →
          </button>
          <button
            type="button"
            onClick={onReset}
            className="border border-indigo text-indigo font-medium px-6 py-3 rounded-sm hover:bg-indigo hover:text-cream transition"
          >
            เริ่มทำแบบสอบถามใหม่
          </button>
          <Link
            href="/"
            className="text-sm text-earth self-center underline underline-offset-4 hover:text-brick"
          >
            กลับหน้าแรก
          </Link>
        </div>

        <p className="text-xs text-earth mt-4">
          หมายเหตุ: หน้า <code>/results/{sessionId}</code>{" "}
          จะพร้อมใช้งานในงานถัดไป (งาน 4) ตอนนี้จะเห็นเป็น 404
        </p>
      </div>
    </div>
  );
}
