"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { addNotification } from "@/lib/notifications";
import failures from "@/data/failures.json";
import annotations from "@/data/annotations.json";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, FileText, FlaskConical, Users, BarChart3, Briefcase, Lightbulb, CheckCircle2, Circle } from "lucide-react";

const ASSETS = [
  { category: "批注", label: "文献批注", count: annotations.length, linkTo: "/reader", icon: <FileText className="w-4 h-4" /> },
  { category: "失败报告", label: "失败报告", count: failures.length, linkTo: "/advisor", icon: <AlertTriangle className="w-4 h-4" /> },
  { category: "实验记录", label: "实验记录", count: 12, linkTo: null, preview: true, icon: <FlaskConical className="w-4 h-4" /> },
  { category: "组会记录", label: "组会记录", count: 8, linkTo: null, preview: true, icon: <Users className="w-4 h-4" /> },
  { category: "数据分析模板", label: "数据分析模板", count: 5, linkTo: null, preview: true, icon: <BarChart3 className="w-4 h-4" /> },
  { category: "毕业去向", label: "毕业生去向与职业建议", count: 3, linkTo: null, preview: true, icon: <Briefcase className="w-4 h-4" /> },
  { category: "研究风格", label: "科研风格总结", count: 1, linkTo: "/growth", icon: <Lightbulb className="w-4 h-4" /> },
];

const RECOMMENDED_PAPERS = [
  { id: 1, title: "微服务拆分粒度对系统可维护性的影响研究", reason: "课题组奠基性工作" },
  { id: 2, title: "React Server Components 流式SSR的性能优化策略", reason: "前端架构经典案例" },
  { id: 4, title: "Raft 与 Paxos 在生产环境中的可用性对比分析", reason: "分布式理论必读" },
  { id: 3, title: "基于推测解码的大语言模型推理加速方法", reason: "AI+系统工程范式" },
  { id: 10, title: "CRDT 与 OT 在实时协同编辑器中的并发控制对比", reason: "前沿技术方向" },
];

type PreviewType = "failures" | "annotations" | "experiments" | "meetings" | "templates" | "career" | null;

