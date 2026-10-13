import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Outfield",
  description: "Contatos, negociações e projetos da Outfield Strategies",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
