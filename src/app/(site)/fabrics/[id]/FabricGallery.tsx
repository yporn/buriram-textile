"use client";

import { useState } from "react";

type GalleryImage = { id: string; url: string; alt: string | null };

export function FabricGallery({
  images,
  fabricName,
}: {
  images: GalleryImage[];
  fabricName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div>
      <div className="aspect-4/5 bg-cream-deep rounded-sm overflow-hidden">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.url}
            alt={active.alt ?? fabricName}
            className="h-full w-full object-cover"
          />
        ) : (
          <FabricPlaceholder name={fabricName} />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`ดูรูปที่ ${i + 1}`}
              aria-pressed={i === activeIndex}
              className={[
                "aspect-square rounded-sm overflow-hidden border-2 transition",
                i === activeIndex
                  ? "border-brick"
                  : "border-cream-deep hover:border-earth-deep",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? `${fabricName} รูปที่ ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FabricPlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-hidden
      className="h-full w-full flex items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-gold)_0_2px,transparent_2px_14px),repeating-linear-gradient(-45deg,var(--color-earth-deep)_0_1px,transparent_1px_18px)]"
    >
      <span className="font-heading text-indigo bg-cream/85 px-3 py-1 rounded-sm text-sm">
        {name}
      </span>
    </div>
  );
}
