"use client";

import { useState } from "react";

export function FeedbackForm({
  sessionId,
  initialIsRelevant,
  initialComment,
}: {
  sessionId: string;
  initialIsRelevant: boolean | null;
  initialComment: string;
}) {
  const [isRelevant, setIsRelevant] = useState<boolean | null>(initialIsRelevant);
  const [comment, setComment] = useState(initialComment);
  const [savedComment, setSavedComment] = useState(initialComment);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    initialIsRelevant != null ? "saved" : "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function save(next: { isRelevant: boolean | null; comment: string }) {
    if (next.isRelevant == null) return; // ต้องเลือกก่อน
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          isRelevant: next.isRelevant,
          comment: next.comment || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setStatus("saved");
      setSavedComment(next.comment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setStatus("error");
    }
  }

  function pick(value: boolean) {
    setIsRelevant(value);
    void save({ isRelevant: value, comment });
  }

  function saveComment() {
    void save({ isRelevant, comment });
  }

  const commentDirty = comment !== savedComment;

  return (
    <section aria-label="แบบประเมินคำแนะนำ">
      <p className="font-heading text-gold-text text-sm tracking-wide">
        ความคิดเห็นของคุณ
      </p>
      <h2 className="font-heading text-indigo text-xl sm:text-2xl mt-2">
        คำแนะนำนี้ตรงใจไหม?
      </h2>
      <p className="text-sm text-earth mt-2 leading-relaxed">
        คำตอบของคุณจะช่วยพัฒนาระบบแนะนำผ้าทอบุรีรัมย์ให้ดีขึ้น
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <FeedbackButton
          active={isRelevant === true}
          onClick={() => pick(true)}
          disabled={status === "saving"}
        >
          ตรงใจ
        </FeedbackButton>
        <FeedbackButton
          active={isRelevant === false}
          onClick={() => pick(false)}
          disabled={status === "saving"}
        >
          ยังไม่ตรง
        </FeedbackButton>
      </div>

      {isRelevant != null && (
        <div className="mt-5">
          <label className="text-sm text-earth block mb-2">
            เพิ่มความเห็นเพิ่มเติม (ไม่บังคับ)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full bg-cream border border-cream-deep rounded-sm p-3 text-sm text-indigo focus:outline-none focus:border-earth-deep"
            placeholder="เช่น อยากได้ตัวเลือกโทนสีอื่น ๆ เพิ่ม"
          />
          {commentDirty && (
            <button
              type="button"
              onClick={saveComment}
              disabled={status === "saving"}
              className="mt-2 text-sm border border-indigo text-indigo px-4 py-1.5 rounded-sm hover:bg-indigo hover:text-cream disabled:opacity-50 transition"
            >
              บันทึกความเห็น
            </button>
          )}
        </div>
      )}

      <div className="mt-3 h-5 text-xs">
        {status === "saving" && <span className="text-earth">กำลังบันทึก...</span>}
        {status === "saved" && (
          <span className="text-gold-text">บันทึกคำตอบเรียบร้อย ขอบคุณค่ะ</span>
        )}
        {status === "error" && (
          <span className="text-brick">
            บันทึกไม่สำเร็จ: {error} — ลองอีกครั้ง
          </span>
        )}
      </div>
    </section>
  );
}

function FeedbackButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "px-6 py-2.5 rounded-sm border-2 font-medium transition",
        active
          ? "border-brick bg-brick text-cream"
          : "border-cream-deep bg-cream text-indigo hover:border-earth-deep",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
