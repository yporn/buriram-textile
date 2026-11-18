"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function RuleRowActions({
  ruleId,
  code,
  isActive,
}: {
  ruleId: string;
  code: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rules/${ruleId}`, {
        method,
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "ทำรายการไม่สำเร็จ");
      }
      router.refresh();
      setBusy(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ");
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!confirm(`ยืนยันลบกฎ "${code}"?`)) return;
    void send("DELETE");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => void send("PATCH", { isActive: !isActive })}
          disabled={busy}
          className="text-walnut hover:underline disabled:opacity-50"
        >
          {isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        </button>
        <Link href={`/admin/rules/${ruleId}/edit`} className="text-rust hover:underline">
          แก้ไข
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="text-rust hover:underline disabled:opacity-50"
        >
          ลบ
        </button>
      </div>
      {error && <span className="text-xs text-rust text-right max-w-48">{error}</span>}
    </div>
  );
}
