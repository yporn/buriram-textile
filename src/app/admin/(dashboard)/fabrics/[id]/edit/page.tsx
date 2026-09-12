import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FabricForm } from "../../FabricForm";

async function getFormData(id: string) {
  const [fabric, categories, communities] = await Promise.all([
    prisma.fabric.findUnique({
      where: { id },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        tags: { select: { tagId: true } },
      },
    }),
    prisma.tagCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { tags: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.community.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    fabric,
    categories: categories.map((c) => ({
      code: c.code,
      nameTh: c.nameTh,
      tags: c.tags.map((t) => ({ id: t.id, nameTh: t.nameTh })),
    })),
    communities: communities.map((c) => ({ id: c.id, name: c.name, district: c.district })),
  };
}

export default async function EditFabricPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { fabric, categories, communities } = await getFormData(id);

  if (!fabric) notFound();

  return (
    <div>
      <h1 className="font-heading text-walnut text-2xl mb-6">แก้ไขผ้า: {fabric.name}</h1>
      <FabricForm
        mode="edit"
        fabricId={fabric.id}
        categories={categories}
        communities={communities}
        initial={{
          name: fabric.name,
          description: fabric.description,
          story: fabric.story ?? "",
          priceThb: fabric.priceThb,
          communityId: fabric.communityId,
          isPublished: fabric.isPublished,
          imageUrl: fabric.images[0]?.url ?? null,
          tagIds: fabric.tags.map((t) => t.tagId),
        }}
      />
    </div>
  );
}
