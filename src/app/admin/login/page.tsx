import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm bg-cream border border-cream-deep rounded-sm p-6 sm:p-8">
        <p className="font-heading text-gold-text text-sm tracking-wide">
          ผ้าทอบุรีรัมย์
        </p>
        <h1 className="font-heading text-indigo text-2xl mt-2 mb-6">
          เข้าสู่ระบบจัดการ
        </h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
