import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FabricRowActions } from "./FabricRowActions";

export const dynamic = "force-dynamic";

async function getData() {
  const [fabrics, communityCount] = await Promise.all([
    prisma.fabric.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        community: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    }),
    prisma.community.count(),
  ]);
  return { fabrics, communityCount };
}

export default async function AdminFabricsPage() {
  const { fabrics, communityCount } = await getData();
  const publishedCount = fabrics.filter((f) => f.isPublished).length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-indigo text-2xl">จัดการผ้าทอ</h1>
          <p className="text-sm text-earth mt-1">
            ผ้าทั้งหมด {fabrics.length} ผืน · เผยแพร่อยู่ {publishedCount} ผืน ·
            ชุมชน {communityCount} กลุ่ม
          </p>
        </div>
        <Link
          href="/admin/fabrics/new"
          className="bg-brick text-cream font-medium px-5 py-2.5 rounded-sm hover:bg-[#7a2424] transition"
        >
          + เพิ่มผ้าใหม่
        </Link>
      </div>

      {fabrics.length === 0 ? (
        <p className="text-earth italic">ยังไม่มีผ้าในระบบ เริ่มเพิ่มผ้าแรกได้เลย</p>
      ) : (
        <div className="bg-cream border border-cream-deep rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-deep text-left text-earth">
                <th className="p-3 font-medium">รูป</th>
                <th className="p-3 font-medium">ชื่อผ้า</th>
                <th className="p-3 font-medium">ชุมชน</th>
                <th className="p-3 font-medium">ราคา</th>
                <th className="p-3 font-medium">สถานะ</th>
                <th className="p-3 font-medium">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map((f) => (
                <tr key={f.id} className="border-b border-cream-deep last:border-0">
                  <td className="p-3">
                    <div className="h-12 w-12 bg-cream-deep rounded-sm overflow-hidden">
                      {f.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 text-indigo font-medium">{f.name}</td>
                  <td className="p-3 text-earth">{f.community?.name ?? "—"}</td>
                  <td className="p-3 text-earth">฿{f.priceThb.toLocaleString()}</td>
                  <td className="p-3">
                    <FabricRowActions
                      fabricId={f.id}
                      isPublished={f.isPublished}
                    />
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/fabrics/${f.id}/edit`}
                      className="text-brick hover:underline"
                    >
                      แก้ไข
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
