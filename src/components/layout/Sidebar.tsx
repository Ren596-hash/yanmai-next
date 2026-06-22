"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  AlertTriangle,
  MessageSquare,
  Pill,
  BarChart3,
  Brain,
  Search,
  Rocket,
  Database,
  GitBranch,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/reader", label: "论文研读", icon: BookOpen },
  { href: "/advisor", label: "避坑顾问", icon: AlertTriangle },
  { href: "/search", label: "苏格拉底搜索", icon: MessageSquare },
  { href: "/capsule", label: "知识胶囊", icon: Pill },
  { href: "/dashboard", label: "数据看板", icon: BarChart3 },
  { href: "/growth", label: "成长档案", icon: Brain },
  { href: "/knowledge", label: "知识库", icon: Database },
  { href: "/graph", label: "知识图谱", icon: GitBranch },
  { href: "/discover", label: "发现", icon: Search },
  { href: "/onboarding", label: "入组引导", icon: Rocket },
  { href: "/settings", label: "设置", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { currentRole } = useRole();

  const filteredItems =
    currentRole.role === "新生"
      ? NAV_ITEMS.filter((item) => item.href !== "/dashboard")
      : NAV_ITEMS;

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed top-12 left-0 bottom-0 z-40 bg-card border-r border-border/60 flex flex-col overflow-hidden"
      >
        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 rounded-r-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Toggle */}
        <div className="border-t border-border/60 p-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors text-sm"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs overflow-hidden whitespace-nowrap"
                    >
                      收起
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Spacer to push content */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="shrink-0"
      />
    </>
  );
}
