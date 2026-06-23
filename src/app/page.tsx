"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GitBranch, Map, AlertTriangle, PenTool, BookOpen, Users, Sparkles, ArrowRight } from "lucide-react";
import papers from "@/data/papers.json";

const DIRECTIONS = [...new Set((papers as any[]).map((p: any) => p.direction).filter(Boolean))];

const STAGES = [
  {
    href: "/directions",
    icon: GitBranch,
    color: "blue",
    title: "选方向",
    subtitle: "研究方向图谱",
    desc: "浏览课题组历年研究方向、论文分布与创新点脉络。找到你的研究起点。",
    tag: "第①步",
  },
  {
    href: "/path",
    icon: Map,
    color: "emerald",
    title: "找文献",
    subtitle: "智能路径推荐",
    desc: "选择方向后，系统自动生成推荐阅读路径。每篇论文附带前人的阅读笔记与核心要点。",
    tag: "第②步",
  },
  {
    href: "/advisor",
    icon: AlertTriangle,
    color: "amber",
    title: "做实验",
    subtitle: "避坑顾问",
    desc: "输入实验方案，系统匹配历史成功与失败案例。前人踩过的坑，你不需要再踩一遍。",
    tag: "第③步",
  },
  {
    href: "/writing",
    icon: PenTool,
    color: "violet",
    title: "写论文",
    subtitle: "写作助手",
    desc: "查看往届优秀论文的结构拆解与创新点表述。按照经过验证的模板完成你的初稿。",
    tag: "第④步",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue:   { bg: "bg-blue-600", text: "text-blue-600", border: "border-blue-200 hover:border-blue-400", light: "bg-blue-50" },
  emerald:{ bg: "bg-emerald-600", text: "text-emerald-600", border: "border-emerald-200 hover:border-emerald-400", light: "bg-emerald-50" },
  amber:  { bg: "bg-amber-600", text: "text-amber-600", border: "border-amber-200 hover:border-amber-400", light: "bg-amber-50" },
  violet: { bg: "bg-violet-600", text: "text-violet-600", border: "border-violet-200 hover:border-violet-400", light: "bg-violet-50" },
};

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-6">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-blue-500"
          />
          研脉 · 课题组科研知识管理平台
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-4">
          站在前人肩膀上
          <br />
          <span className="text-blue-600">不做学术孤儿</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          每一届学生的论文、创新点和失败教训，自动沉淀为下一届的起点。
          选方向 → 找文献 → 做实验 → 写论文，全流程有据可依。
        </p>
      </motion.section>

      {/* Stage Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
      >
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const c = colorMap[stage.color];
          return (
            <motion.div
              key={stage.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.35 }}
            >
              <Link
                href={stage.href}
                className={`group block bg-card rounded-xl border ${c.border} p-6 hover:shadow-lg transition-all duration-200 h-full`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl ${c.light} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <span className={`text-[10px] font-medium ${c.text} ${c.light} px-2 py-0.5 rounded-full`}>
                    {stage.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-1">{stage.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{stage.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{stage.desc}</p>
                <div className={`flex items-center gap-1 text-xs font-medium ${c.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  进入 <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Stats + Directions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-gradient-to-br from-blue-50/60 to-white rounded-2xl border border-blue-100 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-primary">课题组数据总览</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { icon: BookOpen, label: "收录论文", value: `${papers.length}篇` },
            { icon: AlertTriangle, label: "失败案例", value: "8条" },
            { icon: Users, label: "覆盖学生", value: "6人" },
            { icon: GitBranch, label: "研究方向", value: `${DIRECTIONS.length}个` },
          ].map((stat, i) => {
            const SIcon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-lg p-3 border border-border/60 text-center">
                <SIcon className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-primary">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIRECTIONS.map((d: string) => (
            <Link
              key={d}
              href="/directions"
              className="px-3 py-1 bg-white border border-border/60 rounded-full text-xs text-primary hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              {d}
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
