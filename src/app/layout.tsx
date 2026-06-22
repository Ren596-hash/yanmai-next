import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { RoleProvider } from "@/components/layout/RoleSwitcher";
import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SeedInitializer from "@/components/layout/SeedInitializer";
import { UserCustomizationsProvider } from "@/components/settings/UserCustomizationsProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "研脉 · 课题组知识传承平台",
  description:
    "AI驱动的失败教训库与经验胶囊 — 研究生毕业后，经验不流失",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider>
          <TooltipProvider>
            <SeedInitializer>
              <RoleProvider>
                <UserCustomizationsProvider>
                  <AppShell>{children}</AppShell>
                </UserCustomizationsProvider>
              </RoleProvider>
            </SeedInitializer>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
