import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RoleProvider } from "@/components/layout/RoleSwitcher";
import { Navbar } from "@/components/layout/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "研脉 · 课题组智能科研传承与思维引导平台",
  description:
    "AI-native科研知识管理平台 — 把导师的指导、师兄师姐的经验、失败的教训留下来、连起来、在需要的时候推给需要的人",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f7f4]">
        <TooltipProvider>
          <RoleProvider>
            <Navbar />
            <main className="flex-1 pt-14">{children}</main>
          </RoleProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
