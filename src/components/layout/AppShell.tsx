"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";

interface AppShellContextType {
  aiPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  aiPanelContent: ReactNode;
  setAIPanelContent: (content: ReactNode) => void;
}

const AppShellContext = createContext<AppShellContextType>({
  aiPanelOpen: false,
  setAIPanelOpen: () => {},
  aiPanelContent: null,
  setAIPanelContent: () => {},
});

export function useAppShell() {
  return useContext(AppShellContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [aiPanelContent, setAIPanelContent] = useState<ReactNode>(null);

  return (
    <AppShellContext.Provider
      value={{ aiPanelOpen, setAIPanelOpen, aiPanelContent, setAIPanelContent }}
    >
      <div className="h-screen flex flex-col overflow-hidden">
        <TopBar />

        <div className="flex-1 flex pt-12 overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main workspace */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* AI Panel — slides in from right */}
          <AnimatePresence>
            {aiPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="shrink-0 border-l border-border/60 bg-card overflow-hidden"
              >
                <div className="w-80">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                    <h3 className="text-sm font-semibold text-primary">AI Lens</h3>
                    <button
                      onClick={() => setAIPanelOpen(false)}
                      className="text-muted-foreground hover:text-primary transition-colors text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 7rem)" }}>
                    {aiPanelContent || (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Select text or open a lens to see AI insights here.
                      </p>
                    )}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
