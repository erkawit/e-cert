import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "โปรแกรมจัดทำหนังสือรับรองการอบรม e-Certificate",
  description: "ระบบจัดทำและพิมพ์หนังสือรับรองการอบรมออนไลน์ (e-Certificate)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
