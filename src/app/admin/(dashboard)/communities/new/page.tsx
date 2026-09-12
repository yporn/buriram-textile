import { CommunityForm } from "../CommunityForm";

export default function NewCommunityPage() {
  return (
    <div>
      <h1 className="font-heading text-walnut text-2xl mb-6">เพิ่มชุมชนใหม่</h1>
      <CommunityForm mode="create" />
    </div>
  );
}
