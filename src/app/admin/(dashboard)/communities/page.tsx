import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteCommunityButton } from "./DeleteCommunityButton";

export const dynamic = "force-dynamic";

async function getCommunities() {
  return prisma.community.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { fabrics: true } } },
  });
}

export default async function AdminCommunitiesPage() {
  const communities = await getCommunities();

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-indigo text-2xl">จัดการชุมชน</h1>
          <p className="text-sm text-earth mt-1">ทั้งหมด {communities.length} กลุ่ม</p>
        </div>
        <Link
          href="/admin/communities/new"
          className="bg-brick text-cream font-medium px-5 py-2.5 rounded-sm hover:bg-[#7a2424] transition"
        >
          + เพิ่มชุมชนใหม่
        </Link>
      </div>

      {communities.length === 0 ? (
        <p className="text-earth italic">ยังไม่มีชุมชนในระบบ</p>
      ) : (
        <div className="bg-cream border border-cream-deep rounded-sm divide-y divide-cream-deep">
          {communities.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-indigo font-medium">{c.name}</p>
                <p className="text-xs text-earth mt-0.5">
                  {c.district} · ผ้า {c._count.fabrics} ผืน
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/communities/${c.id}/edit`}
                  className="text-brick hover:underline text-sm"
                >
                  แก้ไข
                </Link>
                <DeleteCommunityButton communityId={c.id} name={c.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
