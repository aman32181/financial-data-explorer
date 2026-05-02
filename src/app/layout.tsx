import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { CompanyProvider } from "@/context/CompanyContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Data Explorer",
  description: "Browse public company financial data from SEC EDGAR filings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased bg-zinc-950">
        <CompanyProvider>{children}</CompanyProvider>
      </body>
    </html>
  );
}
