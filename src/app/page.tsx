"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/components/layout/RoleSwitcher";

const STATS = [
  { value: "3代", label: "学生传承" },
  { value: "10篇", label: "核心论文" },
  { value: "30条", label: "累积批注" },
  { value: "15份", label: "失败报告" },
  { value: "3个", label: "知识胶囊" },
];

const CARDS = [
  {
    href: "/reader",
    icon: "📖",
    title: "心智注释 · 论文研读",
    desc: "阅读论文时，前人批注在关键段落自动浮现",
  },
  {
    href: "/advisor",
    icon: "⚠️",
    title: "避坑顾问 · 案例匹配",
    desc: "描述实验方案，AI匹配历史失败案例，先反问再展示",
  },
  {
    href: "/search",
    icon: "💬",
    title: "搜索问答 · 先问再推",
    desc: "苏格拉底式AI导师 — 永远先反问，再展示知识",
  },
  {
    href: "/capsule",
    icon: "💊",
    title: "知识胶囊 · 一键传承",
    desc: "毕业生打包个人经验，一键传递给下一代",
  },
];

const TAGS = ["心智注释", "避坑顾问", "知识胶囊", "先问再推", "导师驾驶舱"];

function SavedLearningPath() {
  const [path, setPath] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("yanmai_learning_path");
    if (raw) {
      try { setPath(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  if (!path) return null;

  return (
    <section className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📋</span>
        <h3 className="font-semibold text-[#1a3a5c]">我的学习路径</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          保存于 {new Date(path.savedAt).toLocaleDateString("zh-CN")}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {path.weeks?.map((w: any) => (
          <div key={w.week} className="bg-white rounded-lg p-3 border border-green-100">
            <span className="text-xs font-bold text-[#c9a96e]">Week {w.week}</span>
            <p className="text-xs text-[#1a3a5c] font-medium mt-0.5">{w.description}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              推荐 {w.paperIds?.length || 0} 篇论文
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 text-right">
        <Link href="/onboarding" className="text-xs text-[#c9a96e] hover:text-[#1a3a5c] transition-colors">
          重新评估 →
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  const { currentRole } = useRole();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 英雄区域 */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1a3a5c] mb-4">
          课题组智能科研传承
          <br />
          与思维引导平台
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          把导师的指导、师兄师姐的经验、失败的教训
          <br />
          留下来、连起来、在需要的时候推给需要的人
        </p>

        {/* 标签气泡 */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {TAGS.map((tag) => (
            <span key={tag} className="tag-bubble">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 功能卡片 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white rounded-xl border border-border p-6 hover:shadow-md hover:border-[#c9a96e]/40 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{card.icon}</span>
              <div>
                <h3 className="text-xl font-semibold text-[#1a3a5c] group-hover:text-[#c9a96e] transition-colors mb-2">
                  {card.title}
                </h3>
                <p className="text-muted-foreground">{card.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* 底部统计 */}
      <section className="border-t border-border pt-8">
        <div className="grid grid-cols-5 gap-4 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[#c9a96e]">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 新生引导入口 */}
      <section className="mt-8">
        <Link
          href="/onboarding"
          className={`block rounded-xl p-6 text-center transition-all duration-200 ${
            currentRole.role === "新生"
              ? "bg-[#c9a96e]/15 border-2 border-[#c9a96e] hover:bg-[#c9a96e]/25"
              : "bg-white border border-border hover:shadow-md"
          }`}
        >
          <h3 className="text-xl font-semibold text-[#1a3a5c] mb-1">
            🚀 新生入组 · 3周入门路径规划
          </h3>
          <p className="text-muted-foreground">
            完成兴趣评估，获得个性化论文阅读路径，快速进入课题节奏
          </p>
        </Link>
      </section>
    </div>
  );
}
