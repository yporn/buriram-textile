import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommunityForm } from "../../CommunityForm";

export default async function EditCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const community = await prisma.community.findUnique({ where: { id } });

  if (!community) notFound();

  return (
    <div>
      <h1 className="font-heading text-indigo text-2xl mb-6">แก้ไขชุมชน: {community.name}</h1>
      <CommunityForm
        mode="edit"
        communityId={community.id}
        initial={{
          name: community.name,
          district: community.district,
          story: community.story ?? "",
          contact: community.contact ?? "",
        }}
      />
    </div>
  );
}
