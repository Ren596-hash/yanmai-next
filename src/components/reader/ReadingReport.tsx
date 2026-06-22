"use client";

import { useState, useEffect, useRef } from "react";
import { getReadingLog, type ReadingEntry } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

interface ReadingStats {
  totalSeconds: number;
  totalEntries: number;
  papersRead: Set<number>;
  topPaper: { id: number; seconds: number } | null;
  hourlyActivity: number[];
  sectionDwell: Record<string, number>;
}

function computeStats(entries: ReadingEntry[]): ReadingStats {
  const paperSeconds: Record<number, number> = {};
  const hourlyActivity = new Array(24).fill(0);
  const sectionDwell: Record<string, number> = {};
  let totalSeconds = 0;
  const papersRead = new Set<number>();

  for (const e of entries) {
    if (e.action === "session_end" && e.dwell_seconds) {
      totalSeconds += e.dwell_seconds;
    }
    if (e.dwell_seconds) {
      paperSeconds[e.paper_id] = (paperSeconds[e.paper_id] || 0) + e.dwell_seconds;
      const key = e.section_id || "other";
      sectionDwell[key] = (sectionDwell[key] || 0) + e.dwell_seconds;
    }
    papersRead.add(e.paper_id);

    const hour = new Date(e.timestamp).getHours();
    hourlyActivity[hour] += e.dwell_seconds || 0;
  }

  let topPaper: { id: number; seconds: number } | null = null;
  for (const [pid, secs] of Object.entries(paperSeconds)) {
    if (!topPaper || secs > topPaper.seconds) {
      topPaper = { id: parseInt(pid), seconds: secs };
    }
  }

  return { totalSeconds, totalEntries: entries.length, papersRead, topPaper, hourlyActivity, sectionDwell };
}

interface ReadingReportProps {
  currentPaperId: number;
  sessionSeconds: number;
  annotationCount: number;
}

export default function ReadingReport({ currentPaperId, sessionSeconds, annotationCount }: ReadingReportProps) {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getReadingLog().then((entries) => {
      setStats(computeStats(entries));
    }).catch(() => {});
  }, []);

  // Idle warning after 5 min
  useEffect(() => {
    idleRef.current = setTimeout(() => {
      setIdleWarning(true);
    }, 5 * 60 * 1000);
    return () => { if (idleRef.current) clearTimeout(idleRef.current); };
  }, [sessionSeconds, currentPaperId]);

  if (!stats) return null;

  const hours = Math.floor(sessionSeconds / 3600);
  const minutes = Math.floor((sessionSeconds % 3600) / 60);
  const totalHours = Math.floor(stats.totalSeconds / 3600);
  const totalMins = Math.floor((stats.totalSeconds % 3600) / 60);
  const maxHourly = Math.max(1, ...stats.hourlyActivity);

  const peakHour = stats.hourlyActivity.indexOf(Math.max(...stats.hourlyActivity));

  // Section dwell proportional bars
  const sectionEntries = Object.entries(stats.sectionDwell).filter(([k]) => k !== "session" && k !== "other");
  sectionEntries.sort((a, b) => b[1] - a[1]);
  const maxSectionDwell = Math.max(1, ...sectionEntries.map(([, s]) => s));

  return (
    <>
      {/* Compact stats bar */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowReport(!showReport)}
        className="w-full text-left p-3 rounded-xl border border-border/60 bg-card hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-primary">Reading Report</span>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {showReport ? "Hide" : "Expand"} →
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Session: {hours > 0 ? `${hours}h ` : ""}{minutes}m
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Annotations: {annotationCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Total: {totalHours}h {totalMins}m
          </span>
        </div>
      </motion.button>

      {/* Expanded report */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-border/60 bg-card mt-2 space-y-4">
              {/* Session detail */}
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Session</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-primary block">{hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`}</span>
                    <span className="text-[10px] text-muted-foreground">Duration</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-primary block">{stats.papersRead.size}</span>
                    <span className="text-[10px] text-muted-foreground">Papers</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <span className="text-lg font-bold text-primary block">{annotationCount}</span>
                    <span className="text-[10px] text-muted-foreground">Notes</span>
                  </div>
                </div>
              </div>

              {/* Hourly heat bar */}
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Reading Hours · Peak at {peakHour}:00
                </h4>
                <div className="flex items-end gap-0.5 h-12">
                  {stats.hourlyActivity.map((val, hour) => (
                    <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full rounded-t-sm bg-blue-400/60 transition-all"
                        style={{ height: `${Math.max(4, (val / maxHourly) * 100)}%` }}
                        title={`${hour}:00 — ${Math.round(val / 60)}min`}
                      />
                      {hour % 6 === 0 && (
                        <span className="text-[8px] text-muted-foreground mt-0.5">{hour}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section dwell */}
              {sectionEntries.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Section Dwell Time</h4>
                  <div className="space-y-1">
                    {sectionEntries.slice(0, 5).map(([section, dwell]) => (
                      <div key={section} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16 truncate">{section}</span>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400/60 rounded-full"
                            style={{ width: `${Math.max(5, (dwell / maxSectionDwell) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-10 text-right">{Math.round(dwell / 60)}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top paper */}
              {stats.topPaper && (
                <div className="flex items-center gap-2 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-muted-foreground">Most read:</span>
                  <span className="font-medium text-primary">Paper #{stats.topPaper.id}</span>
                  <span className="text-muted-foreground">({Math.round(stats.topPaper.seconds / 60)}min total)</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle warning toast */}
      <AnimatePresence>
        {idleWarning && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 right-6 z-50 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-lg max-w-xs"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800">Still reading?</p>
                <p className="text-[10px] text-amber-600 mt-0.5">You&apos;ve been on this page for over 5 minutes without interaction. Consider adding an annotation.</p>
                <button
                  onClick={() => setIdleWarning(false)}
                  className="text-[10px] font-medium text-amber-700 hover:text-amber-900 mt-1.5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
