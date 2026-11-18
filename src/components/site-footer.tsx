import fs from "fs";
import path from "path";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/fabrics", label: "คลังผ้าทอบุรีรัมย์" },
  { href: "/questionnaire", label: "เริ่มแบบสอบถาม" },
  { href: "/results", label: "ผลการแนะนำผ้า" },
  { href: "/stories", label: "เรื่องราวผ้าทอ" },
  { href: "/satisfaction", label: "ประเมินความพึงพอใจระบบ" },
  { href: "/about", label: "เกี่ยวกับระบบ" },
];

// โลโก้หน่วยงาน — วางไฟล์ไว้ใน public/ ตามชื่อ basename ด้านล่าง
// รองรับได้หลายนามสกุล ไฟล์ไหนยังไม่มีก็จะถูกข้ามไปเฉย ๆ (ไม่ขึ้นรูปหัก)
const LOGO_EXTENSIONS = [".png", ".svg", ".jpg", ".jpeg", ".webp"];

const ORG_LOGOS = [
  { basename: "logo-mhesi", alt: "กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม" },
  { basename: "logo-rise-fund", alt: "Thailand RISE FUND (ววน.)" },
  { basename: "logo-tsri", alt: "สำนักงานคณะกรรมการส่งเสริมวิทยาศาสตร์ วิจัยและนวัตกรรม (สกสว.)" },
  { basename: "logo-bru", alt: "มหาวิทยาลัยราชภัฏบุรีรัมย์" },
];

/** หา path จริงของโลโก้จากนามสกุลที่รองรับ — คืน null ถ้ายังไม่ได้วางไฟล์ */
function resolveLogo(basename: string): string | null {
  for (const ext of LOGO_EXTENSIONS) {
    const file = `${basename}${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", file))) {
      return `/${file}`;
    }
  }
  return null;
}

export function SiteFooter() {
  const logos = ORG_LOGOS.map((l) => ({ ...l, src: resolveLogo(l.basename) })).filter(
    (l): l is typeof l & { src: string } => l.src !== null
  );

  return (
    <footer className="bg-umber-deep text-clay/90">
      {/* เส้นทองผุบาง ๆ คู่กับแถบน้ำตาลดำที่หัวเว็บ ให้เป็น bookend เดียวกัน */}
      <div className="h-px bg-ochre/40" />
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row sm:items-start justify-between gap-8">
        <div>
          <p className="font-heading text-clay text-lg mb-1.5">ผ้าทอบุรีรัมย์</p>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed">
            ระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ
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

      {/* โลโก้หน่วยงาน — อยู่ในโซนน้ำตาลเดียวกับฟุตเตอร์
          แต่ละอันนั่งบนการ์ดขาว เพราะโลโก้เป็นสีเข้ม (ม่วง/น้ำเงิน/เขียว)
          วางบนพื้นน้ำตาลเข้มตรง ๆ แล้วกว่าครึ่งของภาพจะกลืนหายไป */}
      {logos.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <div className="border-t border-clay/10 pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            {logos.map((logo) => (
              <span
                key={logo.basename}
                className="bg-clay rounded-md px-4 py-3 flex items-center justify-center"
              >
                {/* ใช้ img ธรรมดาเพราะโลโก้แต่ละอันสัดส่วนไม่เท่ากัน
                    คุมด้วยความสูงคงที่แล้วปล่อยความกว้างอัตโนมัติ */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-clay/10">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs opacity-75">
          © {new Date().getFullYear()} ผ้าทอบุรีรัมย์
        </p>
      </div>
    </footer>
  );
}
