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
  title: "ระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ",
  description:
    "ระบบแนะนำผ้าทอพื้นบ้านจังหวัดบุรีรัมย์เฉพาะบุคคลด้วยเทคโนโลยีอัจฉริยะ รวมข้อมูลผ้าทออัตลักษณ์และภูมิปัญญาจากชุมชนผู้ทอในจังหวัด",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-clay text-umber font-body">
        {children}
      </body>
    </html>
  );
}
