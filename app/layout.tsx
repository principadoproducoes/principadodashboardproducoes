import "./globals.css";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Manrope } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata = {
  title: "Principado Dashboard",
  description: "Central de produção de eventos da Principado Produções",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} ${manrope.variable}`}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}