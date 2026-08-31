import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../ArticleForm";

async function getFabrics() {
  return prisma.fabric.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export default async function NewArticlePage() {
  const fabrics = await getFabrics();

  return (
    <div>
      <h1 className="font-heading text-indigo text-2xl mb-6">เพิ่มบทความใหม่</h1>
      <ArticleForm mode="create" fabrics={fabrics} />
    </div>
  );
}
