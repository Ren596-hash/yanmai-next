"use client";

import { useState } from "react";
import Link from "next/link";
import { useRole } from "./RoleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TopBar() {
  const { currentRole, switchRole } = useRole();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-white/95 backdrop-blur-sm border-b border-border/60">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-primary hidden sm:inline">
            CrossMind
          </span>
        </Link>

        {/* Center: Search */}
        <div className="flex-1 max-w-md flex justify-center">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form
                key="search-open"
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="relative w-full"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search papers, failures, capsules..."
                  className="w-full h-8 pl-8 pr-8 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                  autoFocus
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-closed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline text-xs">Search...</span>
                <kbd className="hidden lg:inline ml-4 text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">
                  Ctrl K
                </kbd>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <NotificationBell />
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/60">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              {currentRole.name.charAt(0)}
            </span>
            <select
              value={currentRole.role}
              onChange={(e) => switchRole(e.target.value as any)}
              className="text-xs bg-transparent text-muted-foreground border border-border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
            >
              <option value="导师">导师</option>
              <option value="博士">博士</option>
              <option value="硕士">硕士</option>
              <option value="新生">新生</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
