import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { FiredRule, HardGateResult } from "@/lib/rule-engine";
import { FabricGallery } from "./FabricGallery";

export const dynamic = "force-dynamic";

// รูปร่างของ matchDetail ที่ recommender บันทึกไว้
// ฟิลด์ rule ทั้งหมดเป็น optional เพราะ session ที่เก็บก่อนมี rule engine จะไม่มีค่าพวกนี้
type StoredMatchDetail = {
  ruleTrace?: FiredRule[] | null;
  hardGate?: HardGateResult | null;
};

/** ดึง Rule Trace ของผ้าผืนนี้ เฉพาะเมื่อเข้ามาจากผลการแนะนำ (มี ?session=) */
async function getRuleTrace(fabricId: string, sessionId: string | undefined) {
  if (!sessionId) return null;

  const result = await prisma.recommendationResult.findUnique({
    where: { sessionId_fabricId: { sessionId, fabricId } },
    select: { matchDetail: true, score: true },
  });
  if (!result) return null;

  const detail = result.matchDetail as unknown as StoredMatchDetail | null;
  const ruleTrace = detail?.ruleTrace ?? [];
  const hardGate = detail?.hardGate ?? null;

  // session เก่าก่อนมี rule engine → ไม่มีอะไรให้แสดง
  if (ruleTrace.length === 0 && !hardGate) return null;

  return { ruleTrace, hardGate, score: result.score };
}

// ช่องทางติดต่อของชุมชนมักกรอกเป็นเบอร์โทร — ถ้าหน้าตาเหมือนเบอร์โทรจริง
// ให้ปุ่ม "ติดต่อสั่งซื้อ" โทรออกได้เลย ไม่งั้น fallback เป็นข้อความธรรมดา
function isLikelyPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 10;
}

function toTelHref(value: string): string {
  return `tel:${value.replace(/\D/g, "")}`;
}

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
  const trace = await getRuleTrace(id, sessionId);

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

        {/* ---------- Rule Trace: กฎการอนุมานที่ถูกกระตุ้น ---------- */}
        {trace && (
          <section className="mt-12 border-t border-clay-deep pt-8">
            <p className="font-heading text-ochre-text text-sm tracking-wide">
              เหตุผลเชิงกฎของระบบ
            </p>
            <h2 className="font-heading text-walnut text-xl sm:text-2xl mt-2 mb-2">
              กฎการอนุมานที่ถูกกระตุ้น
            </h2>
            <p className="text-sm text-umber mb-4 leading-relaxed">
              ระบบแนะนำผ้าผืนนี้ให้คุณด้วยคะแนนความสอดคล้อง{" "}
              {Math.round(trace.score * 100)}% จากกฎต่อไปนี้
            </p>

            <ul className="space-y-2 max-w-3xl">
              {trace.ruleTrace.map((r) => (
                <li
                  key={r.code}
                  className="flex items-start gap-2 bg-clay-deep/40 border border-clay-deep rounded-sm px-3 py-2"
                >
                  <span aria-hidden className="text-rust shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span className="text-sm text-umber leading-relaxed">
                    <span className="font-heading text-walnut">
                      [Rule {r.code}]
                    </span>{" "}
                    {r.conditionLabelTh} ➔ {r.explanationTh}{" "}
                    <span className="font-heading text-rust whitespace-nowrap">
                      (+{Math.round(r.weight * 100)}%)
                    </span>
                  </span>
                </li>
              ))}

              {trace.hardGate && (
                <li className="flex items-start gap-2 bg-clay-deep/40 border border-clay-deep rounded-sm px-3 py-2">
                  <span
                    aria-hidden
                    className={`shrink-0 mt-0.5 ${
                      trace.hardGate.passed ? "text-rust" : "text-umber"
                    }`}
                  >
                    {trace.hardGate.passed ? "✓" : "✕"}
                  </span>
                  <span className="text-sm text-umber leading-relaxed">
                    <span className="font-heading text-walnut">
                      [Hard Gate F_hard = {trace.hardGate.passed ? 1 : 0}]
                    </span>{" "}
                    {trace.hardGate.reasonTh}
                  </span>
                </li>
              )}
            </ul>

            {trace.ruleTrace.length === 0 && (
              <p className="text-sm text-umber italic mt-2">
                ไม่มีกฎการอนุมานข้อใดถูกกระตุ้นกับผ้าผืนนี้
              </p>
            )}
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
              <div className="mt-4">
                {isLikelyPhoneNumber(fabric.community.contact) ? (
                  <>
                    <p className="text-sm text-umber mb-3">
                      เบอร์โทรติดต่อ: {fabric.community.contact}
                    </p>
                    <a
                      href={toTelHref(fabric.community.contact)}
                      className="inline-flex items-center gap-2 bg-rust text-clay font-medium px-5 py-2.5 rounded-sm shadow-sm hover:bg-[#5C230F] transition"
                    >
                      📲 ติดต่อสั่งซื้อ / สนับสนุนชุมชน
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-umber">
                    ติดต่อ: {fabric.community.contact}
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
