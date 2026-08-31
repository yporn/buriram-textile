"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INPUT_CLASS =
  "w-full bg-cream border border-cream-deep rounded-sm px-3 py-2 text-indigo focus:outline-none focus:border-earth-deep";

export type CommunityFormInitial = {
  name: string;
  district: string;
  story: string;
  contact: string;
};

export function CommunityForm({
  mode,
  communityId,
  initial,
}: {
  mode: "create" | "edit";
  communityId?: string;
  initial?: CommunityFormInitial;
}) {
  const router = useRouter();
  const base = initial ?? { name: "", district: "", story: "", contact: "" };

  const [name, setName] = useState(base.name);
  const [district, setDistrict] = useState(base.district);
  const [story, setStory] = useState(base.story);
  const [contact, setContact] = useState(base.contact);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url =
        mode === "create" ? "/api/admin/communities" : `/api/admin/communities/${communityId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, district, story, contact }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      }
      router.push("/admin/communities");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="bg-cream border border-cream-deep rounded-sm p-5 space-y-4">
        <Field label="ชื่อชุมชน">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="อำเภอ">
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="เรื่องเล่าชุมชน / ภูมิปัญญา (ไม่บังคับ)">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="ช่องทางติดต่อ (ไม่บังคับ)">
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      {error && (
        <p className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brick text-cream font-medium px-6 py-2.5 rounded-sm hover:bg-[#7a2424] disabled:opacity-50 transition"
      >
        {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มชุมชน" : "บันทึกการแก้ไข"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-earth block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
