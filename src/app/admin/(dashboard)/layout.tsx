import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-cream-deep bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-baseline gap-3">
            <Link href="/admin" className="font-heading text-indigo text-lg">
              ระบบจัดการ · ผ้าทอบุรีรัมย์
            </Link>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="text-indigo hover:text-brick">
              ผ้าทอ
            </Link>
            <Link href="/admin/communities" className="text-indigo hover:text-brick">
              ชุมชน
            </Link>
            <Link href="/admin/articles" className="text-indigo hover:text-brick">
              บทความ
            </Link>
            <Link
              href="/"
              className="text-earth hover:text-brick"
              target="_blank"
            >
              ดูหน้าเว็บ ↗
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">{children}</div>
      </main>
    </>
  );
}
