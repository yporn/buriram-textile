import { prisma } from "@/lib/prisma";
import {
  QuestionnaireFlow,
  type CategoryTagsInput,
  type DecisionFactorInput,
} from "./QuestionnaireFlow";

// ทุกคำถามและตัวเลือก (tag + decision factor) ดึงจากฐานข้อมูล
// แอดมินเพิ่ม/แก้ tag แล้วแบบสอบถามจะขึ้นตัวเลือกใหม่โดยไม่ต้องแก้โค้ด
export const revalidate = 60;

const TAG_CATEGORY_ORDER = ["occasion", "color_tone", "pattern", "material"] as const;

async function getQuestionnaireData() {
  const [categories, decisionFactors] = await Promise.all([
    prisma.tagCategory.findMany({
      where: { code: { in: [...TAG_CATEGORY_ORDER] } },
      orderBy: { sortOrder: "asc" },
      include: { tags: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.decisionFactor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const categoryInputs: CategoryTagsInput[] = categories.map((c) => ({
    code: c.code,
    nameTh: c.nameTh,
    question: c.question,
    multiple: c.multiple,
    tags: c.tags.map((t) => ({
      id: t.id,
      code: t.code,
      nameTh: t.nameTh,
      description: t.description,
    })),
  }));

  const factorInputs: DecisionFactorInput[] = decisionFactors.map((f) => ({
    id: f.id,
    code: f.code,
    nameTh: f.nameTh,
  }));

  return { categories: categoryInputs, factors: factorInputs };
}

export default async function QuestionnairePage() {
  const { categories, factors } = await getQuestionnaireData();

  if (categories.length === 0 || factors.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-heading text-indigo text-2xl mb-4">
          ยังไม่มีคำถามในฐานข้อมูล
        </h1>
        <p className="text-earth">
          กรุณารัน <code className="text-brick">npx prisma db seed</code> ก่อน
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-cream">
      <QuestionnaireFlow categories={categories} factors={factors} />
    </main>
  );
}
