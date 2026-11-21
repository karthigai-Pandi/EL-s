import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "EL's Studio | Print with purpose",
  description: "Thoughtful print, display and spatial branding. Configure your print order and pay securely online.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}