import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { MobileNav } from "./mobile-nav";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/fabrics", label: "คลังผ้าทอบุรีรัมย์" },
  { href: "/questionnaire", label: "ระบบแนะนำเฉพาะบุคคล" },
  { href: "/questionnaire", label: "แบบสอบถามความสนใจผ้าทอ" },
  { href: "/results", label: "ผลการแนะนำผ้า" },
  { href: "/satisfaction", label: "ประเมินความพึงพอใจระบบ" },
  { href: "/about", label: "เกี่ยวกับระบบ" },
] as const;

const LOGO_FILENAME = "university-logo.png";

export function SiteHeader() {
  const hasLogo = fs.existsSync(
    path.join(process.cwd(), "public", LOGO_FILENAME)
  );

  return (
    <header className="sticky top-0 z-50 bg-umber-deep border-b border-ochre/30">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          {hasLogo && (
            <Image
              src={`/${LOGO_FILENAME}`}
              alt="โลโก้มหาวิทยาลัย"
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0"
            />
          )}
          <span className="flex flex-col leading-tight min-w-0">
            <span className="font-heading text-clay text-base sm:text-lg truncate">
              ระบบแนะนำผ้าทอพื้นบ้านบุรีรัมย์เฉพาะบุคคล
            </span>
            <span className="text-[11px] text-clay/70 hidden sm:block truncate">
              Buriram Woven Fabrics Personalized Recommender System
            </span>
          </span>
        </Link>

        <MobileNav links={NAV_LINKS} />
      </div>

      <nav className="hidden sm:flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mx-auto max-w-6xl px-6 pb-3">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={`${link.href}-${i}`}
            href={link.href}
            className="text-clay/90 hover:text-ochre"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
