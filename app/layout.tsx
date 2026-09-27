import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Principado Dashboard",
  description: "Central de produção de eventos da Principado Produções",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
