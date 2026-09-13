// scripts/sync-article-covers.ts
// อัปเดต Article.coverUrl ให้ตรงกับรูป primary ล่าสุดของ relatedFabric
// ต้องรันหลัง scripts/replace-identity-images.ts เพราะ Article.coverUrl เป็น snapshot
// ที่ถูก copy มาตอนสร้างบทความ (scripts/seed-stories.ts) ไม่ได้ join สดกับ FabricImage
//
// รันด้วย: npx tsx --env-file=.env scripts/sync-article-covers.ts

import { prisma } from "../src/lib/prisma";

async function main() {
  const articles = await prisma.article.findMany({
    where: { relatedFabricId: { not: null } },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      relatedFabric: {
        select: { images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
      },
    },
  });

  let updated = 0;
  for (const article of articles) {
    const newUrl = article.relatedFabric?.images[0]?.url ?? null;
    if (!newUrl || newUrl === article.coverUrl) continue;
    await prisma.article.update({ where: { id: article.id }, data: { coverUrl: newUrl } });
    updated++;
    console.log(`✓ ${article.title}`);
  }
  console.log(`\nอัปเดต coverUrl ทั้งหมด ${updated} บทความ (จากทั้งหมด ${articles.length} ที่ผูกกับ fabric)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
