"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamicImport from "next/dynamic";
import papers from "@/data/papers.json";
import annotations from "@/data/annotations.json";
import type { Annotation } from "@/lib/types";
import { multiLensReview } from "@/lib/engines";
import type { LensReviewResult } from "@/lib/engines";
import { trackReading, getPaperPDFUrl } from "@/lib/data-access";

const PDFViewer = dynamicImport(() => import("@/components/reader/PDFViewer"), { ssr: false });

type ViewMode = "structured" | "pdf";

type PaperData = (typeof papers)[0] & { sections: string[][] };

// 透镜配置
const LENS_LABELS: Record<string, string> = {
  mentor: "🎓 导师",
  senior: "🧑‍🔬 师兄",
  reviewer: "📝 审稿人",
  cross: "🔗 跨学科",
};

const CONFIDENCE_ICONS: Record<string, string> = {
  high: "🟢",
  medium: "🟡",
  low: "🔴",
};

export default function ReaderPage() {
  const [selectedPaperId, setSelectedPaperId] = useState<number>(1);
  const [paperAnnotations, setPaperAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [thinkVisible, setThinkVisible] = useState(false);
  const [thinkAnswer, setThinkAnswer] = useState("");
  const [thinkRevealed, setThinkRevealed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [newAnnotation, setNewAnnotation] = useState("");
  const [addPos, setAddPos] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<ViewMode>("structured");
  const [lensReview, setLensReview] = useState<LensReviewResult[] | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const paper = papers.find((p) => p.id === selectedPaperId) as PaperData | undefined;
  const sections: string[][] = paper?.sections ?? [];

  // 加载批注
  useEffect(() => {
    const anns = annotations.filter((a) => a.paper_id === selectedPaperId);
    setPaperAnnotations(anns as Annotation[]);
    setActiveAnnotation(null);
    setThinkVisible(false);
    setThinkRevealed(false);
    setThinkAnswer("");
  }, [selectedPaperId]);

  // 标注锚点点击
  const handleMarkerClick = useCallback(
    (annId: number) => {
      const ann = paperAnnotations.find((a) => a.id === annId);
      if (!ann) return;
      setActiveAnnotation(ann);
      if (ann.has_think_prompt) {
        setThinkVisible(true);
        setThinkRevealed(false);
        setThinkAnswer("");
      } else {
        setThinkVisible(false);
      }
    },
    [paperAnnotations]
  );

  // 渲染论文HTML
  const renderContent = () => {
    return sections.map(([heading, body], sIdx) => {
      // 替换ann-marker为可点击span
      const processedBody = body.replace(
        /<span class="ann-marker" data-ann="(\d+)">(.*?)<\/span>/g,
        (_match, annId: string, text: string) => {
          const aid = parseInt(annId);
          const ann = paperAnnotations.find((a) => a.id === aid);
          const isActive = activeAnnotation?.id === aid;
          return `<span class="ann-marker ${isActive ? "ann-marker-active" : ""}" data-ann="${aid}" style="cursor:pointer">${text}</span>`;
        }
      );

      return (
        <section
          key={sIdx}
          id={`section-${sIdx}`}
          data-section={sIdx}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-3">{heading}</h3>
          <div
            className="text-sm leading-relaxed text-foreground/85"
            dangerouslySetInnerHTML={{ __html: processedBody }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.classList.contains("ann-marker")) {
                const annId = parseInt(target.dataset.ann || "0");
                if (annId) handleMarkerClick(annId);
              }
            }}
          />
        </section>
      );
    });
  };

  // IntersectionObserver: 阅读行为追踪 + 持久化
  useEffect(() => {
    if (!contentRef.current) return;
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = (entry.target as HTMLElement).dataset.section;
          if (entry.isIntersecting) {
            trackReading({ paper_id: selectedPaperId, section_id: sectionId || "", action: "enter" });
          } else {
            const dwellStart = (entry.target as HTMLElement).dataset.dwellStart;
            const dwell = dwellStart
              ? Math.round((Date.now() - parseInt(dwellStart)) / 1000)
              : 0;
            trackReading({ paper_id: selectedPaperId, section_id: sectionId || "", action: "leave", dwell_seconds: dwell });
          }
        });
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.dwellStart = String(Date.now());
          }
        });
      },
      { threshold: 0.3 }
    );

    document.querySelectorAll("[data-section]").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [selectedPaperId, sections]);

  // 页面卸载时发送最后停留时间
  useEffect(() => {
    const handleBeforeUnload = () => {
      const dwelling = document.querySelector("[data-section]") as HTMLElement | null;
      if (dwelling?.dataset.dwellStart) {
        const dwell = Math.round((Date.now() - parseInt(dwelling.dataset.dwellStart)) / 1000);
        trackReading({ paper_id: selectedPaperId, section_id: dwelling.dataset.section || "", action: "leave", dwell_seconds: dwell });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedPaperId]);

  // 文本选中 → 添加批注
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && text.length > 5 && contentRef.current?.contains(sel?.anchorNode as Node)) {
      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setAddPos({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10,
      });
      setShowAddForm(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, [handleTextSelection]);

  const submitAnnotation = () => {
    if (!newAnnotation.trim()) return;
    console.log("[new_annotation]", { paper_id: selectedPaperId, anchor_text: selectedText, content: newAnnotation });
    setNewAnnotation("");
    setShowAddForm(false);
    setSelectedText("");
  };

  const handleMultiLensReview = async () => {
    setReviewLoading(true);
    setLensReview(null);
    const results = await multiLensReview(selectedPaperId);
    setLensReview(results);
    setReviewLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 顶部：论文选择器 */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <label className="text-sm font-medium text-[#1a3a5c] whitespace-nowrap">
          选择论文：
        </label>
        <select
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(parseInt(e.target.value))}
          className="flex-1 max-w-lg px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30"
        >
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.id}] {p.title.substring(0, 60)}... — {p.authors}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          共 {paperAnnotations.length} 条批注
        </span>
        {/* 阅读模式切换 */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("structured")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "structured"
                ? "bg-[#1a3a5c] text-white"
                : "bg-white text-muted-foreground hover:bg-muted"
            }`}
          >
            📝 结构化阅读
          </button>
          <button
            onClick={() => setViewMode("pdf")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "pdf"
                ? "bg-[#1a3a5c] text-white"
                : "bg-white text-muted-foreground hover:bg-muted"
            }`}
          >
            📄 原始PDF
          </button>
        </div>
      </div>

      {/* 主体：论文 + 侧边栏 */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* 左侧论文阅读区 */}
        <div className="flex-1 bg-white rounded-xl border border-border p-6 overflow-y-auto" ref={contentRef}>
          {paper ? (
            <>
              <h1 className="text-2xl font-bold text-[#1a3a5c] mb-2">{paper.title}</h1>
              <p className="text-sm text-muted-foreground mb-1">{paper.authors}</p>
              <p className="text-xs text-muted-foreground mb-1">{paper.journal}</p>
              <p className="text-xs text-[#c9a96e] mb-4">DOI: {paper.doi}</p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-[#1a3a5c] mb-1">摘要</h4>
                <p className="text-sm text-muted-foreground">{paper.abstract}</p>
              </div>
              {/* 元数据卡片 */}
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-[#c9a96e]/5 border border-[#c9a96e]/20 rounded-lg">
                {paper.tags?.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#1a3a5c]/10 text-[#1a3a5c] cursor-pointer hover:bg-[#1a3a5c]/20 transition-colors">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  · {paperAnnotations.length}条批注
                </span>
                <button
                  onClick={handleMultiLensReview}
                  disabled={reviewLoading}
                  className="ml-auto text-xs font-medium text-[#c9a96e] hover:text-[#1a3a5c] transition-colors px-2 py-1 rounded border border-[#c9a96e]/30 hover:bg-[#c9a96e]/10 disabled:opacity-50"
                >
                  {reviewLoading ? "⏳ 审阅中..." : "🔍 AI四维审阅"}
                </button>
              </div>
              {/* 四维审阅面板 */}
              {lensReview && lensReview.length > 0 && (
                <div className="mb-6 p-4 rounded-lg border-2 border-[#c9a96e]/40 bg-[#c9a96e]/5">
                  <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">
                    🔍 AI四维审阅结果
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {lensReview.map((lr) => (
                      <div
                        key={lr.engine}
                        className="p-3 rounded-lg border border-[#c9a96e]/20 bg-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {lr.icon}
                          </span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c]">
                            {lr.label}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80">{lr.summary}</p>
                        {lr.annotations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {lr.annotations.slice(0, 2).map((a, ai) => (
                              <div key={ai} className="text-[10px] text-muted-foreground bg-muted/50 rounded p-1.5">
                                <span className="font-medium">「{a.anchor_text}」</span> — {a.content}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-4">
                {viewMode === "pdf" ? (
                  <div className="min-h-[500px]">
                    <PDFViewer pdfUrl={getPaperPDFUrl(selectedPaperId)} />
                  </div>
                ) : (
                  renderContent()
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground mt-20">论文未找到</p>
          )}
        </div>

        {/* 右侧批注侧边栏 */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-border p-4 overflow-y-auto">
          <h3 className="font-semibold text-[#1a3a5c] mb-4 flex items-center gap-2">
            <span>💬 批注</span>
            <span className="text-xs text-muted-foreground font-normal">
              ({paperAnnotations.length})
            </span>
          </h3>

          {thinkVisible && activeAnnotation && !thinkRevealed ? (
            /* 思考提示框 */
            <div className="think-prompt-box mb-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                💡 在查看批注前，请先思考：
              </p>
              <p className="text-sm text-amber-700 mb-3">
                {activeAnnotation.think_question}
              </p>
              <textarea
                value={thinkAnswer}
                onChange={(e) => setThinkAnswer(e.target.value)}
                placeholder="写下你的思考..."
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-2"
                rows={3}
              />
              <button
                onClick={() => setThinkRevealed(true)}
                disabled={!thinkAnswer.trim()}
                className="w-full bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {thinkAnswer.trim() ? "提交思考 →" : "请先写下你的思考"}
              </button>
            </div>
          ) : activeAnnotation ? (
            /* 批注卡片 */
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#c9a96e]/30 bg-[#c9a96e]/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c]">
                    {LENS_LABELS[activeAnnotation.lens_type] || activeAnnotation.lens_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {activeAnnotation.author}
                  </span>
                  <span className="text-xs">{CONFIDENCE_ICONS[activeAnnotation.confidence]}</span>
                </div>
                <p className="text-sm text-foreground/85 mb-2">{activeAnnotation.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activeAnnotation.created_at}</span>
                  <span>·</span>
                  <span>{activeAnnotation.confidence === "high" ? "高置信度" : activeAnnotation.confidence === "medium" ? "中置信度" : "低置信度"}</span>
                  {activeAnnotation.confidence_note && (
                    <>
                      <span>·</span>
                      <span className="text-[#c9a96e]">{activeAnnotation.confidence_note}</span>
                    </>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    className="text-xs text-[#1a3a5c] hover:text-[#c9a96e] transition-colors"
                    onClick={() => {
                      const reply = prompt("输入你的回复：");
                      if (reply) console.log("[reply]", { annotation_id: activeAnnotation.id, content: reply });
                    }}
                  >
                    💬 回复
                  </button>
                </div>
              </div>

              {/* 批注锚点文本 */}
              <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                <span className="font-medium">原文段落：</span>
                &ldquo;{activeAnnotation.anchor_text}&rdquo;
              </div>
            </div>
          ) : paperAnnotations.length > 0 ? (
            /* 批注列表（点击跳转） */
            <div className="space-y-2">
              {paperAnnotations.map((ann) => (
                <button
                  key={ann.id}
                  onClick={() => handleMarkerClick(ann.id)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-[#c9a96e] hover:bg-[#c9a96e]/5 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c]">
                      {LENS_LABELS[ann.lens_type]}
                    </span>
                    <span className="text-xs text-muted-foreground">{ann.author}</span>
                    {ann.has_think_prompt ? <span className="text-xs">💡</span> : null}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ann.content}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center mt-16">
              点击论文中的高亮段落
              <br />
              查看前人批注
            </p>
          )}
        </div>
      </div>

      {/* 浮动添加批注按钮 */}
      {showAddForm && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-xl border border-[#c9a96e] p-4 w-80"
          style={{ left: `${Math.min(addPos.x - 160, window.innerWidth - 340)}px`, top: `${addPos.y}px` }}
        >
          <p className="text-xs text-muted-foreground mb-2">
            选中文本：&ldquo;{selectedText.substring(0, 80)}...&rdquo;
          </p>
          <textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="添加你的批注..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 resize-none mb-2"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={submitAnnotation}
              disabled={!newAnnotation.trim()}
              className="flex-1 bg-[#1a3a5c] text-white py-1.5 rounded-md text-sm hover:bg-[#1a3a5c]/90 disabled:opacity-50 transition-colors"
            >
              添加批注
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 border border-border rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
