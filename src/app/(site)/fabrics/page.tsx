import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { FabricCard } from "@/components/fabric-card";
import { CommunityFilterDropdown } from "./CommunityFilterDropdown";

export const revalidate = 300;

async function getData(communityId: string | undefined) {
  const [fabrics, communities] = await Promise.all([
    prisma.fabric.findMany({
      where: {
        isPublished: true,
        ...(communityId ? { communityId } : {}),
      },
      orderBy: [{ community: { district: "asc" } }, { name: "asc" }],
      include: {
        community: { select: { name: true, district: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    }),
    prisma.community.findMany({
      orderBy: { district: "asc" },
      select: { id: true, name: true, district: true },
    }),
  ]);
  return { fabrics, communities };
}

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: Promise<{ community?: string }>;
}) {
  const { community: communityId } = await searchParams;
  const { fabrics, communities } = await getData(communityId);
  const activeCommunity = communities.find((c) => c.id === communityId);

  return (
    <main className="flex-1 bg-clay">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <header>
          <p className="font-heading text-ochre-text text-sm tracking-wide">
            ผ้าทอบุรีรัมย์ทั้งหมด
          </p>
          <h1 className="font-heading text-walnut text-2xl sm:text-3xl mt-2 leading-snug">
            ลายผ้าอัตลักษณ์ 23 อำเภอ
          </h1>
          <p className="text-sm text-umber mt-3 leading-relaxed max-w-2xl">
            รวมผ้าทอพื้นบ้านที่มีในระบบทั้งหมด ไล่ดูเองได้ตามชุมชนผู้ทอ
            หรือให้ระบบช่วยแนะนำเฉพาะสำหรับคุณผ่านแบบสอบถาม
          </p>
        </header>

        {/* ---------- ตัวกรองชุมชน ---------- */}
        <div className="mt-8 flex flex-wrap items-end gap-4 bg-clay-deep/40 border border-clay-deep rounded-sm px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-umber tracking-wide">
              กรองตามชุมชน/อำเภอ
            </span>
            <Suspense
              fallback={
                <div className="bg-clay border-2 border-clay-deep rounded-sm min-w-64 h-10.5" />
              }
            >
              <CommunityFilterDropdown communities={communities} />
            </Suspense>
          </div>
        </div>

        <p className="text-sm text-umber mt-5">
          {activeCommunity
            ? `พบผ้าทอจาก${activeCommunity.name} ${fabrics.length} ผืน`
            : `พบผ้าทอทั้งหมด ${fabrics.length} ผืน`}
        </p>

        {fabrics.length === 0 ? (
          <p className="text-umber italic mt-6">ไม่พบผ้าทอในชุมชนนี้</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fabrics.map((f) => (
              <FabricCard key={f.id} fabric={f} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
