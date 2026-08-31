"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCommunityButton({
  communityId,
  name,
}: {
  communityId: string;
  name: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`ยืนยันลบชุมชน "${name}"?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/communities/${communityId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "ลบไม่สำเร็จ");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-brick hover:underline disabled:opacity-50 text-sm"
      >
        {deleting ? "กำลังลบ..." : "ลบ"}
      </button>
      {error && <span className="text-xs text-brick text-right max-w-40">{error}</span>}
    </div>
  );
}
