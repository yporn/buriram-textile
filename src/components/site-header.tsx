import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-cream-deep">
      <div className="h-1 bg-earth-deep" />
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-indigo text-xl">ผ้าทอบุรีรัมย์</span>
          <span className="text-xs text-earth hidden sm:inline">
            ระบบแนะนำเฉพาะบุคคล
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/fabrics" className="text-indigo hover:text-brick">
            ผ้าทอทั้งหมด
          </Link>
          <Link href="/stories" className="text-indigo hover:text-brick">
            เรื่องราวผ้าทอ
          </Link>
          <Link href="/questionnaire" className="text-indigo hover:text-brick">
            เริ่มแบบสอบถาม
          </Link>
        </nav>
      </div>
    </header>
  );
}
