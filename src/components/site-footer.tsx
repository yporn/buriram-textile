import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/questionnaire", label: "เริ่มแบบสอบถาม" },
  { href: "/fabrics", label: "ผ้าทอทั้งหมด" },
  { href: "/stories", label: "เรื่องราวผ้าทอ" },
];

export function SiteFooter() {
  return (
    <footer className="bg-umber-deep text-clay/90">
      {/* เส้นทองผุบาง ๆ คู่กับแถบน้ำตาลดำที่หัวเว็บ ให้เป็น bookend เดียวกัน */}
      <div className="h-px bg-ochre/40" />
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
        <div>
          <p className="font-heading text-clay text-lg mb-1.5">ผ้าทอบุรีรัมย์</p>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed">
            ระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ
            — งานวิจัยระดับปริญญา
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="opacity-80 hover:opacity-100 hover:text-ochre transition w-fit"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-clay/10">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs opacity-75">
          © {new Date().getFullYear()} ผ้าทอบุรีรัมย์
        </p>
      </div>
    </footer>
  );
}
