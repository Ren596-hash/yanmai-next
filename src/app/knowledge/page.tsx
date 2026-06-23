"use client";

import { useState, useMemo } from "react";
import papers from "@/data/papers.json";
import { motion } from "framer-motion";
import { BookOpen, Lightbulb, Search, Tag, GitBranch } from "lucide-react";

interface Paper {
  id: number; title: string; authors: string; direction: string;
  innovation_points: {title:string;content:string}[];
  student: string; tags: string[]; abstract: string;
}

const allPapers = papers as Paper[];

export default function KnowledgePage() {
  const [search, setSearch] = useState("");
  const [selectedDir, setSelectedDir] = useState<string>("全部");

  const directions = useMemo(() => {
    const set = new Set(allPapers.map(p => p.direction));
    return ["全部", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return allPapers.filter(p => {
      const matchDir = selectedDir === "全部" || p.direction === selectedDir;
      const matchSearch = !search || p.title.includes(search) || p.tags.some(t => t.includes(search)) || p.student.includes(search);
      return matchDir && matchSearch;
    });
  }, [selectedDir, search]);

  // All tags and innovation stats
  const allTags = useMemo(() => {
    const map: Record<string,number> = {};
    allPapers.forEach(p => p.tags.forEach(t => { map[t] = (map[t]||0)+1; }));
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,15);
  }, []);

  const totalInnovations = allPapers.reduce((s,p) => s + (p.innovation_points||[]).length, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <h2 className="text-2xl font-bold text-primary mb-1">知识库</h2>
        <p className="text-sm text-muted-foreground mb-6">历届论文 · 创新点 · 关键词 — 课题组的学术资产沉淀</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {icon:BookOpen, label:"收录论文", value:`${allPapers.length}篇`},
          {icon:Lightbulb, label:"创新点", value:`${totalInnovations}个`},
          {icon:GitBranch, label:"研究方向", value:`${directions.length-1}个`},
          {icon:Tag, label:"关键词", value:`${allTags.length}个`},
        ].map((s,i) => { const I=s.icon; return (
          <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
            <I className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-primary">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        );})}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索论文标题、标签、作者..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {directions.map(d => (
          <button key={d} onClick={() => setSelectedDir(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedDir === d ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-blue-50"
            }`}
          >{d}</button>
        ))}
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {allTags.map(([tag, count]) => (
          <button key={tag} onClick={() => setSearch(tag)}
            className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] hover:bg-blue-100 transition-colors"
          >{tag} ({count})</button>
        ))}
      </div>

      {/* Paper cards */}
      <div className="space-y-3">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
            transition={{delay:i*0.03}}
            className="bg-card rounded-xl border border-border p-4 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{p.id}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{p.direction}</span>
                  <span className="text-xs text-muted-foreground">{p.student}</span>
                </div>
                <h4 className="font-medium text-primary text-sm mb-1">{p.title}</h4>
                <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{p.abstract}</p>
                {(p.innovation_points || []).map((ip,j) => (
                  <span key={j} className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full mr-1.5 mb-1">
                    <Lightbulb className="w-2.5 h-2.5" />{ip.title}
                  </span>
                ))}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {p.tags.slice(0,4).map(t => (
                    <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-12">没有匹配的论文，试试其他关键词</p>
      )}
    </div>
  );
}
