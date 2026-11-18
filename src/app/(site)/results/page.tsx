import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FabricCard } from "@/components/fabric-card";

export const revalidate = 300;

const HOW_IT_WORKS = [
  {
    title: "ตอบแบบสอบถาม",
    body: "ตอบคำถามเกี่ยวกับความชอบ โอกาสใช้งาน และงบประมาณของคุณ",
  },
  {
    title: "ระบบให้คะแนนความตรง",
    body: "คำนวณคะแนนความสอดคล้องของผ้าแต่ละผืนรายมิติ (สี ลาย เนื้อผ้า งบประมาณ ฯลฯ)",
  },
  {
    title: "แสดงผลลัพธ์พร้อมเหตุผล",
    body: "จัดอันดับผ้าที่เหมาะกับคุณที่สุด พร้อมอธิบายว่าทำไมถึงแนะนำผ้าผืนนั้น",
  },
];

async function getPopularFabrics() {
  const grouped = await prisma.recommendationResult.groupBy({
    by: ["fabricId"],
    _count: { fabricId: true },
    orderBy: { _count: { fabricId: "desc" } },
    take: 6,
  });

  if (grouped.length > 0) {
    const fabrics = await prisma.fabric.findMany({
      where: { id: { in: grouped.map((g) => g.fabricId) }, isPublished: true },
      include: {
        community: { select: { name: true, district: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
      },
    });
    const order = new Map(grouped.map((g, i) => [g.fabricId, i]));
    return {
      fabrics: fabrics.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
      isFallback: false,
    };
  }

  const fabrics = await prisma.fabric.findMany({
    where: { isPublished: true },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      community: { select: { name: true, district: true } },
      images: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
    },
  });
  return { fabrics, isFallback: true };
}

export default async function ResultsOverviewPage() {
  const { fabrics, isFallback } = await getPopularFabrics();

  return (
    <main className="flex-1">
      <section className="border-b border-clay-deep bg-clay-deep/40">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <p className="font-heading text-ochre-text text-sm tracking-wide">
            ผลการแนะนำผ้า
          </p>
          <h1 className="font-heading text-walnut text-2xl sm:text-3xl mt-2 leading-snug max-w-2xl">
            ระบบแนะนำผ้าทอทำงานอย่างไร
          </h1>
          <p className="text-sm text-umber mt-3 max-w-2xl leading-relaxed">
            ผลการแนะนำเฉพาะบุคคลของคุณจะอยู่ในหน้าแยกต่างหากหลังตอบแบบสอบถาม
            หน้านี้สรุปขั้นตอนการทำงานของระบบ และผ้าที่ถูกแนะนำบ่อยที่สุดจากผู้ใช้ทุกคน
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.title} className="bg-clay border border-clay-deep p-5 rounded-sm">
                <div className="font-heading text-ochre-text text-xl mb-2">0{i + 1}</div>
                <h3 className="font-heading text-walnut text-base mb-1.5">{h.title}</h3>
                <p className="text-xs leading-relaxed text-umber">{h.body}</p>
              </div>
            ))}
          </div>

          <Link
            href="/questionnaire"
            className="mt-8 inline-flex items-center justify-center bg-rust text-clay font-medium px-6 py-3 rounded-sm shadow-sm hover:bg-[#5C230F] transition"
          >
            เริ่มทำแบบสอบถามเพื่อดูผลของคุณ
          </Link>
        </div>
      </section>

      <section className="border-b border-clay-deep">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <h2 className="font-heading text-walnut text-xl sm:text-2xl mb-2">
            {isFallback ? "ผ้ายอดนิยมในระบบ" : "ผ้าที่ถูกแนะนำบ่อยที่สุด"}
          </h2>
          <p className="text-sm text-umber mb-8">
            {isFallback
              ? "ยังไม่มีข้อมูลผลการแนะนำ — รายการนี้เรียงจากผ้าที่มีผู้เข้าชมมากที่สุดแทน"
              : "ผ้าที่ระบบแนะนำให้ผู้ใช้บ่อยที่สุดจากข้อมูลทุก session"}
          </p>

          {fabrics.length === 0 ? (
            <p className="text-umber italic">ยังไม่มีผ้าในฐานข้อมูล</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fabrics.map((f) => (
                <FabricCard key={f.id} fabric={f} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
