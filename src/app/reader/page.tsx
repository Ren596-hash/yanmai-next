"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamicImport from "next/dynamic";
import papers from "@/data/papers.json";
import annotations from "@/data/annotations.json";
import type { Annotation } from "@/lib/types";
import { multiLensReview } from "@/lib/engines";
import type { LensReviewResult } from "@/lib/engines";
import { trackReading, getPaperPDFUrl, getAllPapers } from "@/lib/data-access";
import type { StoredPaper } from "@/lib/storage";
import { useAppShell } from "@/components/layout/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, File, Search, MessageSquare, Sparkles, Lightbulb, Reply, X } from "lucide-react";


const PDFViewer = dynamicImport(() => import("@/components/reader/PDFViewer"), { ssr: false });
const LazyPaperUpload = dynamicImport(() => import("@/components/reader/PaperUpload"), { ssr: false });
const LazyReadingReport = dynamicImport(() => import("@/components/reader/ReadingReport"), { ssr: false });

type ViewMode = "structured" | "pdf";

type PaperData = (typeof papers)[0] & { sections: string[][]; source?: string; id: number };

const LENS_LABELS: Record<string, string> = {
  mentor: "导师",
  senior: "学长",
  reviewer: "审稿",
  cross: "跨界",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-red-500",
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
  const [uploadedPapers, setUploadedPapers] = useState<StoredPaper[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [expandedLenses, setExpandedLenses] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setAIPanelOpen, setAIPanelContent } = useAppShell();

  useEffect(() => {
    if (!paper) { setSessionSeconds(0); return; }
    setSessionSeconds(0);
    sessionRef.current = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (sessionRef.current) clearInterval(sessionRef.current);
    };
  }, [selectedPaperId]);

  useEffect(() => {
    getAllPapers().then(setUploadedPapers).catch(() => {});
  }, []);

  const allPapers = [...papers.map((p) => ({ ...p, source: "static" as const })), ...uploadedPapers];
  const paper = allPapers.find((p) => p.id === selectedPaperId) as PaperData | undefined;
  const sections: string[][] = paper?.sections ?? [];

  useEffect(() => {
    getPaperPDFUrl(selectedPaperId).then(setPdfUrl).catch(() => setPdfUrl(""));
  }, [selectedPaperId]);

  useEffect(() => {
    const anns = annotations.filter((a) => a.paper_id === selectedPaperId);
    setPaperAnnotations(anns as Annotation[]);
    setActiveAnnotation(null);
    setThinkVisible(false);
    setThinkRevealed(false);
    setThinkAnswer("");
    setLensReview(null);
  }, [selectedPaperId]);

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

  const renderContent = () => {
    return sections.map(([heading, body], sIdx) => {
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
        <motion.section
          key={sIdx}
          id={`section-${sIdx}`}
          data-section={sIdx}
          className="mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: sIdx * 0.05 }}
        >
          <h3 className="text-lg font-semibold text-primary mb-3">{heading}</h3>
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
        </motion.section>
      );
    });
  };

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

  useEffect(() => {
    const handleBeforeUnload = () => {
      const dwelling = document.querySelector("[data-section]") as HTMLElement | null;
      if (dwelling?.dataset.dwellStart) {
        const dwell = Math.round((Date.now() - parseInt(dwelling.dataset.dwellStart)) / 1000);
        trackReading({ paper_id: selectedPaperId, section_id: dwelling.dataset.section || "", action: "leave", dwell_seconds: dwell });
      }
      trackReading({ paper_id: selectedPaperId, section_id: "session", action: "session_end", dwell_seconds: sessionSeconds });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedPaperId, sessionSeconds]);

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

  const toggleLens = (engine: string) => {
    setExpandedLenses((prev) => {
      const next = new Set(prev);
      if (next.has(engine)) next.delete(engine);
      else next.add(engine);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border/60 bg-card/80 backdrop-blur-sm shrink-0 flex-wrap">
        <LazyPaperUpload onUploaded={(p) => {
          setUploadedPapers((prev) => [...prev, p]);
          setSelectedPaperId(p.id!);
        }} />
        <label className="text-sm font-medium text-primary whitespace-nowrap">
          论文：
        </label>
        <select
          value={selectedPaperId}
          onChange={(e) => setSelectedPaperId(parseInt(e.target.value))}
          className="flex-1 max-w-lg px-3 py-1.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          {allPapers.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.id}] {p.title.substring(0, 60)}... — {p.authors}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {paperAnnotations.length} 条批注
        </span>
        {sessionSeconds > 0 && (
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
            <Clock className="w-3.5 h-3.5 inline mr-1" />{Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s
          </span>
        )}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("structured")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "structured"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />结构化
          </button>
          <button
            onClick={() => setViewMode("pdf")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "pdf"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <File className="w-3.5 h-3.5 inline mr-1" />PDF
          </button>
        </div>
        <button
          onClick={() => {
            setAIPanelOpen(true);
            setAIPanelContent(
              <div className="space-y-3">
                <p className="text-xs font-medium text-primary">AI 透镜 — 论文分析</p>
                <p className="text-xs text-muted-foreground">选择章节或批注即可查看 AI 洞察。</p>
                {lensReview && lensReview.length > 0 && lensReview.map((lr) => (
                  <div key={lr.engine} className="p-3 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs font-medium text-primary">{lr.icon} {lr.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{lr.summary}</p>
                  </div>
                ))}
              </div>
            );
          }}
          className="ml-auto text-xs font-medium text-accent hover:text-primary transition-colors px-2 py-1 rounded border border-accent/30 hover:bg-accent/10 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1" />AI 面板
        </button>
      </div>

      {/* Main: Paper + Sidebar */}
      <div className="flex gap-0 flex-1 min-h-0">
        {/* Paper Reading Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6" ref={contentRef}>
          {paper ? (
            <>
              <h1 className="text-2xl font-bold text-primary mb-2">{paper.title}</h1>
              <p className="text-sm text-muted-foreground mb-1">{paper.authors}</p>
              <p className="text-xs text-muted-foreground mb-1">{paper.journal}</p>
              <p className="text-xs text-accent mb-4">DOI: {paper.doi}</p>

              {/* Abstract */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-primary mb-1">摘要</h4>
                <p className="text-sm text-muted-foreground">{paper.abstract}</p>
              </div>

              {/* Meta + AI Review trigger */}
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                {paper.tags?.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  · {paperAnnotations.length} 条批注
                </span>
                <button
                  onClick={handleMultiLensReview}
                  disabled={reviewLoading}
                  className="ml-auto text-xs font-medium text-accent hover:text-primary transition-colors px-2 py-1 rounded border border-accent/30 hover:bg-accent/10 disabled:opacity-50"
                >
                  {reviewLoading ? "分析中..." : <><Sparkles className="w-3.5 h-3.5 inline mr-1" />AI 审稿</>}
                </button>
              </div>

              {/* AI Review Results — expandable */}
              <AnimatePresence>
                {lensReview && lensReview.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="p-4 rounded-lg border-2 border-accent/40 bg-accent/5">
                      <h4 className="text-sm font-semibold text-primary mb-3">
                        <Sparkles className="w-4 h-4 inline mr-1" />AI 审稿结果
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {lensReview.map((lr) => {
                          const isExpanded = expandedLenses.has(lr.engine);
                          return (
                            <motion.div
                              key={lr.engine}
                              layout
                              className="p-3 rounded-lg border border-accent/20 bg-card cursor-pointer"
                              onClick={() => toggleLens(lr.engine)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium">{lr.icon}</span>
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {lr.label}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/80">{lr.summary}</p>
                              <AnimatePresence>
                                {isExpanded && lr.annotations.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-2 space-y-1 overflow-hidden"
                                  >
                                    {lr.annotations.map((a, ai) => (
                                      <div key={ai} className="text-[10px] text-muted-foreground bg-muted/50 rounded p-1.5">
                                        <span className="font-medium">「{a.anchor_text}」</span> — {a.content}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paper body */}
              <div className="border-t border-border pt-4">
                {viewMode === "pdf" ? (
                  <div className="min-h-[500px]">
                    <PDFViewer pdfUrl={pdfUrl} />
                  </div>
                ) : (
                  renderContent()
                )}
              </div>

              {/* Reading Report */}
              <div className="mt-6">
                <LazyReadingReport
                  currentPaperId={selectedPaperId}
                  sessionSeconds={sessionSeconds}
                  annotationCount={paperAnnotations.length}
                />
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground mt-20">论文未找到</p>
          )}
        </div>

        {/* Right: Annotation Panel */}
        <aside className="w-80 shrink-0 bg-card border-l border-border/60 p-4 overflow-y-auto">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />批注
            <span className="text-xs text-muted-foreground font-normal">
              ({paperAnnotations.length})
            </span>
          </h3>

          <AnimatePresence mode="wait">
            {thinkVisible && activeAnnotation && !thinkRevealed ? (
              <motion.div
                key="think"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="think-prompt-box"
              >
                <p className="text-sm font-medium text-blue-900 mb-2">
                  查看前先思考：
                </p>
                <p className="text-sm text-blue-800 mb-3">
                  {activeAnnotation.think_question}
                </p>
                <textarea
                  value={thinkAnswer}
                  onChange={(e) => setThinkAnswer(e.target.value)}
                  placeholder="写下你的思考..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-2"
                  rows={3}
                />
                <button
                  onClick={() => setThinkRevealed(true)}
                  disabled={!thinkAnswer.trim()}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {thinkAnswer.trim() ? "提交 →" : "请先写下你的思考"}
                </button>
              </motion.div>
            ) : activeAnnotation ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {LENS_LABELS[activeAnnotation.lens_type] || activeAnnotation.lens_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activeAnnotation.author}
                    </span>
                    <span className={`w-2 h-2 rounded-full inline-block ${CONFIDENCE_COLORS[activeAnnotation.confidence] || "bg-gray-400"}`} />
                  </div>
                  <p className="text-sm text-foreground/85 mb-2">{activeAnnotation.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activeAnnotation.created_at}</span>
                    <span>·</span>
                    <span>
                      {activeAnnotation.confidence === "high" ? "高" : activeAnnotation.confidence === "medium" ? "中" : "低"}
                    </span>
                    {activeAnnotation.confidence_note && (
                      <>
                        <span>·</span>
                        <span className="text-accent">{activeAnnotation.confidence_note}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      className="text-xs text-primary hover:text-accent transition-colors"
                      onClick={() => {
                        const reply = prompt("输入你的回复：");
                        if (reply) console.log("[reply]", { annotation_id: activeAnnotation.id, content: reply });
                      }}
                    >
                      <Reply className="w-3.5 h-3.5 inline mr-1" />回复
                    </button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <span className="font-medium">原文：</span>
                  &ldquo;{activeAnnotation.anchor_text}&rdquo;
                </div>
              </motion.div>
            ) : paperAnnotations.length > 0 ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {paperAnnotations.map((ann, i) => (
                  <motion.button
                    key={ann.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    onClick={() => handleMarkerClick(ann.id)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {LENS_LABELS[ann.lens_type]}
                      </span>
                      <span className="text-xs text-muted-foreground">{ann.author}</span>
                      {ann.has_think_prompt ? <Lightbulb className="w-3 h-3 text-blue-500" /> : null}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ann.content}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground text-center mt-16"
              >
                点击论文中的高亮文字
                <br />
                查看批注
              </motion.p>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* Floating annotation form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-card rounded-xl shadow-xl border border-accent p-4 w-80"
            style={{ left: `${Math.min(addPos.x - 160, window.innerWidth - 340)}px`, top: `${addPos.y}px` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                &ldquo;{selectedText.substring(0, 80)}...&rdquo;
              </p>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
              placeholder="添加你的批注..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none mb-2"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={submitAnnotation}
                disabled={!newAnnotation.trim()}
                className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
