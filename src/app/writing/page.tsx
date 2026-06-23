"use client";

import { useState } from "react";
import templates from "@/data/writing_templates.json";
import papers from "@/data/papers.json";
import { motion } from "framer-motion";
import { PenTool, Lightbulb, FileText, BookOpen, ArrowRight, Quote } from "lucide-react";

interface Template {
  id: number; direction: string;
  sections: {name:string; tips:string; example_from_paper_id:number}[];
  innovation_examples: {paper_id:number; innovation:string; how_to_write:string}[];
}

const allTemplates = templates as Template[];
const papersMap: Record<number, any> = {};
(papers as any[]).forEach((p:any) => { papersMap[p.id] = p; });

export default function WritingPage() {
  const [selectedTplId, setSelectedTplId] = useState<number>(allTemplates[0]?.id || 1);
  const tpl = allTemplates.find(t => t.id === selectedTplId) || allTemplates[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <h2 className="text-2xl font-bold text-primary mb-1">写作助手</h2>
        <p className="text-sm text-muted-foreground mb-8">往届论文结构拆解 + 创新点表述参考 —— 第一次写论文，有据可依</p>
      </motion.div>

      {/* Direction selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {allTemplates.map(tp => (
          <button
            key={tp.id}
            onClick={() => setSelectedTplId(tp.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTplId === tp.id
                ? "bg-blue-600 text-white"
                : "bg-card border border-border text-muted-foreground hover:border-blue-200"
            }`}
          >
            {tp.direction}
          </button>
        ))}
      </div>

      {tpl && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Structure Template */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />论文结构模板
            </h3>
            <div className="space-y-3">
              {tpl.sections.map((sec, i) => {
                const examplePaper = papersMap[sec.example_from_paper_id];
                return (
                  <motion.div
                    key={i}
                    initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
                    transition={{delay:i*0.05}}
                    className="bg-card rounded-xl border border-border p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {i+1}
                      </div>
                      <h4 className="font-medium text-primary">{sec.name}</h4>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      <p className="text-xs text-blue-800">{sec.tips}</p>
                    </div>
                    {examplePaper && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <BookOpen className="w-3 h-3" />
                        参考示例：论文 #{sec.example_from_paper_id}「{examplePaper.title?.substring(0, 30)}...」
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right: Innovation Point Reference */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />创新点表述参考
            </h3>
            <div className="space-y-3">
              {tpl.innovation_examples.map((ex, i) => {
                const paper = papersMap[ex.paper_id];
                return (
                  <motion.div
                    key={i}
                    initial={{opacity:0, y:8}} animate={{opacity:1, y:0}}
                    transition={{delay:0.2 + i*0.08}}
                    className="bg-card rounded-xl border border-amber-200 bg-amber-50/30 p-4"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Quote className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-800">创新点：{ex.innovation}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{ex.how_to_write}</p>
                    {paper && (
                      <p className="text-[10px] text-muted-foreground">
                        来源：论文 #{ex.paper_id}「{paper.title?.substring(0, 25)}...」
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Quick tip card */}
            <div className="mt-4 bg-blue-600 text-white rounded-xl p-4">
              <h4 className="text-sm font-semibold mb-2">✍️ 写作技巧</h4>
              <ul className="text-xs space-y-1.5 opacity-90">
                <li>• 先写方法+实验，最后写引言</li>
                <li>• 摘要每句话对应正文一个部分</li>
                <li>• 创新点用"首次/首创/纠正了/填补了"开头</li>
                <li>• 局限性的诚实比完美更有说服力</li>
                <li>• 完成初稿后放 3 天再修改</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
