"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FabricRowActions({
  fabricId,
  isPublished,
}: {
  fabricId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function togglePublish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fabrics/${fabricId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (!res.ok) throw new Error("อัปเดตไม่สำเร็จ");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปเดตไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={togglePublish}
        disabled={loading}
        className={[
          "text-xs font-medium px-2 py-1 rounded-sm w-fit transition disabled:opacity-50",
          isPublished
            ? "bg-brick/10 text-brick hover:bg-brick/20"
            : "bg-earth/10 text-earth hover:bg-earth/20",
        ].join(" ")}
      >
        {isPublished ? "เผยแพร่อยู่" : "ซ่อนอยู่"}
      </button>
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}
