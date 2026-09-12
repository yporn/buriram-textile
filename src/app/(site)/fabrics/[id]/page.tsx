import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FabricGallery } from "./FabricGallery";

export const dynamic = "force-dynamic";

async function getFabric(id: string) {
  return prisma.fabric.findUnique({
    where: { id },
    include: {
      community: true,
      images: { orderBy: { sortOrder: "asc" } },
      tags: {
        include: { tag: { include: { category: true } } },
      },
    },
  });
}

/** บันทึกว่ามีคนกดเข้าดูผ้านี้จาก session ไหน (พฤติกรรมจริง) + นับ view รวม */
async function trackView(fabricId: string, sessionId: string | undefined) {
  await prisma.fabric.update({
    where: { id: fabricId },
    data: { viewCount: { increment: 1 } },
  });
  if (sessionId) {
    await prisma.recommendationResult
      .update({
        where: { sessionId_fabricId: { sessionId, fabricId } },
        data: { clicked: true },
      })
      .catch(() => {
        // ไม่มี result คู่นี้จริง (เช่น sessionId ปลอม) — ไม่ต้องทำอะไรต่อ
      });
  }
}

export default async function FabricDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id } = await params;
  const { session: sessionId } = await searchParams;

  const fabric = await getFabric(id);
  if (!fabric || !fabric.isPublished) notFound();

  await trackView(id, sessionId);

  const tagsByCategory = new Map<string, { nameTh: string; tags: string[] }>();
  for (const ft of fabric.tags) {
    const catCode = ft.tag.category.code;
    const catNameTh = ft.tag.category.nameTh;
    if (!tagsByCategory.has(catCode)) {
      tagsByCategory.set(catCode, { nameTh: catNameTh, tags: [] });
    }
    tagsByCategory.get(catCode)!.tags.push(ft.tag.nameTh);
  }

  const backHref = sessionId ? `/results/${sessionId}` : "/questionnaire";
  const backLabel = sessionId ? "← กลับไปยังผลลัพธ์" : "← ทำแบบสอบถามเพื่อดูผ้าที่เหมาะกับคุณ";

  return (
    <main className="flex-1 bg-clay">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href={backHref}
          className="text-sm text-rust underline underline-offset-4 hover:text-walnut"
        >
          {backLabel}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* ---------- รูปภาพ ---------- */}
          <FabricGallery images={fabric.images} fabricName={fabric.name} />

          {/* ---------- ข้อมูลหลัก ---------- */}
          <div>
            {fabric.community && (
              <p className="font-heading text-ochre-text text-sm tracking-wide">
                {fabric.community.name} · {fabric.community.district}
              </p>
            )}
            <h1 className="font-heading text-walnut text-2xl sm:text-3xl mt-2 leading-snug">
              {fabric.name}
            </h1>
            <p className="font-heading text-rust text-2xl mt-3">
              ฿{fabric.priceThb.toLocaleString()}
            </p>
            <p className="text-sm text-umber mt-4 leading-relaxed">
              {fabric.description}
            </p>

            {/* ---------- คุณลักษณะ (tag แยกตามหมวด) ---------- */}
            {tagsByCategory.size > 0 && (
              <div className="mt-6 space-y-3">
                {[...tagsByCategory.entries()].map(([code, { nameTh, tags }]) => (
                  <div key={code}>
                    <p className="text-xs text-umber mb-1.5">{nameTh}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2.5 py-1 rounded-sm border border-clay-deep text-walnut bg-clay-deep/40"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/questionnaire"
                className="bg-rust text-clay font-medium px-6 py-2.5 rounded-sm hover:bg-[#5C230F] transition"
              >
                ค้นหาผ้าที่เหมาะกับฉัน
              </Link>
            </div>
          </div>
        </div>

        {/* ---------- เรื่องราวของผ้า ---------- */}
        {fabric.story && (
          <section className="mt-12 border-t border-clay-deep pt-8">
            <p className="font-heading text-ochre-text text-sm tracking-wide">
              เรื่องเล่าของผ้าผืนนี้
            </p>
            <h2 className="font-heading text-walnut text-xl sm:text-2xl mt-2 mb-4">
              ประวัติ ที่มา และภูมิปัญญา
            </h2>
            <div className="text-sm text-umber leading-relaxed whitespace-pre-line max-w-3xl">
              {fabric.story}
            </div>
          </section>
        )}

        {/* ---------- ชุมชนผู้ทอ ---------- */}
        {fabric.community && (
          <section className="mt-12 border-t border-clay-deep pt-8">
            <p className="font-heading text-ochre-text text-sm tracking-wide">
              แหล่งผลิต
            </p>
            <h2 className="font-heading text-walnut text-xl sm:text-2xl mt-2 mb-4">
              {fabric.community.name}
            </h2>
            <p className="text-sm text-umber mb-3">
              อำเภอ{fabric.community.district} · จังหวัดบุรีรัมย์
            </p>
            {fabric.community.story && (
              <p className="text-sm text-umber leading-relaxed max-w-3xl whitespace-pre-line">
                {fabric.community.story}
              </p>
            )}
            {fabric.community.contact && (
              <p className="text-sm text-umber mt-3">
                ติดต่อ: {fabric.community.contact}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
