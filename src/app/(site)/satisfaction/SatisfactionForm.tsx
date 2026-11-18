"use client";

import { useState } from "react";
import Link from "next/link";

const GENDER_OPTIONS = [
  { value: "MALE", label: "ชาย" },
  { value: "FEMALE", label: "หญิง" },
  { value: "UNSPECIFIED", label: "อื่น ๆ" },
] as const;

const AGE_OPTIONS = [
  { value: "UNDER_20", label: "ต่ำกว่า 20 ปี" },
  { value: "AGE_21_30", label: "20 – 30 ปี" },
  { value: "AGE_31_40", label: "31 – 40 ปี" },
  { value: "AGE_41_50", label: "41 – 50 ปี" },
  { value: "OVER_50", label: "50 ปีขึ้นไป" },
] as const;

const OCCUPATION_OPTIONS = [
  { value: "STUDENT", label: "นักเรียน/นักศึกษา" },
  { value: "CIVIL_SERVANT", label: "ข้าราชการ/พนักงานรัฐวิสาหกิจ" },
  { value: "PRIVATE_EMPLOYEE", label: "พนักงานบริษัทเอกชน/รับจ้างทั่วไป" },
  { value: "BUSINESS_OWNER", label: "ธุรกิจส่วนตัว/ค้าขาย" },
  { value: "AGRICULTURE", label: "เกษตรกรรม" },
  { value: "OTHER", label: "อื่น ๆ" },
] as const;

const FAMILIARITY_OPTIONS = [
  { value: "EXPERT", label: "มีความรู้ความเชี่ยวชาญสูง (เช่น ช่างทอ, นักวิชาการ)" },
  { value: "REGULAR_INTEREST", label: "มีความสนใจและใช้งานเป็นประจำ" },
  { value: "SPECIAL_OCCASION_ONLY", label: "ใช้งานเฉพาะโอกาสสำคัญเท่านั้น" },
  { value: "LOW_BUT_INTERESTED", label: "ไม่ค่อยมีความรู้/ไม่ค่อยได้ใช้งานแต่สนใจ" },
] as const;

const TECH_EXPERIENCE_OPTIONS = [
  { value: "LOW", label: "น้อยมาก" },
  { value: "MEDIUM", label: "ปานกลาง" },
  { value: "HIGH", label: "มาก" },
] as const;

const LIKERT_OPTIONS = [
  { score: 5, label: "มากที่สุด" },
  { score: 4, label: "มาก" },
  { score: 3, label: "ปานกลาง" },
  { score: 2, label: "น้อย" },
  { score: 1, label: "น้อยที่สุด" },
] as const;

type QItem = { key: string; label: string };
type QGroup = { title: string; items: QItem[] };

const Q_GROUPS: QGroup[] = [
  {
    title: "ด้านประสิทธิภาพของระบบ",
    items: [
      { key: "q1", label: "ระบบสามารถวิเคราะห์และแนะนำผ้าทอได้ตรงตามบุคลิกภาพ/ความชอบส่วนบุคคลของท่าน" },
      { key: "q2", label: "ผลลัพธ์การแนะนำมีความตรงกับความต้องการของผู้ใช้" },
      { key: "q3", label: "ระบบช่วยให้ตัดสินใจเลือกผ้าได้ง่ายขึ้น" },
      { key: "q4", label: "ความรวดเร็วในการประมวลผลของระบบ" },
      { key: "q5", label: "ระบบให้คำแนะนำที่มีประโยชน์" },
      { key: "q6", label: 'ท่านรู้สึกว่าระบบมีความเป็น "ผู้เชี่ยวชาญ" ในการให้คำแนะนำผ้าทอบุรีรัมย์' },
    ],
  },
  {
    title: "ด้านการใช้งานระบบ",
    items: [
      { key: "q7", label: "ระบบใช้งานง่าย" },
      { key: "q8", label: "ขั้นตอนการใช้งานระบบมีความชัดเจน" },
      { key: "q9", label: "การกรอกข้อมูลเพื่อรับคำแนะนำมีความสะดวกและไม่ยุ่งยาก" },
      { key: "q10", label: "การแสดงผลคำแนะนำเข้าใจง่าย" },
      { key: "q11", label: "การจัดวางองค์ประกอบ (เมนู ปุ่มกด รูปภาพ) มีความเหมาะสม" },
      { key: "q12", label: "ระบบมีการประมวลผลและแสดงคำแนะนำได้อย่างรวดเร็ว" },
    ],
  },
  {
    title: "ด้านความสามารถในการอธิบายเหตุผล",
    items: [
      { key: "q13", label: "ระบบมีการอธิบายเหตุผลในการแนะนำผ้าแต่ละผืนได้อย่างชัดเจนและเข้าใจง่าย" },
      { key: "q14", label: "คำอธิบายของระบบช่วยให้ท่านมั่นใจและเชื่อถือในคำแนะนำที่ได้รับ" },
      { key: "q15", label: "ระบบช่วยให้ท่านได้รับความรู้ใหม่เกี่ยวกับผ้าทอพื้นบ้านบุรีรัมย์ (เช่น ที่มาของลาย)" },
    ],
  },
  {
    title: "ด้านประโยชน์และการยอมรับเทคโนโลยี",
    items: [
      { key: "q16", label: "ระบบนี้ช่วยลดเวลาและเพิ่มความสะดวกในการเลือกซื้อผ้าทอที่ถูกใจ" },
      { key: "q17", label: "ท่านมีความพึงพอใจโดยรวมต่อการใช้งานระบบแนะนำผ้าทออัจฉริยะนี้" },
      { key: "q18", label: "ท่านมีความตั้งใจที่จะใช้งานระบบนี้อีกในอนาคต" },
      { key: "q19", label: "ท่านจะแนะนำให้ผู้อื่นใช้งานระบบแนะนำนี้" },
    ],
  },
];

