import Link from "next/link";

export type FabricCardData = {
  id: string;
  name: string;
  priceThb: number;
  community: { name: string; district: string } | null;
  images: { url: string; alt: string | null }[];
};

export function FabricCard({ fabric }: { fabric: FabricCardData }) {
  const primary = fabric.images[0];

  return (
    <Link
      href={`/fabrics/${fabric.id}`}
      className="group block bg-cream border border-cream-deep rounded-sm overflow-hidden hover:border-earth-deep transition"
    >
      <div className="aspect-4/5 bg-cream-deep relative overflow-hidden">
        {primary ? (
          // ยังไม่ใช้ next/image เพราะ Supabase Storage domain ต้องขึ้น remotePatterns ก่อน
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt={primary.alt ?? fabric.name}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <FabricPlaceholder name={fabric.name} />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-indigo text-lg leading-tight">
          {fabric.name}
        </h3>
        {fabric.community && (
          <p className="text-xs text-earth mt-1">
            {fabric.community.name} · {fabric.community.district}
          </p>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-heading text-brick text-lg">
            ฿{fabric.priceThb.toLocaleString()}
          </span>
          <span className="text-xs text-indigo group-hover:underline">
            ดูรายละเอียด →
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Placeholder ลายผ้าแบบ CSS ระหว่างที่ยังไม่มีภาพจริง */
export function FabricPlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-hidden
      className="h-full w-full flex items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-gold)_0_2px,transparent_2px_10px),repeating-linear-gradient(-45deg,var(--color-earth-deep)_0_1px,transparent_1px_14px)]"
    >
      <span className="font-heading text-indigo bg-cream/85 px-3 py-1 rounded-sm text-sm">
        {name}
      </span>
    </div>
  );
}
