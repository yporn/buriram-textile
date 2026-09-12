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
          <h1 className="font-heading text-walnut text-2xl">จัดการชุมชน</h1>
          <p className="text-sm text-umber mt-1">ทั้งหมด {communities.length} กลุ่ม</p>
        </div>
        <Link
          href="/admin/communities/new"
          className="bg-rust text-clay font-medium px-5 py-2.5 rounded-sm hover:bg-[#5C230F] transition"
        >
          + เพิ่มชุมชนใหม่
        </Link>
      </div>

      {communities.length === 0 ? (
        <p className="text-umber italic">ยังไม่มีชุมชนในระบบ</p>
      ) : (
        <div className="bg-clay border border-clay-deep rounded-sm divide-y divide-clay-deep">
          {communities.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-walnut font-medium">{c.name}</p>
                <p className="text-xs text-umber mt-0.5">
                  {c.district} · ผ้า {c._count.fabrics} ผืน
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/communities/${c.id}/edit`}
                  className="text-rust hover:underline text-sm"
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
