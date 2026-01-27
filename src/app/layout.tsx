import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barber Shop Management",
  description: "Pro grade management for modern barber shops",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-white text-zinc-900 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
