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
  "w-full bg-clay border border-clay-deep rounded-sm px-3 py-2 text-walnut focus:outline-none focus:border-umber-deep";

export type FabricFormInitial = {
  name: string;
  description: string;
  story: string;
  priceThb: number;
  communityId: string | null;
  isPublished: boolean;
  imageUrls: string[];
  tagIds: string[];
};

const emptyInitial: FabricFormInitial = {
  name: "",
  description: "",
  story: "",
  priceThb: 0,
  communityId: null,
  isPublished: true,
  imageUrls: [],
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
  const [imageUrls, setImageUrls] = useState<string[]>(base.imageUrls);
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
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "อัปโหลดรูปไม่สำเร็จ");
        }
        const data = (await res.json()) as { url: string };
        setImageUrls((prev) => [...prev, data.url]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function makePrimary(index: number) {
    setImageUrls((prev) => {
      if (index === 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
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
      imageUrls,
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
      <div className="bg-clay border border-clay-deep rounded-sm p-5 space-y-4">
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
        <label className="flex items-center gap-2 text-sm text-walnut">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          เผยแพร่บนหน้าเว็บ
        </label>
      </div>

      {/* ---------- รูปภาพ ---------- */}
      <div className="bg-clay border border-clay-deep rounded-sm p-5">
        <p className="text-sm text-umber mb-3">
          รูปของผ้า (อัปโหลดได้หลายรูป — รูปแรกคือรูปหลักที่ใช้แสดงในรายการ)
        </p>
        {imageUrls.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {imageUrls.map((url, index) => (
              <div key={url} className="relative">
                <div className="h-32 w-32 bg-clay-deep rounded-sm overflow-hidden border border-clay-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </div>
                {index === 0 ? (
                  <span className="absolute top-1 left-1 bg-umber-deep text-clay text-[10px] px-1.5 py-0.5 rounded-sm">
                    รูปหลัก
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(index)}
                    className="absolute top-1 left-1 bg-clay/90 text-walnut text-[10px] px-1.5 py-0.5 rounded-sm hover:bg-clay"
                  >
                    ตั้งเป็นรูปหลัก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="ลบรูปนี้"
                  className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center bg-rust text-clay rounded-full text-xs hover:bg-[#5C230F]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-umber"
        />
        {uploading && <p className="text-xs text-umber mt-2">กำลังอัปโหลด...</p>}
      </div>

      {/* ---------- Tag ---------- */}
      <div className="bg-clay border border-clay-deep rounded-sm p-5 space-y-5">
        <p className="text-sm text-umber">
          แท็กสำหรับระบบแนะนำ (ตรงกับตัวเลือกในแบบสอบถาม)
        </p>
        {categories.map((cat) => (
          <div key={cat.code}>
            <p className="font-heading text-walnut text-sm mb-2">{cat.nameTh}</p>
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
                        ? "border-rust bg-rust text-clay"
                        : "border-clay-deep bg-clay text-umber hover:border-umber-deep",
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
        <p className="text-sm text-rust bg-rust/5 border border-rust/30 rounded-sm px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="bg-rust text-clay font-medium px-6 py-2.5 rounded-sm hover:bg-[#5C230F] disabled:opacity-50 transition"
        >
          {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มผ้า" : "บันทึกการแก้ไข"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-rust hover:underline disabled:opacity-50 ml-auto"
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
      <span className="text-sm text-umber block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
