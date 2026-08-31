import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

async function getArticle(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: {
      relatedFabric: {
        include: {
          community: { select: { name: true, district: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
        },
      },
    },
  });
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  // slug ภาษาไทยมาถึงตรงนี้แบบยังไม่ decode (พฤติกรรมที่พบใน Next.js 16.2.10 + Turbopack)
  const slug = decodeURIComponent(rawSlug);
  const article = await getArticle(slug);

  if (!article || !article.isPublished) notFound();

  return (
    <main className="flex-1 bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
        <Link
          href="/stories"
          className="text-sm text-brick underline underline-offset-4 hover:text-indigo"
        >
          ← เรื่องราวผ้าทอทั้งหมด
        </Link>

        <header className="mt-6">
          {article.category && (
            <p className="font-heading text-gold-text text-sm tracking-wide">
              {article.category}
            </p>
          )}
          <h1 className="font-heading text-indigo text-2xl sm:text-3xl mt-2 leading-snug">
            {article.title}
          </h1>
        </header>

        {article.coverUrl && (
          <div className="mt-6 aspect-video bg-cream-deep rounded-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mt-8 text-sm sm:text-base text-earth leading-relaxed whitespace-pre-line">
          {article.content}
        </div>

        {article.relatedFabric && (
          <div className="mt-12 border-t border-cream-deep pt-8">
            <p className="text-xs text-earth mb-3">ผ้าทอที่เกี่ยวข้องกับเรื่องราวนี้</p>
            <Link
              href={`/fabrics/${article.relatedFabric.id}`}
              className="group flex items-center gap-4 bg-cream-deep/40 border border-cream-deep rounded-sm p-4 hover:border-earth-deep transition"
            >
              <div className="h-16 w-16 shrink-0 bg-cream-deep rounded-sm overflow-hidden">
                {article.relatedFabric.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.relatedFabric.images[0].url}
                    alt={article.relatedFabric.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-heading text-indigo group-hover:text-brick transition">
                  {article.relatedFabric.name}
                </p>
                {article.relatedFabric.community && (
                  <p className="text-xs text-earth mt-0.5">
                    {article.relatedFabric.community.name} ·{" "}
                    {article.relatedFabric.community.district}
                  </p>
                )}
              </div>
              <span className="ml-auto text-sm text-brick group-hover:underline shrink-0">
                ดูผ้าผืนนี้ →
              </span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
