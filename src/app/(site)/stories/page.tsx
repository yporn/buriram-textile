import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ARTICLE_CATEGORIES } from "@/lib/article-categories";
import { excerpt } from "@/lib/text";

export const revalidate = 300;

async function getArticles(category: string | undefined) {
  return prisma.article.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      title: true,
      category: true,
      coverUrl: true,
      content: true,
    },
  });
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const articles = await getArticles(category);

  return (
    <main className="flex-1 bg-cream">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <header>
          <p className="font-heading text-gold-text text-sm tracking-wide">
            เรื่องราวผ้าทอบุรีรัมย์
          </p>
          <h1 className="font-heading text-indigo text-2xl sm:text-3xl mt-2 leading-snug">
            ประวัติ ภูมิปัญญา และอัตลักษณ์ผ้าทอ
          </h1>
          <p className="text-sm text-earth mt-3 leading-relaxed max-w-2xl">
            เรื่องเล่าเบื้องหลังลวดลาย เทคนิคการทอ และชุมชนผู้สืบทอดภูมิปัญญาผ้าทอบุรีรัมย์
          </p>
        </header>

        {/* ---------- หมวดหมู่ (pill links — ไม่ต้องใช้ JS) ---------- */}
        <nav className="mt-8 flex flex-wrap gap-2">
          <CategoryPill href="/stories" active={!category}>
            ทั้งหมด
          </CategoryPill>
          {ARTICLE_CATEGORIES.map((c) => (
            <CategoryPill
              key={c}
              href={`/stories?category=${encodeURIComponent(c)}`}
              active={category === c}
            >
              {c}
            </CategoryPill>
          ))}
        </nav>

        {articles.length === 0 ? (
          <p className="text-earth italic mt-8">ยังไม่มีบทความในหมวดนี้</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/stories/${a.slug}`}
                className="group block bg-cream border border-cream-deep rounded-sm overflow-hidden hover:border-earth-deep transition"
              >
                <div className="aspect-video bg-cream-deep relative overflow-hidden">
                  {a.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.coverUrl}
                      alt={a.title}
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="h-full w-full bg-[repeating-linear-gradient(45deg,var(--color-gold)_0_2px,transparent_2px_14px),repeating-linear-gradient(-45deg,var(--color-earth-deep)_0_1px,transparent_1px_18px)]"
                    />
                  )}
                </div>
                <div className="p-5">
                  {a.category && (
                    <span className="text-xs text-gold-text tracking-wide">{a.category}</span>
                  )}
                  <h2 className="font-heading text-indigo text-lg mt-1 leading-snug">
                    {a.title}
                  </h2>
                  <p className="text-sm text-earth mt-2 leading-relaxed">
                    {excerpt(a.content)}
                  </p>
                  <span className="text-xs text-brick mt-3 inline-block group-hover:underline">
                    อ่านต่อ →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CategoryPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "text-sm px-4 py-1.5 rounded-sm border-2 transition",
        active
          ? "border-brick bg-brick text-cream"
          : "border-cream-deep bg-cream text-indigo hover:border-earth-deep",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
