import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-umber-deep border-b border-ochre/30">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-heading text-clay text-xl">ผ้าทอบุรีรัมย์</span>
          <span className="text-xs text-clay/70 hidden sm:inline">
            ระบบแนะนำเฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/fabrics" className="text-clay/90 hover:text-ochre">
            ผ้าทอทั้งหมด
          </Link>
          <Link href="/stories" className="text-clay/90 hover:text-ochre">
            เรื่องราวผ้าทอ
          </Link>
          <Link href="/questionnaire" className="text-clay/90 hover:text-ochre">
            เริ่มแบบสอบถาม
          </Link>
        </nav>
      </div>
    </header>
  );
}
