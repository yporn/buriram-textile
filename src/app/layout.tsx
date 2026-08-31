import type { Metadata } from "next";
import { Noto_Serif_Thai, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const heading = Noto_Serif_Thai({
  variable: "--font-heading",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ผ้าทอบุรีรัมย์ — ระบบแนะนำผ้าเฉพาะบุคคล",
  description:
    "ค้นหาผ้าทอพื้นบ้านบุรีรัมย์ที่ตรงกับสไตล์และโอกาสของคุณ พร้อมเหตุผลอธิบายได้ทุกคำแนะนำ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-earth font-body">
        {children}
      </body>
    </html>
  );
}