export default function CapsulePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mentorNote, setMentorNote] = useState("");
  const [selectedPapers, setSelectedPapers] = useState<number[]>(
    RECOMMENDED_PAPERS.map((p) => p.id)
  );
  const [previewType, setPreviewType] = useState<PreviewType>(null);

  const togglePaper = (id: number) => {
    setSelectedPapers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleAssetClick = (asset: (typeof ASSETS)[0]) => {
    if (asset.linkTo) {
      router.push(asset.linkTo);
    } else if (asset.preview) {
      setPreviewType(
        asset.category === "失败报告" ? "failures" :
        asset.category === "批注" ? "annotations" :
        asset.category === "实验记录" ? "experiments" :
        asset.category === "组会记录" ? "meetings" :
        asset.category === "数据分析模板" ? "templates" :
        asset.category === "毕业去向" ? "career" : null
      );
    }
  };

  const previewData = useMemo(() => {
    if (previewType === "failures") return failures.slice(0, 5).map((f: any) => ({ title: f.title, detail: f.lesson?.slice(0, 80) + "..." }));
    if (previewType === "annotations") return annotations.slice(0, 5).map((a: any) => ({ title: a.content?.slice(0, 60) + "...", detail: `${a.lens_type} · ${a.author}` }));
    return [];
  }, [previewType]);

  const handlePack = () => {
    const capsule = {
      name: "张明远·后端架构与分布式系统",
      contributor: "张明远（2020级硕士）",
      assets: ASSETS.map((a) => ({ category: a.category, label: a.label, count: a.count })),
      papers: RECOMMENDED_PAPERS.filter((p) => selectedPapers.includes(p.id)),
      mentorNote,
      styleSummary: "张明远高度关注系统可维护性和架构决策质量，67%批注涉及架构设计和性能优化。倾向于从生产事故中发现系统性改进机会——微服务拆分方案的优化即源于此。擅长跨领域类比，将分布式系统的经验迁移到前端架构设计。编码风格严谨，强调代码review和自动化测试的工程文化。",
      generatedAt: new Date().toISOString(),
    };
    localStorage.setItem("yanmai_capsule", JSON.stringify(capsule));
    addNotification({
      type: "capsule_ready",
      title: "知识胶囊已生成",
      body: `张明远的知识胶囊打包完成，包含${ASSETS.reduce((s, a) => s + a.count, 0)}条资产和${selectedPapers.length}篇推荐论文`,
      link: "/onboarding",
    });
    setStep(3);
  };

  const handleRestart = () => {
    setStep(1);
    setMentorNote("");
    setSelectedPapers(RECOMMENDED_PAPERS.map((p) => p.id));
    setPreviewType(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-primary mb-8 text-center">
        知识胶囊 · 一键传承
      </h2>

      {/* 步骤指示器 */}
      <div className="flex justify-center gap-4 mb-8">
        {["选择资产", "确认路径", "打包完成"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${
                i + 1 <= step ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* 步骤1：选择资产 */}
      {step === 1 && (
        <div className="bg-card rounded-xl border border-border p-8">
          <h3 className="text-lg font-semibold text-primary mb-2">
            张明远的知识资产
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            博士生 · 2020级 · 即将毕业离组
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {ASSETS.map((asset) => (
              <button
                key={asset.category}
                onClick={() => handleAssetClick(asset)}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors text-left cursor-pointer"
              >
                <span className="text-sm inline-flex items-center gap-2">
                  <span className="text-muted-foreground">{asset.icon}</span>
                  {asset.label}
                </span>
                <span className="text-lg font-bold text-accent">{asset.count}</span>
              </button>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-4 mb-6 text-sm text-muted-foreground">
            <p className="font-medium text-primary mb-1">知识胶囊说明</p>
            将自动打包以上资产，生成结构化的知识传递包。新生入组时可自动加载。
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            开始打包 →
          </button>
        </div>
      )}

      {/* 步骤2：确认入门路径 */}
      {step === 2 && (
        <div className="bg-card rounded-xl border border-border p-8">
          <h3 className="text-lg font-semibold text-primary mb-2">
            新生入门路径推荐
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            为下一届新生推荐5篇核心论文作为入门路径。点击可取消选择。
          </p>
          <div className="space-y-2 mb-6">
            {RECOMMENDED_PAPERS.map((paper, i) => (
              <button
                key={paper.id}
                onClick={() => togglePaper(paper.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPapers.includes(paper.id)
                    ? "border-accent bg-accent/5"
                    : "border-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary">
                    {selectedPapers.includes(paper.id) ? (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-primary">
                      {i + 1}. {paper.title}
                    </span>
                    <span className="text-xs text-accent ml-2">{paper.reason}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium text-primary block mb-2">
              导师建议（可选）：
            </label>
            <textarea
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
              placeholder="例如：建议先读MoS₂相关论文，再扩展到异质结体系..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              ← 返回
            </button>
            <button
              onClick={handlePack}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              确认路径 →
            </button>
          </div>
        </div>
      )}

      {/* 步骤3：打包完成 */}
      {step === 3 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">
            知识胶囊打包完成
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            7类资产已打包为知识胶囊，可在新生入组时自动加载
          </p>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">胶囊名称：</span>
                <span className="font-medium text-primary">张明远·后端架构与分布式系统</span>
              </div>
              <div>
                <span className="text-muted-foreground">贡献者：</span>
                <span className="font-medium">张明远（2020级博士）</span>
              </div>
              <div>
                <span className="text-muted-foreground">生成时间：</span>
                <span>{new Date().toLocaleDateString("zh-CN")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">内容：</span>
                <span className="font-medium">
                  {ASSETS.reduce((sum, a) => sum + a.count, 0)}条资产
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">推荐论文：</span>
                <span className="font-medium">{selectedPapers.length}篇核心论文</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-accent/30">
              <span className="text-xs text-accent font-medium">研究风格总结</span>
              <p className="text-sm text-primary mt-1 leading-relaxed">
                张明远高度关注<strong>系统可维护性</strong>，67%批注涉及架构设计。
              倾向于从<strong>生产事故</strong>中发现系统性改进机会—微服务拆分方案的优化即源于此。
              擅长跨领域类比，将分布式系统的经验迁移到前端架构设计。
              编码风格严谨，强调&ldquo;代码审查和自动化测试&rdquo;的工程文化。
              </p>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            重新演示 →
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setPreviewType(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">
                  {previewType === "failures" && "失败报告列表"}
                  {previewType === "annotations" && "文献批注列表"}
                  {previewType === "experiments" && "实验记录"}
                  {previewType === "meetings" && "组会记录"}
                  {previewType === "templates" && "数据分析模板"}
                  {previewType === "career" && "毕业生去向"}
                </h3>
                <button
                  onClick={() => setPreviewType(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {previewData.map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border/60">
                    <p className="text-sm font-medium text-primary">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                ))}
                {(previewType === "experiments" || previewType === "meetings" || previewType === "templates" || previewType === "career") && (
                  <p className="text-xs text-muted-foreground text-center pt-2">Demo数据 — 生产环境将展示完整记录</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {previewType === "failures" && (
                  <button
                    onClick={() => { setPreviewType(null); router.push("/advisor"); }}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    查看全部失败案例 →
                  </button>
                )}
                {previewType === "annotations" && (
                  <button
                    onClick={() => { setPreviewType(null); router.push("/reader"); }}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    查看全部批注 →
                  </button>
                )}
                <button
                  onClick={() => setPreviewType(null)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
