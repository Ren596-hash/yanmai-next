"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import paths from "@/data/research_paths.json";
import papers from "@/data/papers.json";
import { motion } from "framer-motion";
import { Map, BookOpen, CheckCircle2, Users, Clock, ChevronRight, ArrowRight } from "lucide-react";

interface PathData {
  id: number; direction: string; description: string;
  papers: {paper_id:number; order:number; note:string; source:string}[];
  verified_by: string; estimated_weeks: number;
}

const allPaths = paths as PathData[];
const papersMap: Record<number, any> = {};
(papers as any[]).forEach(p => { papersMap[p.id] = p; });

export default function PathPage() {
  const [selectedPathId, setSelectedPathId] = useState<number>(allPaths[0]?.id || 1);
  const currentPath = allPaths.find(p => p.id === selectedPathId) || allPaths[0];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <h2 className="text-2xl font-bold text-primary mb-1">智能路径推荐</h2>
        <p className="text-sm text-muted-foreground mb-8">选择研究方向 → 系统生成推荐阅读路径 → 每篇附带前人笔记与验证信息</p>
      </motion.div>

      {/* Direction selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {allPaths.map(path => (
          <button
            key={path.id}
            onClick={() => setSelectedPathId(path.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedPathId === path.id
                ? "border-blue-400 bg-blue-50 ring-2 ring-offset-2 ring-blue-400"
                : "border-border hover:border-blue-200"
            }`}
          >
            <h3 className="font-semibold text-primary text-sm mb-1">{path.direction}</h3>
            <p className="text-[11px] text-muted-foreground mb-2">{path.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />预计{path.estimated_weeks}周
              <Users className="w-3 h-3 ml-1" />已验证
            </div>
          </button>
        ))}
      </div>

      {/* Path visualization */}
      {currentPath && (
        <motion.div
          key={currentPath.id}
          initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{duration:0.35}}
        >
          {/* Verify badge */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700">此路径由 <strong>{currentPath.verified_by}</strong> 验证</span>
            <span className="text-emerald-600 ml-auto text-xs">预计{currentPath.estimated_weeks}周</span>
          </div>

          {/* Path cards with arrows */}
          <div className="space-y-4">
            {currentPath.papers.map((item, i) => {
              const paper = papersMap[item.paper_id];
              if (!paper) return null;
              return (
                <motion.div
                  key={item.paper_id}
                  initial={{opacity:0, x:-12}} animate={{opacity:1, x:0}}
                  transition={{delay:i*0.08}}
                  className="flex gap-4"
                >
                  {/* Order indicator */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      item.order === 1 ? "bg-blue-600" :
                      item.order <= 3 ? "bg-blue-500" : "bg-amber-500"
                    }`}>
                      {item.order}
                    </div>
                    {i < currentPath.papers.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-blue-300 my-1 rotate-90" />
                    )}
                  </div>

                  {/* Paper card */}
                  <div className="flex-1 bg-card rounded-xl border border-border p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-2">
                          {item.order <= 3 ? "必读" : "推荐"}
                        </span>
                        <span className="text-xs text-muted-foreground">论文 #{item.paper_id}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                        {item.source}
                      </span>
                    </div>
                    <h4 className="font-medium text-primary text-sm mt-1.5 mb-1">{paper.title}</h4>
                    <p className="text-[11px] text-muted-foreground mb-2">{paper.authors}</p>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2">
                      <p className="text-[11px] text-amber-800">
                        <BookOpen className="w-3 h-3 inline mr-1 text-amber-500" />
                        💡 {item.note}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(paper.innovation_points || []).map((ip:any, j:number) => (
                        <span key={j} className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">
                          ✦ {ip.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Bottom link to knowledge base */}
      <div className="mt-8 text-center">
        <Link href="/knowledge" className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
          浏览知识库查看全部论文 <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
