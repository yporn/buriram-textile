import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../../ArticleForm";

async function getData(id: string) {
  const [article, fabrics] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.fabric.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { article, fabrics };
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { article, fabrics } = await getData(id);

  if (!article) notFound();

  return (
    <div>
      <h1 className="font-heading text-indigo text-2xl mb-6">แก้ไขบทความ: {article.title}</h1>
      <ArticleForm
        mode="edit"
        articleId={article.id}
        fabrics={fabrics}
        initial={{
          title: article.title,
          slug: article.slug,
          content: article.content,
          category: article.category,
          coverUrl: article.coverUrl,
          relatedFabricId: article.relatedFabricId,
          isPublished: article.isPublished,
        }}
      />
    </div>
  );
}
