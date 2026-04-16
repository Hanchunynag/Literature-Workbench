import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Literature Workbench",
  description: "面向 LEO SOP 研究的文献展示与阅读网站"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main className="shell page-shell">{children}</main>
      </body>
    </html>
  );
}
