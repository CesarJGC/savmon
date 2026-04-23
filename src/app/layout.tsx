import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SavMon - Control de Gastos",
  description: "Gestiona y ordena tus gastos mensuales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full">
        <body className={`${inter.className} min-h-full bg-gray-50 text-gray-900`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
