"use client";

import { useState } from "react";

const ASSETS = [
  { category: "批注", label: "📝 文献批注", count: 30 },
  { category: "失败报告", label: "⚠️ 失败报告", count: 5 },
  { category: "实验记录", label: "🧪 实验记录", count: 12 },
  { category: "组会记录", label: "📋 组会记录", count: 8 },
  { category: "数据分析模板", label: "📊 数据分析模板", count: 5 },
  { category: "毕业去向", label: "💼 毕业生去向与职业建议", count: 3 },
  { category: "研究风格", label: "🔬 科研风格总结", count: 1 },
];

const RECOMMENDED_PAPERS = [
  { id: 1, title: "MoS₂纳米片的缺陷工程调控及光催化性能研究", reason: "课题组奠基性工作" },
  { id: 2, title: "Cu₂O/TiO₂异质结光催化还原CO₂的界面效应", reason: "实验方法经典案例" },
  { id: 8, title: "单原子Pt/CeO₂催化剂的水煤气变换反应机理研究", reason: "DFT+实验范式" },
  { id: 3, title: "单原子Fe-N-C催化剂的ORR活性位点识别", reason: "前沿表征技术" },
  { id: 6, title: "机器学习指导的钙钛矿氧化物催化剂的发现与优化", reason: "AI+催化新方向" },
];

export default function CapsulePage() {
  const [step, setStep] = useState(1);
  const [mentorNote, setMentorNote] = useState("");
  const [selectedPapers, setSelectedPapers] = useState<number[]>(
    RECOMMENDED_PAPERS.map((p) => p.id)
  );

  const togglePaper = (id: number) => {
    setSelectedPapers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleRestart = () => {
    setStep(1);
    setMentorNote("");
    setSelectedPapers(RECOMMENDED_PAPERS.map((p) => p.id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-8 text-center">
        💊 知识胶囊 · 一键传承
      </h2>

      {/* 步骤指示器 */}
      <div className="flex justify-center gap-4 mb-8">
        {["选择资产", "确认路径", "打包完成"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 <= step
                  ? "bg-[#1a3a5c] text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm ${
                i + 1 <= step ? "text-[#1a3a5c] font-medium" : "text-muted-foreground"
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
        <div className="bg-white rounded-xl border border-border p-8">
          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-2">
            📦 张明远的知识资产
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            博士生 · 2020级 · 即将毕业离组
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {ASSETS.map((asset) => (
              <div
                key={asset.category}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-[#c9a96e] hover:bg-[#c9a96e]/5 transition-colors"
              >
                <span className="text-sm">{asset.label}</span>
                <span className="text-lg font-bold text-[#c9a96e]">{asset.count}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-4 mb-6 text-sm text-muted-foreground">
            <p className="font-medium text-[#1a3a5c] mb-1">💡 知识胶囊说明</p>
            将自动打包以上资产，生成结构化的知识传递包。新生入组时可自动加载。
          </div>
          <button
            onClick={() => setStep(2)}
            className="w-full bg-[#1a3a5c] text-white py-3 rounded-lg hover:bg-[#1a3a5c]/90 transition-colors font-medium"
          >
            开始打包 →
          </button>
        </div>
      )}

      {/* 步骤2：确认入门路径 */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-border p-8">
          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-2">
            📚 新生入门路径推荐
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
                    ? "border-[#c9a96e] bg-[#c9a96e]/5"
                    : "border-border opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#1a3a5c]">
                    {selectedPapers.includes(paper.id) ? "✅" : "⬜"}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-[#1a3a5c]">
                      {i + 1}. {paper.title}
                    </span>
                    <span className="text-xs text-[#c9a96e] ml-2">{paper.reason}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mb-6">
            <label className="text-sm font-medium text-[#1a3a5c] block mb-2">
              导师建议（可选）：
            </label>
            <textarea
              value={mentorNote}
              onChange={(e) => setMentorNote(e.target.value)}
              placeholder="例如：建议先读MoS₂相关论文，再扩展到异质结体系..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 resize-none"
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
              onClick={() => setStep(3)}
              className="flex-1 bg-[#1a3a5c] text-white py-3 rounded-lg hover:bg-[#1a3a5c]/90 transition-colors font-medium"
            >
              确认路径 →
            </button>
          </div>
        </div>
      )}

      {/* 步骤3：打包完成 */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <span className="text-6xl block mb-4">✅</span>
          <h3 className="text-xl font-semibold text-[#1a3a5c] mb-2">
            知识胶囊打包完成！
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            7类资产已打包为知识胶囊，可在新生入组时自动加载
          </p>

          <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-xl p-6 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">胶囊名称：</span>
                <span className="font-medium text-[#1a3a5c]">张明远·催化材料研究</span>
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
            {/* 研究风格总结 */}
            <div className="mt-4 pt-4 border-t border-[#c9a96e]/30">
              <span className="text-xs text-[#c9a96e] font-medium">🔬 研究风格总结</span>
              <p className="text-sm text-[#1a3a5c] mt-1 leading-relaxed">
                张明远高度关注<strong>实验可重复性</strong>，67%批注涉及方法论验证。
                倾向于从<strong>反常数据</strong>中发现突破点—MoS₂非线性模型的发现即源于此。
                擅长跨体系类比，将ZnO的经验迁移到MoS₂实验设计。
                风险偏好中等，强调&ldquo;一次只改变一个变量&rdquo;的对照实验原则。
              </p>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="bg-[#1a3a5c] text-white px-8 py-3 rounded-lg hover:bg-[#1a3a5c]/90 transition-colors font-medium"
          >
            重新演示 →
          </button>
        </div>
      )}
    </div>
  );
}
