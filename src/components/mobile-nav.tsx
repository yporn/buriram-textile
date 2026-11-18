"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav({
  links,
}: {
  links: readonly { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        className="p-2 -mr-2 text-clay"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full bg-umber-deep border-b border-ochre/30 px-6 py-4 flex flex-col gap-1">
          {links.map((link, i) => (
            <Link
              key={`${link.href}-${i}`}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-clay/90 hover:text-ochre py-2 text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
