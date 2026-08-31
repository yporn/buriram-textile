"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLE_CATEGORIES } from "@/lib/article-categories";

export type FabricOption = { id: string; name: string };

export type ArticleFormInitial = {
  title: string;
  slug: string;
  content: string;
  category: string | null;
  coverUrl: string | null;
  relatedFabricId: string | null;
  isPublished: boolean;
};

const emptyInitial: ArticleFormInitial = {
  title: "",
  slug: "",
  content: "",
  category: null,
  coverUrl: null,
  relatedFabricId: null,
  isPublished: false,
};

const INPUT_CLASS =
  "w-full bg-cream border border-cream-deep rounded-sm px-3 py-2 text-indigo focus:outline-none focus:border-earth-deep";

export function ArticleForm({
  mode,
  articleId,
  fabrics,
  initial,
}: {
  mode: "create" | "edit";
  articleId?: string;
  fabrics: FabricOption[];
  initial?: ArticleFormInitial;
}) {
  const router = useRouter();
  const base = initial ?? emptyInitial;

  const [title, setTitle] = useState(base.title);
  const [slug, setSlug] = useState(base.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [content, setContent] = useState(base.content);
  const [category, setCategory] = useState(base.category ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(base.coverUrl);
  const [relatedFabricId, setRelatedFabricId] = useState(base.relatedFabricId ?? "");
  const [isPublished, setIsPublished] = useState(base.isPublished);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    // แนะนำ slug ให้อัตโนมัติจนกว่าแอดมินจะแก้ slug เอง
    if (!slugTouched) {
      setSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
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
      setCoverUrl(data.url);
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
      title,
      slug,
      content,
      category: category || null,
      coverUrl,
      relatedFabricId: relatedFabricId || null,
      isPublished,
    };

    try {
      const url = mode === "create" ? "/api/admin/articles" : `/api/admin/articles/${articleId}`;
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
      router.push("/admin/articles");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!articleId) return;
    if (!confirm(`ยืนยันลบบทความ "${title}" ถาวร? การกระทำนี้ย้อนกลับไม่ได้`)) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "ลบไม่สำเร็จ");
      }
      router.push("/admin/articles");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-cream border border-cream-deep rounded-sm p-5 space-y-4">
        <Field label="ชื่อบทความ">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Slug (ใช้ในลิงก์ URL)">
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
            className={INPUT_CLASS}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="หมวดหมู่">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">— ไม่ระบุ —</option>
              {ARTICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="เชื่อมโยงไปยังผ้า (ไม่บังคับ)">
            <select
              value={relatedFabricId}
              onChange={(e) => setRelatedFabricId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">— ไม่ระบุ —</option>
              {fabrics.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="เนื้อหาบทความ">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className={INPUT_CLASS}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-indigo">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          เผยแพร่บนหน้าเว็บ
        </label>
      </div>

      <div className="bg-cream border border-cream-deep rounded-sm p-5">
        <p className="text-sm text-earth mb-3">ภาพปก</p>
        {coverUrl && (
          <div className="mb-3 h-40 w-full max-w-sm bg-cream-deep rounded-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
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
        {coverUrl && !uploading && (
          <button
            type="button"
            onClick={() => setCoverUrl(null)}
            className="block mt-2 text-xs text-brick underline underline-offset-2"
          >
            ลบรูปนี้
          </button>
        )}
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
          {submitting ? "กำลังบันทึก..." : mode === "create" ? "เพิ่มบทความ" : "บันทึกการแก้ไข"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-brick hover:underline disabled:opacity-50 ml-auto"
          >
            {deleting ? "กำลังลบ..." : "ลบบทความนี้ถาวร"}
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
