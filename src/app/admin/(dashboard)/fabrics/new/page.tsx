import { prisma } from "@/lib/prisma";
import { FabricForm } from "../FabricForm";

async function getFormData() {
  const [categories, communities] = await Promise.all([
    prisma.tagCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { tags: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.community.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    categories: categories.map((c) => ({
      code: c.code,
      nameTh: c.nameTh,
      tags: c.tags.map((t) => ({ id: t.id, nameTh: t.nameTh })),
    })),
    communities: communities.map((c) => ({ id: c.id, name: c.name, district: c.district })),
  };
}

export default async function NewFabricPage() {
  const { categories, communities } = await getFormData();

  return (
    <div>
      <h1 className="font-heading text-indigo text-2xl mb-6">เพิ่มผ้าใหม่</h1>
      <FabricForm mode="create" categories={categories} communities={communities} />
    </div>
  );
}
