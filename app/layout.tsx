import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { CursorFinger } from "@/components/CursorFinger";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PARMAK: Dostluk Sınavı",
  description: "Soruya en çok kim uyuyor? Gerçek zamanlı parti oyunu — lobi oluştur, oy ver, yapay zeka destekli kişilik analizi al.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className={`${nunito.variable} font-sans min-h-screen bg-surface text-white antialiased`}>
        <CursorFinger />
        {children}
      </body>
    </html>
  );
}
