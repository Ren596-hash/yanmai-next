"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleSwitcher, useRole } from "./RoleSwitcher";
import { cn } from "@/lib/utils";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from "@/lib/notifications";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/reader", label: "论文研读", icon: "📖" },
  { href: "/advisor", label: "避坑顾问", icon: "⚠️" },
  { href: "/search", label: "搜索问答", icon: "💬" },
  { href: "/capsule", label: "知识胶囊", icon: "💊" },
  { href: "/dashboard", label: "导师驾驶舱", icon: "📊" },
  { href: "/growth", label: "思维成长", icon: "🧠" },
  { href: "/onboarding", label: "新生入组", icon: "🚀" },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setNotifs(getNotifications());
    setUnread(getUnreadCount());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    refresh();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    refresh();
  };

  const typeIcon: Record<string, string> = {
    annotation_new: "💬",
    annotation_reply: "↩️",
    mentor_annotation: "🎓",
    failure_match: "⚠️",
    capsule_ready: "💊",
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-border overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-[#1a3a5c]">
              通知 ({unread}条未读)
            </span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#c9a96e] hover:text-[#1a3a5c] transition-colors"
              >
                全部已读
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                暂无通知
              </p>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                    !n.isRead && "bg-[#c9a96e]/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{typeIcon[n.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#1a3a5c]">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#c9a96e] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {n.body}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        {new Date(n.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { currentRole } = useRole();

  const filteredItems =
    currentRole.role === "新生"
      ? NAV_ITEMS.filter((item) => item.href !== "/dashboard")
      : NAV_ITEMS;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a3a5c] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-wide text-[#c9a96e]">
            研脉
          </span>
          <span className="hidden lg:inline text-xs text-white/70 font-medium">
            YanMai KMS
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {filteredItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-[#c9a96e]/20 text-[#c9a96e]"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}
