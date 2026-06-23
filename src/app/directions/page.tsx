"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import papers from "@/data/papers.json";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, BookOpen, Lightbulb, TrendingUp, ChevronRight, X, Users, Calendar } from "lucide-react";

interface Paper {
  id: number; title: string; authors: string; direction: string;
  innovation_points: {title:string;content:string}[];
  student: string; tags: string[];
}

const allPapers = papers as Paper[];

// Group by direction
function groupByDirection() {
  const map: Record<string, Paper[]> = {};
  allPapers.forEach(p => {
    const d = p.direction || "未分类";
    if (!map[d]) map[d] = [];
    map[d].push(p);
  });
  return map;
}

// Color palette for direction cards
const DIR_COLORS: Record<string,string> = {
  "分布式系统与微服务": "border-blue-400 bg-blue-50",
  "前端架构与性能优化": "border-emerald-400 bg-emerald-50",
  "AI/ML系统工程": "border-violet-400 bg-violet-50",
};

const ICON_COLORS: Record<string,string> = {
  "分布式系统与微服务": "text-blue-600",
  "前端架构与性能优化": "text-emerald-600",
  "AI/ML系统工程": "text-violet-600",
};

export default function DirectionsPage() {
  const groups = useMemo(() => groupByDirection(), []);
  const directionNames = Object.keys(groups);
  const [selectedDir, setSelectedDir] = useState<string | null>(null);

  const selectedPapers = selectedDir ? groups[selectedDir] || [] : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <h2 className="text-2xl font-bold text-primary mb-1">研究方向图谱</h2>
        <p className="text-sm text-muted-foreground mb-8">点击研究方向，查看论文分布与创新点演进脉络</p>
      </motion.div>

      {/* Direction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {directionNames.map((dir, i) => {
          const papers = groups[dir];
          const allInnovations = papers.flatMap(p => p.innovation_points || []);
          const borderClass = DIR_COLORS[dir] || "border-gray-300 bg-gray-50";
          const iconClass = ICON_COLORS[dir] || "text-gray-600";
          return (
            <motion.button
              key={dir}
              initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
              transition={{delay: i*0.08, duration:0.3}}
              onClick={() => setSelectedDir(selectedDir === dir ? null : dir)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${borderClass} ${
                selectedDir === dir ? "ring-2 ring-offset-2 ring-blue-400" : "hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className={`w-5 h-5 ${iconClass}`} />
                <h3 className="font-semibold text-primary">{dir}</h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span><BookOpen className="w-3.5 h-3.5 inline mr-1" />{papers.length}篇论文</span>
                <span><Lightbulb className="w-3.5 h-3.5 inline mr-1" />{allInnovations.length}个创新点</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {papers.slice(0,3).map(p => (
                  <span key={p.id} className="text-[10px] bg-white/70 rounded px-1.5 py-0.5 text-muted-foreground">
                    {p.title.substring(0, 25)}...
                  </span>
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Direction Detail */}
      <AnimatePresence>
        {selectedDir && selectedPapers.length > 0 && (
          <motion.div
            initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}}
            exit={{opacity:0, height:0}} transition={{duration:0.3}}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  {selectedDir} — 论文与创新点
                </h3>
                <button onClick={() => setSelectedDir(null)} className="text-muted-foreground hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Innovation Timeline */}
              <div className="space-y-3">
                {selectedPapers.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{opacity:0, x:-12}} animate={{opacity:1, x:0}}
                    transition={{delay:i*0.05}}
                    className="flex gap-4 p-4 rounded-lg border border-border/60 hover:border-blue-200 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      {i < selectedPapers.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.id}</span>
                        <h4 className="font-medium text-primary">{p.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span><Users className="w-3 h-3 inline mr-1" />{p.student}</span>
                        <span><Calendar className="w-3 h-3 inline mr-1" />{p.authors.split(",")[0]}</span>
                      </div>
                      {(p.innovation_points || []).map((ip, j) => (
                        <div key={j} className="bg-amber-50 border border-amber-100 rounded-lg p-2 mb-1.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            <span className="text-xs font-medium text-amber-800">{ip.title}</span>
                          </div>
                          <p className="text-[11px] text-amber-700">{ip.content}</p>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.tags?.slice(0,4).map(tag => (
                          <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: Browse all papers */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-sm font-semibold text-primary mb-4">全部论文一览</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allPapers.map(p => (
            <div key={p.id} className="p-3 rounded-lg border border-border/60 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.id}</span>
                <span className="text-xs text-muted-foreground">{p.direction}</span>
              </div>
              <p className="text-sm font-medium text-primary leading-snug">{p.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{p.student}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
