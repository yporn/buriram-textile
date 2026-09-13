import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { FabricCard } from "@/components/fabric-card";
import { excerpt } from "@/lib/text";

export const revalidate = 300; // ผ้าตัวอย่างไม่เปลี่ยนบ่อย — cache 5 นาทีก็พอ

async function getFeaturedFabrics() {
  return prisma.fabric.findMany({
    where: { isPublished: true },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
    take: 3,
    include: {
      community: { select: { name: true, district: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });
}

type FeaturedFabric = Awaited<ReturnType<typeof getFeaturedFabrics>>[number];

async function getStats() {
  const [fabricCount, communityCount, articleCount] = await Promise.all([
    prisma.fabric.count({ where: { isPublished: true } }),
    prisma.community.count(),
    prisma.article.count({ where: { isPublished: true } }),
  ]);
  return { fabricCount, communityCount, articleCount };
}

async function getStoryTeasers() {
  return prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { slug: true, title: true, category: true, coverUrl: true, content: true },
  });
}

const HIGHLIGHTS = [
  {
    title: "แนะนำเฉพาะบุคคล",
    body: "ตอบแบบสอบถามสั้น ๆ 4 ตอน ระบบจะจับคู่กับผ้าที่ตรงกับสไตล์และโอกาสของคุณจริง ๆ",
  },
  {
    title: "อธิบายได้ทุกคำแนะนำ",
    body: "แสดงคะแนนความตรงรายมิติ พร้อมเหตุผลว่าทำไมผ้าผืนนี้ถึงเหมาะกับคุณ",
  },
  {
    title: "งบประมาณยืดหยุ่น",
    body: "งบเป็นตัวช่วยไม่ใช่ตัวตัด ผ้าดี ๆ ที่ราคาใกล้เคียงยังถูกแนะนำอยู่",
  },
  {
    title: "เชื่อมถึงชุมชนผู้ทอ",
    body: "รู้จักที่มาของผ้าแต่ละผืน ตั้งแต่ชุมชน อำเภอ ไปจนถึงเรื่องเล่าของลาย",
  },
];

export default async function HomePage() {
  const [fabrics, stats, storyTeasers] = await Promise.all([
    getFeaturedFabrics(),
    getStats(),
    getStoryTeasers(),
  ]);

  return (
    <>
      <main className="flex-1">
        {/* ---------- Hero: แบนเนอร์ใหญ่เต็มความกว้าง ---------- */}
        <section className="relative border-b border-clay-deep">
          <div className="relative h-120 sm:h-140 lg:h-170 w-full overflow-hidden">
            <Image
              src="/hero-fabric.png"
              alt="ผ้าไหมทอบุรีรัมย์ระยะใกล้ โทนชมพูอมส้ม เห็นลวดลายทอละเอียด"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            {/* scrim ไล่สีน้ำตาลดำจากซ้ายไปขวา ให้ตัวหนังสือฝั่งซ้ายอ่านง่ายบนภาพถ่าย */}
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-r from-umber-deep/90 via-umber-deep/55 to-umber-deep/10"
            />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto max-w-6xl px-6 w-full">
                <div className="max-w-xl">
                  <p className="font-heading text-ochre tracking-wide text-sm sm:text-base mb-4">
                    ผ้าทอพื้นบ้าน · จังหวัดบุรีรัมย์
                  </p>
                  <h1 className="font-heading text-clay text-3xl sm:text-4xl lg:text-5xl leading-snug">
                    ระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคล
                    <br className="hidden sm:block" />
                    ด้วยเทคโนโลยีอัจฉริยะ
                  </h1>
                  <p className="mt-6 text-base sm:text-lg leading-relaxed text-clay/90 max-w-xl">
                    รวบรวมข้อมูลผ้าทออัตลักษณ์และภูมิปัญญาจากชุมชนผู้ทอในจังหวัดบุรีรัมย์
                    ตอบแบบสอบถามเพื่อรับคำแนะนำผ้าที่สอดคล้องกับโอกาสใช้งาน สไตล์ และงบประมาณของคุณ
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/questionnaire"
                      className="inline-flex items-center justify-center bg-rust text-clay font-medium px-6 py-3 rounded-sm shadow-sm hover:bg-[#5C230F] transition"
                    >
                      เริ่มทำแบบสอบถาม
                    </Link>
                    <Link
                      href="#featured"
                      className="inline-flex items-center justify-center border border-clay text-clay font-medium px-6 py-3 rounded-sm hover:bg-clay hover:text-walnut transition"
                    >
                      ดูผ้าตัวอย่าง
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="border-b border-clay-deep bg-walnut/3">
          <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-3 gap-6 text-center">
            <StatItem value={stats.fabricCount} label="ลายผ้าอัตลักษณ์" />
            <StatItem value={stats.communityCount} label="ชุมชน / อำเภอ" />
            <StatItem value={stats.articleCount} label="เรื่องราวภูมิปัญญา" />
          </div>
          <p className="text-center text-xs text-umber pb-5 -mt-2">
            ข้อมูลลายผ้าอ้างอิงจากสำนักงานวัฒนธรรมจังหวัดบุรีรัมย์
          </p>
        </section>

        {/* ---------- Highlights ---------- */}
        <section className="border-b border-clay-deep bg-clay-deep/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="font-heading text-walnut text-2xl sm:text-3xl text-center mb-10">
              คุณสมบัติของระบบแนะนำ
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((h, i) => (
                <div
                  key={h.title}
                  className="bg-clay border border-clay-deep p-6 rounded-sm"
                >
                  <div className="font-heading text-ochre-text text-2xl mb-3">
                    0{i + 1}
                  </div>
                  <h3 className="font-heading text-walnut text-lg mb-2">
                    {h.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-umber">{h.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Featured fabrics ---------- */}
        <section id="featured" className="border-b border-clay-deep">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <div>
                <h2 className="font-heading text-walnut text-2xl sm:text-3xl">
                  ผ้าตัวอย่างจากชุมชนผู้ทอ
                </h2>
                <p className="text-sm text-umber mt-2">
                  บางส่วนของผ้าที่อยู่ในระบบแนะนำ — ทำแบบสอบถามเพื่อดูผลลัพธ์เฉพาะของคุณ
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href="/fabrics"
                  className="text-sm font-medium text-walnut underline underline-offset-4 hover:text-rust"
                >
                  ดูผ้าทั้งหมด →
                </Link>
                <Link
                  href="/questionnaire"
                  className="text-sm font-medium text-rust underline underline-offset-4 hover:text-walnut"
                >
                  เริ่มแบบสอบถาม →
                </Link>
              </div>
            </div>

            {fabrics.length === 0 ? (
              <p className="text-umber italic">
                ยังไม่มีผ้าในฐานข้อมูล กรุณาเพิ่มข้อมูลตัวอย่างก่อน
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {fabrics.map((f: FeaturedFabric) => (
                  <FabricCard key={f.id} fabric={f} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---------- Story teasers ---------- */}
        {storyTeasers.length > 0 && (
          <section className="border-b border-clay-deep bg-clay-deep/40">
            <div className="mx-auto max-w-6xl px-6 py-16">
              <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
                <div>
                  <p className="font-heading text-ochre-text text-sm tracking-wide">
                    เรื่องราวผ้าทอ
                  </p>
                  <h2 className="font-heading text-walnut text-2xl sm:text-3xl mt-2">
                    ภูมิปัญญาเบื้องหลังลวดลาย
                  </h2>
                </div>
                <Link
                  href="/stories"
                  className="text-sm font-medium text-walnut underline underline-offset-4 hover:text-rust shrink-0"
                >
                  อ่านเรื่องราวทั้งหมด →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {storyTeasers.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/stories/${a.slug}`}
                    className="group block bg-clay border border-clay-deep rounded-sm overflow-hidden hover:border-umber-deep transition"
                  >
                    <div className="aspect-video bg-clay-deep relative overflow-hidden">
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
                          className="h-full w-full bg-[repeating-linear-gradient(45deg,var(--color-ochre)_0_2px,transparent_2px_14px),repeating-linear-gradient(-45deg,var(--color-umber-deep)_0_1px,transparent_1px_18px)]"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      {a.category && (
                        <span className="text-xs text-ochre-text tracking-wide">
                          {a.category}
                        </span>
                      )}
                      <h3 className="font-heading text-walnut text-base mt-1 leading-snug">
                        {a.title}
                      </h3>
                      <p className="text-xs text-umber mt-2 leading-relaxed">
                        {excerpt(a.content, 90)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------- Final CTA ---------- */}
        <section className="relative bg-walnut text-clay overflow-hidden">
          {/* ลายเรขาคณิตเบา ๆ คลุมพื้นหลัง ให้เข้าธีมงานคราฟต์แทนพื้นสีทึบ */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(45deg,var(--color-ochre)_0_2px,transparent_2px_16px),repeating-linear-gradient(-45deg,var(--color-ochre)_0_2px,transparent_2px_16px)]"
          />
          <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20 text-center">
            <span
              aria-hidden
              className="inline-block h-px w-12 bg-ochre mb-5"
            />
            <p className="text-xs sm:text-sm tracking-[0.2em] text-clay/70 uppercase mb-3">
              แบบสอบถามคำแนะนำ
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl mb-4 leading-snug">
              เริ่มทำแบบสอบถามเพื่อรับคำแนะนำผ้าทอ
            </h2>
            <p className="text-clay/85 mb-8 leading-relaxed max-w-xl mx-auto">
              ใช้เวลาประมาณ 1-2 นาที ตอบคำถาม 4 ตอน
              เพื่อรับคำแนะนำผ้าทอบุรีรัมย์ที่ตรงกับความต้องการของคุณ พร้อมเหตุผลประกอบ
            </p>
            <Link
              href="/questionnaire"
              className="inline-flex items-center justify-center bg-rust text-clay font-medium px-8 py-3 rounded-sm shadow-sm hover:bg-[#5C230F] transition"
            >
              เริ่มทำแบบสอบถาม
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- ส่วนย่อยของหน้า ---------- */

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-heading text-walnut text-3xl sm:text-4xl">{value}</p>
      <p className="text-xs sm:text-sm text-umber mt-1">{label}</p>
    </div>
  );
}
