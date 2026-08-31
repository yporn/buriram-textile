"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type CategoryWithTags = {
  code: string;
  nameTh: string;
  tags: { id: string; nameTh: string }[];
};

export type CommunityOption = { id: string; name: string; district: string };

const INPUT_CLASS =
  "w-full bg-cream border border-cream-deep rounded-sm px-3 py-2 text-indigo focus:outline-none focus:border-earth-deep";

export type FabricFormInitial = {
  name: string;
  description: string;
  story: string;
  priceThb: number;
  communityId: string | null;
  isPublished: boolean;
  imageUrl: string | null;
  tagIds: string[];
};

const emptyInitial: FabricFormInitial = {
  name: "",
  description: "",
  story: "",
  priceThb: 0,
  communityId: null,
  isPublished: true,
  imageUrl: null,
  tagIds: [],
};

export function FabricForm({
  mode,
  fabricId,
  categories,
  communities,
  initial,
}: {
  mode: "create" | "edit";
  fabricId?: string;
  categories: CategoryWithTags[];
  communities: CommunityOption[];
  initial?: FabricFormInitial;
}) {
  const router = useRouter();
  const base = initial ?? emptyInitial;

  const [name, setName] = useState(base.name);
  const [description, setDescription] = useState(base.description);
  const [story, setStory] = useState(base.story);
  const [priceThb, setPriceThb] = useState(String(base.priceThb));
  const [communityId, setCommunityId] = useState(base.communityId ?? "");
  const [isPublished, setIsPublished] = useState(base.isPublished);
  const [imageUrl, setImageUrl] = useState<string | null>(base.imageUrl);
  const [tagIds, setTagIds] = useState<string[]>(base.tagIds);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "อัปโหลดรูปไม่สำเร็จ");
      }
      const data = (await res.json()) as { url: string };
      setImageUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      description,
      story,
      priceThb: Number(priceThb),
      communityId: communityId || null,
      isPublished,
      imageUrl,
      tagIds,
    };

    try {
      const url = mode === "create" ? "/api/admin/fabrics" : `/api/admin/fabrics/${fabricId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!fabricId) return;
    if (!confirm(`ยืนยันลบผ้า "${name}" ถาวร? การกระทำนี้ย้อนกลับไม่ได้`)) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fabrics/${fabricId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "ลบไม่สำเร็จ");
      }
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* ---------- ข้อมูลพื้นฐาน ---------- */}
      <div className="bg-cream border border-cream-deep rounded-sm p-5 space-y-4">
        <Field label="ชื่อผ้า">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="คำอธิบาย">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="เรื่องราว / ที่มา (ไม่บังคับ)">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={3}
            className={INPUT_CLASS}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ราคา (บาท)">
            <input
              type="number"
              min={0}
              value={priceThb}
              onChange={(e) => setPriceThb(e.target.value)}
              required
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="ชุมชนผู้ทอ">
            <select
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">— ไม่ระบุ —</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-indigo">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          เผยแพร่บนหน้าเว็บ
        </label>
      </div>

      {/* ---------- รูปภาพ ---------- */}
      <div className="bg-cream border border-cream-deep rounded-sm p-5">
        <p className="text-sm text-earth mb-3">รูปหลักของผ้า</p>
        {imageUrl && (
          <div className="mb-3 h-40 w-40 bg-cream-deep rounded-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-earth"
        />
        {uploading && <p className="text-xs text-earth mt-2">กำลังอัปโหลด...</p>}
        {imageUrl && !uploading && (
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="block mt-2 text-xs text-brick underline underline-offset-2"
          >
            ลบรูปนี้
          </button>
        )}
      </div>

      {/* ---------- Tag ---------- */}
      <div className="bg-cream border border-cream-deep rounded-sm p-5 space-y-5">
        <p className="text-sm text-earth">
          แท็กสำหรับระบบแนะนำ (ตรงกับตัวเลือกในแบบสอบถาม)
        </p>
        {categories.map((cat) => (
          <div key={cat.code}>
            <p className="font-heading text-indigo text-sm mb-2">{cat.nameTh}</p>
            <div className="flex flex-wrap gap-2">
              {cat.tags.map((t) => {
                const active = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={[
                      "text-xs px-3 py-1.5 rounded-sm border transition",
                      active
                        ? "border-brick bg-brick text-cream"
                        : "border-cream-deep bg-cream text-earth hover:border-earth-deep",
                    ].join(" ")}
                  >
                    {t.nameTh}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-brick bg-brick/5 border border-brick/30 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="bg-brick text-cream font-medium px-6 py-2.5 rounded-sm hover:bg-[#7a2424] disabled:opacity-50 transition"
        >
          {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มผ้า" : "บันทึกการแก้ไข"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-brick hover:underline disabled:opacity-50 ml-auto"
          >
            {deleting ? "กำลังลบ..." : "ลบผ้านี้ถาวร"}
          </button>
        )}
      </div>
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
