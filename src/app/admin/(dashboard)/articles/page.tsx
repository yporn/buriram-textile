import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getArticles() {
  return prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { relatedFabric: { select: { name: true } } },
  });
}

export default async function AdminArticlesPage() {
  const articles = await getArticles();
  const publishedCount = articles.filter((a) => a.isPublished).length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-indigo text-2xl">จัดการบทความ</h1>
          <p className="text-sm text-earth mt-1">
            ทั้งหมด {articles.length} เรื่อง · เผยแพร่อยู่ {publishedCount} เรื่อง
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-brick text-cream font-medium px-5 py-2.5 rounded-sm hover:bg-[#7a2424] transition"
        >
          + เพิ่มบทความใหม่
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-earth italic">ยังไม่มีบทความในระบบ เริ่มเพิ่มบทความแรกได้เลย</p>
      ) : (
        <div className="bg-cream border border-cream-deep rounded-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-deep text-left text-earth">
                <th className="p-3 font-medium">ชื่อบทความ</th>
                <th className="p-3 font-medium">หมวดหมู่</th>
                <th className="p-3 font-medium">เชื่อมโยงผ้า</th>
                <th className="p-3 font-medium">สถานะ</th>
                <th className="p-3 font-medium">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-b border-cream-deep last:border-0">
                  <td className="p-3 text-indigo font-medium">{a.title}</td>
                  <td className="p-3 text-earth">{a.category ?? "—"}</td>
                  <td className="p-3 text-earth">{a.relatedFabric?.name ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={[
                        "text-xs font-medium px-2 py-1 rounded-sm",
                        a.isPublished
                          ? "bg-brick/10 text-brick"
                          : "bg-earth/10 text-earth",
                      ].join(" ")}
                    >
                      {a.isPublished ? "เผยแพร่อยู่" : "ฉบับร่าง"}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
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
