"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CommunityOption = { id: string; name: string; district: string };

export function CommunityFilterDropdown({
  communities,
}: {
  communities: CommunityOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("community") ?? "";

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = communities.find((c) => c.id === selectedId);
  const label = selected ? `${selected.name} · ${selected.district}` : "ทุกชุมชน";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function select(id: string) {
    setOpen(false);
    router.push(id ? `/fabrics?community=${id}` : "/fabrics");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center justify-between gap-3 bg-clay border-2 border-clay-deep rounded-sm pl-3.5 pr-3 py-2.5 text-sm text-walnut w-full sm:w-96 cursor-pointer hover:border-umber-deep focus:outline-none focus:border-rust transition"
      >
        <span className="truncate">{label}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 text-umber-deep shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 w-full sm:w-max sm:min-w-full sm:max-w-md max-h-96 overflow-y-auto bg-clay border-2 border-clay-deep rounded-sm shadow-lg py-1"
        >
          <ListOption active={selectedId === ""} onClick={() => select("")}>
            ทุกชุมชน
          </ListOption>
          {communities.map((c) => (
            <ListOption
              key={c.id}
              active={selectedId === c.id}
              onClick={() => select(c.id)}
            >
              {c.name} · {c.district}
            </ListOption>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onClick}
        className={[
          "w-full text-left pl-3.5 pr-5 py-2.5 text-sm leading-snug transition flex items-start gap-2",
          active ? "bg-rust/10 text-rust font-medium" : "text-walnut hover:bg-clay-deep/60",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${active ? "bg-rust" : "bg-transparent"}`}
        />
        <span className="whitespace-normal">{children}</span>
      </button>
    </li>
  );
}
