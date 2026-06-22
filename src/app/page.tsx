"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  Terminal,
  Package,
  Pill,
} from "lucide-react";

const STATS = [
  { value: "15份", label: "失败案例库", icon: Terminal },
  { value: "3个", label: "知识胶囊", icon: Package },
];

const CARDS = [
  {
    href: "/advisor",
    icon: AlertTriangle,
    color: "amber",
    title: "避坑顾问",
    subtitle: "输入你的技术方案，AI 匹配历史失败案例",
    desc: "想做微服务拆分？先看看前人的分布式事务雪崩。想上 SSR？先了解内存泄漏怎么排查。每条案例都标注了根因和教训，而且 AI 会先让你自己思考再揭晓答案。",
    tag: "核心功能",
  },
  {
    href: "/capsule",
    icon: Pill,
    color: "violet",
    title: "知识胶囊",
    subtitle: "毕业生一键打包经验，新生一键继承",
    desc: "张明远毕业了，他的 15 条批注、12 份实验记录、5 个踩坑教训不会消失——打包成知识胶囊，下一届新生入组时自动加载。导师还可以附上推荐论文和学习路径。",
    tag: "核心功能",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-16 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-6">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-blue-500"
          />
          研脉 · 课题组知识传承平台
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-4">
          研究生毕业后
          <br />
          <span className="text-blue-600">经验不流失</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          AI 驱动的失败教训库与经验胶囊——
          把踩过的坑、导师的批注、学长的经验，打包传承给下一届。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/advisor"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            试试避坑顾问 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/capsule"
            className="border border-border text-primary px-6 py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            制作知识胶囊
          </Link>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 mb-16 max-w-md mx-auto"
      >
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -3, boxShadow: "0 8px 25px rgba(37,99,235,0.08)" }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-xl border border-border/60 p-5 hover:border-blue-200 transition-colors cursor-default text-center"
            >
              <Icon className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <motion.div
                className="text-2xl font-bold text-primary"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Feature Cards — 2 large cards */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16"
      >
        {CARDS.map((card) => {
          const Icon = card.icon;
          const isAmber = card.color === "amber";
          return (
            <motion.div key={card.href} variants={itemVariants}>
              <Link
                href={card.href}
                className="group block bg-card rounded-2xl border border-border/60 p-7 hover:border-blue-300 hover:shadow-lg transition-all duration-200 h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                    isAmber ? "bg-amber-50" : "bg-violet-50"
                  }`}>
                    <Icon className={`w-6 h-6 ${isAmber ? "text-amber-600" : "text-violet-600"}`} />
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isAmber ? "text-amber-700 bg-amber-50" : "text-violet-700 bg-violet-50"
                  }`}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">{card.title}</h3>
                <p className="text-xs font-medium text-muted-foreground mb-3">{card.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  进入 <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Link
          href="/onboarding"
          className="block rounded-2xl p-8 text-center transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
        >
          <h3 className="text-xl font-semibold mb-2">
            新生入组？开启三周入门计划
          </h3>
          <p className="text-blue-100">
            完成兴趣评估 → AI 推荐个性化学习路径 → 加载学长的知识胶囊
          </p>
        </Link>
      </motion.section>
    </div>
  );
}