type Demographics = {
  gender: string | null;
  genderOther: string;
  ageRange: string | null;
  occupation: string | null;
  occupationOther: string;
  familiarity: string | null;
  techExperience: string | null;
};

const INITIAL_DEMOGRAPHICS: Demographics = {
  gender: null,
  genderOther: "",
  ageRange: null,
  occupation: null,
  occupationOther: "",
  familiarity: null,
  techExperience: null,
};

export function SatisfactionForm() {
  const [demographics, setDemographics] = useState<Demographics>(INITIAL_DEMOGRAPHICS);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setError(null);

    if (
      !demographics.gender ||
      !demographics.ageRange ||
      !demographics.occupation ||
      !demographics.familiarity ||
      !demographics.techExperience
    ) {
      setError("กรุณาตอบคำถามในตอนที่ 1 ให้ครบทุกข้อ");
      return;
    }
    const allQuestions = Q_GROUPS.flatMap((g) => g.items);
    const missing = allQuestions.find((q) => !ratings[q.key]);
    if (missing) {
      setError("กรุณาตอบคำถามความพึงพอใจในตอนที่ 2 ให้ครบทุกข้อ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: demographics.gender,
          genderOther: demographics.gender === "UNSPECIFIED" ? demographics.genderOther : null,
          ageRange: demographics.ageRange,
          occupation: demographics.occupation,
          occupationOther: demographics.occupation === "OTHER" ? demographics.occupationOther : null,
          familiarity: demographics.familiarity,
          techExperience: demographics.techExperience,
          comment: comment || null,
          ...ratings,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งแบบสอบถามไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-10 border border-clay-deep bg-clay-deep/40 p-6 sm:p-8 rounded-sm">
        <p className="font-heading text-ochre-text text-sm tracking-wide">
          บันทึกคำตอบเรียบร้อย
        </p>
        <h2 className="font-heading text-walnut text-xl sm:text-2xl mt-2">
          ขอบคุณสำหรับความคิดเห็นของท่าน
        </h2>
        <p className="text-sm text-umber mt-3 leading-relaxed">
          คำตอบของท่านจะช่วยพัฒนาระบบแนะนำผ้าทอบุรีรัมย์ให้ดียิ่งขึ้น
        </p>
        <Link
          href="/"
          className="inline-flex mt-6 items-center justify-center bg-rust text-clay font-medium px-6 py-2.5 rounded-sm hover:bg-[#5C230F] transition"
        >
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      <PartSection no="ตอนที่ 1" title="ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม">
        <QuestionCard label="เพศ">
          <RadioGroup
            name="gender"
            options={GENDER_OPTIONS}
            value={demographics.gender}
            onChange={(v) => setDemographics({ ...demographics, gender: v })}
          />
          {demographics.gender === "UNSPECIFIED" && (
            <input
              type="text"
              value={demographics.genderOther}
              onChange={(e) => setDemographics({ ...demographics, genderOther: e.target.value })}
              placeholder="ระบุ"
              className="mt-2 w-full bg-clay border border-clay-deep rounded-sm px-3 py-1.5 text-sm text-walnut focus:outline-none focus:border-umber-deep"
            />
          )}
        </QuestionCard>
        <QuestionCard label="อายุ">
          <RadioGroup
            name="ageRange"
            options={AGE_OPTIONS}
            value={demographics.ageRange}
            onChange={(v) => setDemographics({ ...demographics, ageRange: v })}
          />
        </QuestionCard>
        <QuestionCard label="อาชีพหลัก">
          <RadioGroup
            name="occupation"
            options={OCCUPATION_OPTIONS}
            value={demographics.occupation}
            onChange={(v) => setDemographics({ ...demographics, occupation: v })}
          />
          {demographics.occupation === "OTHER" && (
            <input
              type="text"
              value={demographics.occupationOther}
              onChange={(e) => setDemographics({ ...demographics, occupationOther: e.target.value })}
              placeholder="ระบุ"
              className="mt-2 w-full bg-clay border border-clay-deep rounded-sm px-3 py-1.5 text-sm text-walnut focus:outline-none focus:border-umber-deep"
            />
          )}
        </QuestionCard>
        <QuestionCard label="ประสบการณ์หรือความคุ้นเคยกับผ้าทอพื้นบ้าน">
          <RadioGroup
            name="familiarity"
            options={FAMILIARITY_OPTIONS}
            value={demographics.familiarity}
            onChange={(v) => setDemographics({ ...demographics, familiarity: v })}
          />
        </QuestionCard>
        <QuestionCard label="ประสบการณ์การใช้เทคโนโลยี">
          <RadioGroup
            name="techExperience"
            options={TECH_EXPERIENCE_OPTIONS}
            value={demographics.techExperience}
            onChange={(v) => setDemographics({ ...demographics, techExperience: v })}
          />
        </QuestionCard>
      </PartSection>

      <PartSection
        no="ตอนที่ 2"
        title="ความพึงพอใจที่มีต่อระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคล"
      >
        <div className="space-y-6">
          {Q_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="font-heading text-umber-deep text-xs uppercase tracking-wide border-b border-clay-deep pb-2 mb-3">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <LikertRow
                    key={item.key}
                    label={item.label}
                    value={ratings[item.key] ?? null}
                    onChange={(score) => setRatings({ ...ratings, [item.key]: score })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PartSection>

      <PartSection no="ตอนที่ 3" title="ข้อเสนอแนะเพิ่มเติมเกี่ยวกับการปรับปรุงและพัฒนาระบบในอนาคต">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full bg-clay border border-clay-deep rounded-sm p-3 text-sm text-walnut focus:outline-none focus:border-umber-deep"
          placeholder="(ไม่บังคับ)"
        />
      </PartSection>

      {error && (
        <p className="text-sm text-rust bg-rust/5 border border-rust/30 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className="bg-rust text-clay font-medium px-6 py-2.5 rounded-sm hover:bg-[#5C230F] disabled:bg-umber/40 disabled:cursor-not-allowed transition"
        >
          {submitting ? "กำลังส่ง..." : "ส่งแบบสอบถาม"}
        </button>
      </div>
    </div>
  );
}

function PartSection({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="font-heading text-ochre-text text-xs sm:text-sm tracking-wide">{no}</p>
      <h2 className="font-heading text-walnut text-base sm:text-lg mt-1 leading-snug">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function QuestionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-clay border border-clay-deep rounded-sm p-2 sm:p-3">
      <p className="font-heading text-walnut text-sm sm:text-base leading-snug mb-1.5">{label}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={[
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm border cursor-pointer transition",
              checked ? "border-rust bg-rust/5" : "border-clay-deep hover:border-umber-deep",
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
                checked ? "border-rust" : "border-umber/50",
              ].join(" ")}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-rust" />}
            </span>
            <span className="text-xs sm:text-sm text-umber-deep">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function LikertRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (score: number) => void;
}) {
  return (
    <div className="border-b border-clay-deep pb-3 last:border-0 last:pb-0">
      <p className="flex items-center gap-1.5 text-sm sm:text-base font-medium text-walnut mb-2">
        <span aria-hidden className="text-rust">
          ›
        </span>
        {label}
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {LIKERT_OPTIONS.map((o) => {
          const checked = value === o.score;
          return (
            <button
              type="button"
              key={o.score}
              onClick={() => onChange(o.score)}
              aria-pressed={checked}
              className={[
                "px-1 py-1.5 rounded-sm border text-[11px] sm:text-xs leading-tight transition",
                checked
                  ? "border-rust bg-rust text-clay"
                  : "border-clay-deep bg-clay text-umber-deep hover:border-umber-deep",
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
