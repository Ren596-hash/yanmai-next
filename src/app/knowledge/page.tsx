"use client";

import { useState, useMemo } from "react";
import { useAppShell } from "@/components/layout/AppShell";
import {
  unifyKnowledgeCards,
  searchKnowledgeCards,
  computeMemoryInsights,
  getRelatedCards,
  type KnowledgeCard,
  type KnowledgeCardType,
} from "@/lib/knowledge-utils";
import {
  InsightCard,
  ReferenceCard,
  SemanticLinkCard,
  SuggestionCard,
  AIPanelSection,
} from "@/components/ai/AIPanelCards";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  Lightbulb,
  FlaskConical,
  Layers,
  ArrowRight,
  X,
  Sparkles,
  BookOpen,
  TrendingUp,
  Link2,
  Hash,
} from "lucide-react";

const FILTER_TABS: { value: KnowledgeCardType | "all"; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "全部", icon: <Layers className="w-3 h-3" /> },
  { value: "failure", label: "失败案例", icon: <AlertTriangle className="w-3 h-3" /> },
  { value: "mentor_insight", label: "导师洞见", icon: <Lightbulb className="w-3 h-3" /> },
  { value: "methodology", label: "方法论", icon: <FlaskConical className="w-3 h-3" /> },
];

const typeBadgeStyles: Record<KnowledgeCardType, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  failure: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    label: "失败",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  mentor_insight: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
    label: "洞见",
    icon: <Lightbulb className="w-3 h-3" />,
  },
  methodology: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "方法",
    icon: <FlaskConical className="w-3 h-3" />,
  },
  topic: {
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-600 dark:text-slate-400",
    label: "主题",
    icon: <Layers className="w-3 h-3" />,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function KnowledgePage() {
  const router = useRouter();
  const { setAIPanelOpen, setAIPanelContent } = useAppShell();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<KnowledgeCardType | "all">("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [hoveredTags, setHoveredTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allCards = useMemo(() => unifyKnowledgeCards(), []);
  const insights = useMemo(() => computeMemoryInsights(), []);

  const filteredCards = useMemo(() => {
    let result = activeFilter === "all" ? allCards : allCards.filter((c) => c.type === activeFilter);
    if (searchQuery.trim()) {
      result = searchKnowledgeCards(searchQuery, result);
    }
    return result;
  }, [allCards, activeFilter, searchQuery]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    return allCards
      .filter((c) =>
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 5)
      .map((c) => c.tags.find((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))!)
      .filter((t, i, arr) => t && arr.indexOf(t) === i);
  }, [searchQuery, allCards]);

  const handleCardClick = (card: KnowledgeCard) => {
    setExpandedCardId(expandedCardId === card.id ? null : card.id);
    const related = getRelatedCards(card.id, allCards);

    setAIPanelContent(
      <div className="space-y-3">
        <AIPanelSection title="上下文" icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}>
          <InsightCard
            icon={typeBadgeStyles[card.type].icon}
            title={card.title}
            body={card.body}
            confidence={card.confidence}
          />
        </AIPanelSection>

        {card.linkedPaperId && (
          <AIPanelSection title="关联论文" icon={<BookOpen className="w-3.5 h-3.5 text-blue-500" />}>
            <ReferenceCard
              type="paper"
              title={`论文 #${card.linkedPaperId}`}
              subtitle="在研读页打开"
              onClick={() => router.push(`/reader?paper=${card.linkedPaperId}`)}
            />
          </AIPanelSection>
        )}

        {related.length > 0 && (
          <AIPanelSection title="相关内容" icon={<Link2 className="w-3.5 h-3.5 text-accent" />}>
            {related.slice(0, 4).map((rc) => (
              <ReferenceCard
                key={rc.id}
                type={rc.type === "failure" ? "failure" : rc.type === "mentor_insight" ? "annotation" : "paper"}
                title={rc.title}
                subtitle={rc.subtitle}
              />
            ))}
            {card.tags.length > 0 && (
              <SemanticLinkCard
                from={{ label: card.tags[0], type: "tag" }}
                to={{ label: related[0]?.tags[0] || "related", type: "tag" }}
                relationship="共享主题"
              />
            )}
          </AIPanelSection>
        )}

        <SuggestionCard
          title="在知识图谱中查看"
          description="在科研知识图谱中查看此卡片的关联关系。"
          actionLabel="打开图谱"
          onAction={() => router.push("/graph")}
        />
      </div>
    );
    setAIPanelOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border/60 bg-card/80 backdrop-blur-sm shrink-0">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold text-primary">知识库</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            课题组知识记忆 —— 导师洞见、失败教训、方法论模式。
          </p>
        </motion.div>

        {/* Floating Search */}
        <div className="mt-5 relative max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="搜索导师经验、方法论、审稿模式..."
              className="w-full h-10 pl-10 pr-10 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-card transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.95, y: -4 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {suggestions.map((tag, i) => (
                  <button
                    key={i}
                    onMouseDown={() => {
                      setSearchQuery(tag);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Hash className="w-3 h-3 text-accent" />
                    {tag}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Tabs */}
        <div className="mt-3 flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-primary hover:bg-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.value !== "all" && (
                  <span className="text-[10px] opacity-60">
                    ({allCards.filter((c) => c.type === tab.value).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* AI Memory Insights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mb-8 p-5 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/60"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-primary">AI 知识洞察</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Failure Patterns */}
            <div>
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                高频失败模式
              </h4>
              <div className="space-y-1.5">
                {insights.topFailureTags.map(({ tag, count }, i) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 text-right">{i + 1}</span>
                    <div
                      className="flex-1 h-5 rounded bg-amber-100 dark:bg-amber-900/30"
                      style={{ maxWidth: `${Math.max(20, (count / insights.topFailureTags[0].count) * 100)}%` }}
                    >
                      <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 px-2 leading-5">
                        {tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Mentor Themes */}
            <div>
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                导师关注主题
              </h4>
              <div className="space-y-1.5">
                {insights.topMentorThemes.map(({ tag, count }, i) => (
                  <div key={tag} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 text-right">{i + 1}</span>
                    <div
                      className="flex-1 h-5 rounded bg-blue-100 dark:bg-blue-900/30"
                      style={{ maxWidth: `${Math.max(20, (count / (insights.topMentorThemes[0]?.count || 1)) * 100)}%` }}
                    >
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 px-2 leading-5">
                        {tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Co-occurrence */}
            <div>
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                共现模式
              </h4>
              <div className="space-y-1.5">
                {insights.coOccurringPairs.map(({ pair, count }, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-medium text-primary px-1.5 py-0.5 rounded bg-accent/10">
                      {pair[0]}
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span className="font-medium text-primary px-1.5 py-0.5 rounded bg-accent/10">
                      {pair[1]}
                    </span>
                    <span className="text-muted-foreground ml-auto">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-3 border-t border-border/60 flex gap-4 text-xs text-muted-foreground">
            <span>{insights.totalFailures} 份失败报告</span>
            <span>{insights.totalMentorAnnotations} 条导师洞见</span>
            <span>{insights.highConfidenceCount} 条高可信度</span>
            <span>{insights.baselineMentionRate}% 对照提及率</span>
          </div>
        </motion.div>

        {/* Knowledge Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${activeFilter}-${searchQuery}`}
          className="columns-1 md:columns-2 lg:columns-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredCards.map((card) => {
              const isExpanded = expandedCardId === card.id;
              const badge = typeBadgeStyles[card.type];
              const hasSharedTags = hoveredTags.length > 0 && card.tags.some((t) => hoveredTags.includes(t));
              const isDimmed = hoveredTags.length > 0 && !hasSharedTags;

              return (
                <motion.div
                  key={card.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="break-inside-avoid mb-4"
                >
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={() => setHoveredTags(card.tags)}
                    onMouseLeave={() => setHoveredTags([])}
                    className={`rounded-xl border bg-card p-4 cursor-pointer transition-shadow duration-200 ${
                      isDimmed ? "opacity-40" : ""
                    } ${hasSharedTags ? "ring-1 ring-blue-200 dark:ring-blue-800" : "border-border/60 hover:border-blue-200 hover:shadow-lg"}`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      {card.confidence && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            card.confidence === "high"
                              ? "bg-emerald-500"
                              : card.confidence === "medium"
                                ? "bg-amber-400"
                                : "bg-red-400"
                          }`}
                        />
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-primary mb-1 line-clamp-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>

                    {/* Expanded body */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2 pt-2 border-t border-border/40">
                            {card.body}
                          </p>
                          {card.linkedPaperId && (
                            <p className="text-[10px] text-accent mb-2">
                              关联：论文 #{card.linkedPaperId}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-md text-[10px] bg-muted text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      {card.tags.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] text-muted-foreground">
                          +{card.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredCards.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">没有匹配的知识卡片</p>
            <p className="text-xs text-muted-foreground mt-1">试试其他关键词或筛选条件</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
