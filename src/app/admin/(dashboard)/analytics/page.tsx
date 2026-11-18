import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TREND_DAYS = 14;

const Q_KEYS = [
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
  "q11", "q12", "q13", "q14", "q15", "q16", "q17", "q18", "q19",
] as const;

async function getAnalytics() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const trendStart = new Date(now);
  trendStart.setDate(now.getDate() - (TREND_DAYS - 1));
  trendStart.setHours(0, 0, 0, 0);

  const [
    totalSessions,
    sessionsLast7d,
    recentSessions,
    totalResults,
    clickedResults,
    totalFabrics,
    publishedFabrics,
    satisfactionCount,
    satisfactionAvg,
    feedbackTotal,
    feedbackRelevant,
    topRecommendedGrouped,
    topViewed,
  ] = await Promise.all([
    prisma.recommendationSession.count(),
    prisma.recommendationSession.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.recommendationSession.findMany({
      where: { createdAt: { gte: trendStart } },
      select: { createdAt: true },
    }),
    prisma.recommendationResult.count(),
    prisma.recommendationResult.count({ where: { clicked: true } }),
    prisma.fabric.count(),
    prisma.fabric.count({ where: { isPublished: true } }),
    prisma.satisfactionSurvey.count(),
    prisma.satisfactionSurvey.aggregate({
      _avg: Object.fromEntries(Q_KEYS.map((k) => [k, true])) as Record<
        (typeof Q_KEYS)[number],
        true
      >,
    }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { isRelevant: true } }),
    prisma.recommendationResult.groupBy({
      by: ["fabricId"],
      _count: { fabricId: true },
      orderBy: { _count: { fabricId: "desc" } },
      take: 10,
    }),
    prisma.fabric.findMany({
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { id: true, name: true, viewCount: true },
    }),
  ]);

  const recommendedFabrics = await prisma.fabric.findMany({
    where: { id: { in: topRecommendedGrouped.map((g) => g.fabricId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(recommendedFabrics.map((f) => [f.id, f.name]));
  const topRecommended = topRecommendedGrouped.map((g) => ({
    id: g.fabricId,
    name: nameById.get(g.fabricId) ?? "(ไม่พบผ้า)",
    count: g._count.fabricId,
  }));

  // แนวโน้ม N วันล่าสุด — zero-fill วันที่ไม่มีคนทำแบบสอบถาม
  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart);
    d.setDate(trendStart.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const s of recentSessions) {
    const key = s.createdAt.toISOString().slice(0, 10);
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
  }
  const trend = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));

  const avg = satisfactionAvg._avg;
  const satisfactionGroups =
    satisfactionCount > 0
      ? [
          { label: "ด้านประสิทธิภาพของระบบ", value: averageOf(avg, ["q1", "q2", "q3", "q4", "q5", "q6"]) },
          { label: "ด้านการใช้งานระบบ", value: averageOf(avg, ["q7", "q8", "q9", "q10", "q11", "q12"]) },
          { label: "ด้านการอธิบายเหตุผล", value: averageOf(avg, ["q13", "q14", "q15"]) },
          { label: "ด้านประโยชน์และการยอมรับเทคโนโลยี", value: averageOf(avg, ["q16", "q17", "q18", "q19"]) },
        ]
      : [];
  const overallSatisfaction =
    satisfactionCount > 0 ? averageOf(avg, Q_KEYS) : null;

  return {
    totalSessions,
    sessionsLast7d,
    trend,
    clickThroughRate: totalResults > 0 ? clickedResults / totalResults : null,
    totalFabrics,
    publishedFabrics,
    satisfactionCount,
    overallSatisfaction,
    satisfactionGroups,
    feedbackTotal,
    feedbackRelevant,
    topRecommended,
    topViewed,
  };
}

function averageOf(
  avg: Partial<Record<(typeof Q_KEYS)[number], number | null>>,
  keys: readonly (typeof Q_KEYS)[number][]
): number {
  const values = keys.map((k) => avg[k] ?? 0);
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics();
  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count));
  const maxRecommended = Math.max(1, ...data.topRecommended.map((r) => r.count));
  const maxViewed = Math.max(1, ...data.topViewed.map((f) => f.viewCount));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-walnut text-2xl">สถิติการใช้งาน</h1>
        <p className="text-sm text-umber mt-1">
          ภาพรวมการสืบค้นและลายผ้าทอที่ได้รับความนิยมสูงสุดจากผู้ใช้งาน
        </p>
      </div>

      {/* ---------- Stat tiles ---------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatTile label="ทำแบบสอบถามทั้งหมด" value={data.totalSessions.toLocaleString()} />
        <StatTile label="ทำแบบสอบถาม 7 วันล่าสุด" value={data.sessionsLast7d.toLocaleString()} />
        <StatTile
          label="อัตราคลิกดูรายละเอียดจากคำแนะนำ"
          value={data.clickThroughRate != null ? `${Math.round(data.clickThroughRate * 100)}%` : "—"}
        />
        <StatTile
          label="ผ้าเผยแพร่แล้ว / ทั้งหมด"
          value={`${data.publishedFabrics} / ${data.totalFabrics}`}
        />
        <StatTile
          label="คำแนะนำที่ผู้ใช้บอกว่าตรงใจ"
          value={
            data.feedbackTotal > 0
              ? `${Math.round((data.feedbackRelevant / data.feedbackTotal) * 100)}%`
              : "—"
          }
          hint={data.feedbackTotal > 0 ? `จาก ${data.feedbackTotal} ความเห็น` : "ยังไม่มีความเห็น"}
        />
        <StatTile
          label="แบบประเมินความพึงพอใจที่ตอบแล้ว"
          value={data.satisfactionCount.toLocaleString()}
        />
        <StatTile
          label="ความพึงพอใจโดยรวมเฉลี่ย"
          value={data.overallSatisfaction != null ? `${data.overallSatisfaction.toFixed(1)} / 5` : "—"}
        />
      </div>

      {/* ---------- Trend ---------- */}
      <section className="bg-clay border border-clay-deep rounded-sm p-5 mb-6">
        <h2 className="font-heading text-walnut text-base mb-4">
          แนวโน้มการทำแบบสอบถาม {TREND_DAYS} วันล่าสุด
        </h2>
        <TrendChart data={data.trend} max={maxTrend} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Top recommended ---------- */}
        <section className="bg-clay border border-clay-deep rounded-sm p-5">
          <h2 className="font-heading text-walnut text-base mb-4">
            ผ้าที่ถูกแนะนำบ่อยที่สุด
          </h2>
          {data.topRecommended.length === 0 ? (
            <p className="text-sm text-umber italic">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {data.topRecommended.map((f) => (
                <BarRow key={f.id} label={f.name} value={f.count} max={maxRecommended} suffix=" ครั้ง" />
              ))}
            </div>
          )}
        </section>

        {/* ---------- Top viewed ---------- */}
        <section className="bg-clay border border-clay-deep rounded-sm p-5">
          <h2 className="font-heading text-walnut text-base mb-4">
            ผ้าที่มีผู้เข้าชมมากที่สุด
          </h2>
          {data.topViewed.length === 0 ? (
            <p className="text-sm text-umber italic">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {data.topViewed.map((f) => (
                <BarRow
                  key={f.id}
                  label={f.name}
                  value={f.viewCount}
                  max={maxViewed}
                  suffix=" ครั้ง"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Satisfaction by category ---------- */}
      {data.satisfactionGroups.length > 0 && (
        <section className="bg-clay border border-clay-deep rounded-sm p-5 mt-6">
          <h2 className="font-heading text-walnut text-base mb-4">
            ความพึงพอใจเฉลี่ยรายด้าน (จาก {data.satisfactionCount} ชุดคำตอบ)
          </h2>
          <div className="space-y-3">
            {data.satisfactionGroups.map((g) => (
              <BarRow
                key={g.label}
                label={g.label}
                value={Number(g.value.toFixed(2))}
                max={5}
                suffix=" / 5"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- Stat tile ----------

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-clay border border-clay-deep rounded-sm p-4">
      <p className="text-xs text-umber">{label}</p>
      <p className="font-heading text-walnut text-2xl mt-1">{value}</p>
      {hint && <p className="text-[11px] text-umber mt-0.5">{hint}</p>}
    </div>
  );
}

// ---------- Horizontal ranked bar ----------

function BarRow({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div title={`${label}: ${value}${suffix}`}>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-sm text-walnut truncate">{label}</span>
        <span className="text-sm font-heading text-walnut shrink-0 tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-5" aria-hidden>
        <div className="h-5 bg-rust rounded-r-sm" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------- Daily trend column chart ----------

function TrendChart({ data, max }: { data: { date: string; count: number }[]; max: number }) {
  const peakIndex = data.reduce(
    (best, d, i) => (d.count > data[best].count ? i : best),
    0
  );

  return (
    <div className="flex items-end gap-1 h-32 border-b border-clay-deep">
      {data.map((d, i) => {
        const heightPct = max > 0 ? Math.max(2, Math.round((d.count / max) * 100)) : 2;
        const [, m, day] = d.date.split("-");
        return (
          <div
            key={d.date}
            title={`${day}/${m}: ${d.count} ครั้ง`}
            className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
          >
            {i === peakIndex && d.count > 0 && (
              <span className="text-[10px] font-heading text-walnut tabular-nums">
                {d.count}
              </span>
            )}
            <div
              className="w-full max-w-6 bg-rust rounded-t-sm"
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[9px] text-umber">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
