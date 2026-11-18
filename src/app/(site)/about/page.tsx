import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-clay-deep bg-clay-deep/40">
        <div className="mx-auto max-w-3xl px-6 py-14 sm:py-16">
          <p className="font-heading text-ochre-text text-sm tracking-wide">
            เกี่ยวกับระบบ
          </p>
          <h1 className="font-heading text-walnut text-2xl sm:text-3xl mt-2 leading-snug">
            ระบบแนะนำผ้าทอพื้นบ้านบุรีรัมย์เฉพาะบุคคล
          </h1>
          <p className="text-sm text-umber mt-1">
            Buriram Woven Fabrics Personalized Recommender System
          </p>
        </div>
      </section>

      <section className="border-b border-clay-deep">
        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-14 space-y-8">
          <div>
            <h2 className="font-heading text-walnut text-lg sm:text-xl mb-3">
              วัตถุประสงค์ของระบบ
            </h2>
            <p className="text-sm text-umber leading-relaxed">
              เว็บไซต์นี้เป็นส่วนหนึ่งของงานวิจัยเรื่อง
              &ldquo;การพัฒนาระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ&rdquo;
              มีจุดประสงค์เพื่อรวบรวมข้อมูลผ้าทออัตลักษณ์และภูมิปัญญาจากชุมชนผู้ทอในจังหวัดบุรีรัมย์
              และพัฒนาระบบแนะนำผ้าทอเฉพาะบุคคลที่สามารถอธิบายเหตุผลของคำแนะนำได้
              พร้อมประเมินประสิทธิภาพของระบบในด้านความแม่นยำของคำแนะนำ
              ความสามารถในการอธิบายเหตุผลเชิงวัฒนธรรม และความพึงพอใจโดยรวมของผู้ใช้งาน
              เพื่อนำข้อมูลที่ได้ไปปรับปรุงและพัฒนาระบบให้มีประสิทธิภาพสูงสุด
            </p>
          </div>

          <div>
            <h2 className="font-heading text-walnut text-lg sm:text-xl mb-3">
              คณะผู้จัดทำ
            </h2>
            <dl className="text-sm text-umber space-y-1.5">
              <div className="flex gap-2">
                <dt className="shrink-0 text-walnut">ผู้วิจัย:</dt>
                <dd>[ชื่อผู้วิจัย]</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-walnut">อาจารย์ที่ปรึกษา:</dt>
                <dd>[ชื่ออาจารย์ที่ปรึกษา]</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-walnut">สถาบัน:</dt>
                <dd>[ชื่อมหาวิทยาลัย/หน่วยงาน]</dd>
              </div>
            </dl>
          </div>

          <div className="pt-2">
            <Link
              href="/questionnaire"
              className="inline-flex items-center justify-center bg-rust text-clay font-medium px-6 py-3 rounded-sm shadow-sm hover:bg-[#5C230F] transition"
            >
              เริ่มทำแบบสอบถาม
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
