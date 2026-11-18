import { SatisfactionForm } from "./SatisfactionForm";

export default function SatisfactionPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
        <p className="font-heading text-ochre-text text-sm tracking-wide">
          แบบสอบถามความพึงพอใจในการใช้งานระบบ
        </p>
        <h1 className="font-heading text-walnut text-lg sm:text-xl mt-2 leading-snug">
          การพัฒนาระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ
        </h1>
        <p className="text-xs sm:text-sm text-umber mt-3 leading-relaxed">
          แบบสอบถามฉบับนี้เป็นส่วนหนึ่งของงานวิจัย มีจุดประสงค์เพื่อประเมินประสิทธิภาพของระบบใน
          ด้านความแม่นยำของคำแนะนำ ความสามารถในการอธิบายเหตุผลเชิงวัฒนธรรม
          และความพึงพอใจโดยรวมของผู้ใช้งาน เพื่อนำข้อมูลที่ได้ไปปรับปรุงและพัฒนาระบบให้มีประสิทธิภาพสูงสุด
        </p>

        <SatisfactionForm />
      </div>
    </main>
  );
}
