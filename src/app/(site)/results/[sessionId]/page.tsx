import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { DimensionMatch, MatchLevel } from "@/lib/recommender";
import { FeedbackForm } from "./FeedbackForm";

// ผลลัพธ์เฉพาะบุคคล — ห้าม cache
export const dynamic = "force-dynamic";

// รูปร่างที่ recommender บันทึกลง matchDetail (Prisma.Json)
type MatchDetail = {
  label: "เหมาะมาก" | "เหมาะ" | "พอได้";
  dimensions: DimensionMatch[];
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.recommendationSession.findUnique({
    where: { id: sessionId },
    include: {
      results: {
        orderBy: { rank: "asc" },
        include: {
          fabric: {
            include: {
              community: { select: { name: true, district: true } },
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
      feedback: true,
    },
  });

  if (!session) notFound();

  const total = session.results.length;

  return (
    <main className="flex-1 bg-clay">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <header>
          <p className="font-heading text-ochre-text text-sm tracking-wide">
            ผลการแนะนำเฉพาะบุคคล
          </p>
          <h1 className="font-heading text-walnut text-2xl sm:text-3xl mt-2 leading-snug">
            {total > 0
              ? `จากคำตอบของคุณ พบผ้าทอที่เหมาะสม ${total} ผืน`
              : "ยังไม่มีผ้าที่จับคู่ได้จากคำตอบของคุณ"}
          </h1>
          <p className="text-sm text-umber mt-3 leading-relaxed">
            แต่ละคะแนนคำนวณจากความตรงรายมิติที่คุณเลือกไว้ในแบบสอบถาม
            ระบบแสดงเหตุผลใต้ผ้าแต่ละผืนเพื่อความโปร่งใส
          </p>
        </header>

        {total === 0 ? (
          <EmptyState sessionId={sessionId} />
        ) : (
          <div className="mt-8 space-y-4">
            {session.results.map((r) => {
              const detail = r.matchDetail as unknown as MatchDetail;
              return (
                <ResultCard
                  key={r.fabricId}
                  sessionId={sessionId}
                  rank={r.rank}
                  score={r.score}
                  label={detail.label}
                  dimensions={detail.dimensions}
                  fabric={r.fabric}
                />
              );
            })}
          </div>
        )}

        <div className="mt-12 border-t border-clay-deep pt-8">
          <FeedbackForm
            sessionId={sessionId}
            initialIsRelevant={session.feedback?.isRelevant ?? null}
            initialComment={session.feedback?.comment ?? ""}
          />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/questionnaire"
            className="text-sm text-rust underline underline-offset-4 hover:text-walnut"
          >
            ← ทำแบบสอบถามใหม่อีกครั้ง
          </Link>
        </div>
      </div>
    </main>
  );
}

// ---------- Result card ----------

type ResultCardProps = {
  sessionId: string;
  rank: number;
  score: number;
  label: MatchDetail["label"];
  dimensions: DimensionMatch[];
  fabric: {
    id: string;
    name: string;
    priceThb: number;
    community: { name: string; district: string } | null;
    images: { url: string; alt: string | null }[];
  };
};

function ResultCard({
  sessionId,
  rank,
  score,
  label,
  dimensions,
  fabric,
}: ResultCardProps) {
  const primary = fabric.images[0];
  const scorePercent = Math.round(score * 100);

  return (
    <article className="bg-clay border border-clay-deep rounded-sm overflow-hidden grid sm:grid-cols-[180px_1fr]">
      {/* ---------- รูปผ้า ---------- */}
      <div className="relative bg-clay-deep aspect-4/5 sm:aspect-auto">
        <span className="absolute top-2 left-2 bg-umber-deep text-clay font-heading text-sm px-2 py-1 rounded-sm z-10">
          #{rank}
        </span>
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt={primary.alt ?? fabric.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FabricPlaceholder name={fabric.name} />
        )}
      </div>

      {/* ---------- เนื้อหา ---------- */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-heading text-walnut text-lg sm:text-xl leading-tight">
              {fabric.name}
            </h2>
            {fabric.community && (
              <p className="text-xs text-umber mt-1">
                {fabric.community.name} · {fabric.community.district}
              </p>
            )}
            <p className="font-heading text-rust text-lg mt-2">
              ฿{fabric.priceThb.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <ScoreBadge score={scorePercent} label={label} />
          </div>
        </div>

        <div className="mt-4 border-t border-clay-deep pt-3">
          <p className="text-xs text-umber mb-2">เหตุผลที่แนะนำ:</p>
          <ul className="space-y-1.5">
            {dimensions.map((d) => (
              <DimensionRow key={d.categoryCode} dim={d} />
            ))}
          </ul>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Link
            href={`/fabrics/${fabric.id}?session=${sessionId}`}
            className="text-sm text-rust font-medium underline underline-offset-4 hover:text-walnut"
          >
            ดูรายละเอียด →
          </Link>
        </div>
      </div>
    </article>
  );
}

function ScoreBadge({ score, label }: { score: number; label: MatchDetail["label"] }) {
  // สีพื้นหลัง + ตัวอักษรเลือกให้คอนทราสต์ผ่านเกณฑ์อ่านง่าย (AA ขึ้นไป) แม้บนพื้นสีทองผุ
  const tone =
    label === "เหมาะมาก"
      ? "bg-rust text-clay"
      : label === "เหมาะ"
      ? "bg-ochre text-umber-deep"
      : "bg-umber text-clay";
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="font-heading text-walnut text-2xl leading-none">
        {score}%
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm ${tone}`}>
        {label}
      </span>
    </div>
  );
}

function DimensionRow({ dim }: { dim: DimensionMatch }) {
  const icon = iconForLevel(dim.level);
  return (
    <li className="flex items-start gap-2 text-sm">
      <span aria-hidden className="mt-0.5 shrink-0">
        {icon}
      </span>
      <span className="text-umber leading-relaxed">{dim.reasonTh}</span>
    </li>
  );
}

function iconForLevel(level: MatchLevel) {
  if (level === "full")
    return (
      <span className="inline-block h-4 w-4 rounded-full bg-rust text-clay text-[10px] leading-4 text-center">
        ✓
      </span>
    );
  if (level === "partial")
    return (
      <span className="inline-block h-4 w-4 rounded-full bg-ochre text-clay text-[10px] leading-4 text-center">
        ~
      </span>
    );
  return (
    <span className="inline-block h-4 w-4 rounded-full border border-umber/50 text-umber text-[10px] leading-4 text-center">
      ×
    </span>
  );
}

// ---------- Placeholder + empty ----------

function FabricPlaceholder({ name }: { name: string }) {
  return (
    <div
      aria-hidden
      className="h-full w-full flex items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-ochre)_0_2px,transparent_2px_10px),repeating-linear-gradient(-45deg,var(--color-umber-deep)_0_1px,transparent_1px_14px)]"
    >
      <span className="font-heading text-walnut bg-clay/85 px-2 py-1 rounded-sm text-xs">
        {name}
      </span>
    </div>
  );
}

function EmptyState({ sessionId }: { sessionId: string }) {
  return (
    <div className="mt-8 border border-clay-deep bg-clay-deep/40 rounded-sm p-6 sm:p-8 text-center">
      <p className="text-umber leading-relaxed">
        เนื่องจากคำตอบของคุณยังไม่มีข้อมูลความชอบเพียงพอ ระบบจึงยังจับคู่ผ้าไม่ได้
        <br />
        ลองทำแบบสอบถามใหม่ แล้วให้คะแนนความชอบสัก 2-3 รายการดูนะ
      </p>
      <p className="text-xs text-umber mt-4">
        session id:{" "}
        <code className="bg-clay px-1.5 py-0.5 border border-clay-deep rounded-sm">
          {sessionId}
        </code>
      </p>
    </div>
  );
}
