"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { assessOnboarding } from "@/lib/data-access";
import { saveProfile } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, ArrowRight, GraduationCap, Building2, Send, Compass } from "lucide-react";

const INTEREST_CATEGORIES: { category: string; sub: string[] }[] = [
  {
    category: "后端与分布式",
    sub: ["微服务架构", "分布式共识/Raft", "云原生/K8s", "数据库内核"],
  },
  {
    category: "前端全栈",
    sub: ["React/Next.js", "SSR/RSC 性能优化", "WASM 边缘计算", "前端工程化"],
  },
  {
    category: "AI/ML 工程",
    sub: ["LLM 推理优化", "MLOps 部署", "向量检索/RAG", "模型压缩与量化"],
  },
  {
    category: "系统与基础设施",
    sub: ["CI/CD 流水线", "可观测性/监控", "容器化/Docker", "网络协议与安全"],
  },
  {
    category: "图形与游戏引擎",
    sub: ["渲染管线", "物理模拟", "GPU 编程/着色器", "引擎架构设计"],
  },
  {
    category: "安全与合规",
    sub: ["OAuth/JWT 认证", "数据隐私/GDPR", "安全测试/渗透", "合规审计"],
  },
];

const SKILLS = [
  "Go/Rust 后端开发",
  "React/Next.js 全栈",
  "Python ML/数据",
  "Docker/K8s 运维",
  "PostgreSQL 数据库",
  "Redis/消息队列",
  "CI/CD/GitOps",
  "TypeScript/Node.js",
  "性能调优/Profiling",
  "系统设计/架构评审",
  "技术写作/文档",
];

const SELF_RATINGS = [
  { key: "os", label: "操作系统" },
  { key: "network", label: "计算机网络" },
  { key: "database", label: "数据库系统" },
  { key: "programming", label: "编程/算法" },
  { key: "systemDesign", label: "系统设计" },
  { key: "english", label: "英文文献阅读" },
];

const CAREER_OPTIONS: { value: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "phd", label: "读博深造", desc: "目标 CS/AI 方向博士", icon: <GraduationCap className="w-5 h-5" /> },
  { value: "industry", label: "互联网大厂", desc: "后端/架构/全栈方向", icon: <Building2 className="w-5 h-5" /> },
  { value: "abroad", label: "出国留学", desc: "目标海外硕士/博士", icon: <Send className="w-5 h-5" /> },
  { value: "exploring", label: "还在探索", desc: "边学边看，寻找方向", icon: <Compass className="w-5 h-5" /> },
];

interface WeekPlan {
  week: number;
  description: string;
  paperIds: number[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({
    os: 3, network: 3, database: 3, programming: 3, systemDesign: 3, english: 3,
  });
  const [timeCommitment, setTimeCommitment] = useState(15);
  const [careerDirection, setCareerDirection] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [pathDesc, setPathDesc] = useState("");
  const [capsule, setCapsule] = useState<any>(null);
  const [capsuleLoaded, setCapsuleLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("yanmai_capsule");
    if (raw) {
      try { setCapsule(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setCapsuleLoaded(true);
  }, []);

  const selectedCount = selectedInterests.length;
  const canSubmit = selectedCount > 0 && selectedSkills.length > 0;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const primarySkill = selectedSkills[0];
      const data = assessOnboarding({
        interests: selectedInterests,
        skills: primarySkill,
        selfRatings: ratings,
      });
      if (data.weeks) {
        setWeeks(data.weeks);
        setPathDesc(data.description);
      }

      await saveProfile({
        interests: selectedInterests,
        skill: primarySkill,
        ratings,
        timeCommitment,
        careerDirection,
        updatedAt: new Date().toISOString(),
      });

      const learningPath = {
        weeks: data.weeks,
        description: data.description,
        interests: selectedInterests,
        skill: primarySkill,
        skills: selectedSkills,
        timeCommitment,
        careerDirection,
        ratings,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("yanmai_learning_path", JSON.stringify(learningPath));
      setStep(2);
    } catch {
      const fallbackWeeks = [
        { week: 1, description: "建立理论框架 — 从课题组核心方向入手", paperIds: [1, 4] },
        { week: 2, description: "工程实践基础 — 学习关键架构与性能优化技术", paperIds: [2, 6] },
        { week: 3, description: "前沿探索 + 动手实践", paperIds: [3, 10] },
      ];
      setWeeks(fallbackWeeks);
      setPathDesc("个性化入门路径（Demo模式）");
      try {
        await saveProfile({
          interests: selectedInterests,
          skill: selectedSkills[0],
          ratings,
          timeCommitment,
          careerDirection,
          updatedAt: new Date().toISOString(),
        });
      } catch {}
      localStorage.setItem("yanmai_learning_path", JSON.stringify({
        weeks: fallbackWeeks,
        description: "个性化入门路径（Demo模式）",
        interests: selectedInterests,
        skill: selectedSkills[0],
        skills: selectedSkills,
        timeCommitment,
        careerDirection,
        ratings,
        savedAt: new Date().toISOString(),
      }));
      setStep(2);
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setStep(1);
    setSelectedInterests([]);
    setSelectedSkills([]);
    setExpandedCategory(null);
    setRatings({ os: 3, network: 3, database: 3, programming: 3, systemDesign: 3, english: 3 });
    setTimeCommitment(15);
    setCareerDirection("");
    setWeeks([]);
    setPathDesc("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-primary mb-8 text-center">
        新生入组 · 3周入门路径
      </h2>

      {/* 步骤指示器 */}
      <div className="flex justify-center gap-4 mb-8">
        {["兴趣评估", "3周路径"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i + 1 <= step ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* 步骤1：评估 */}
      {step === 1 && (
        <div className="bg-card rounded-xl border border-border p-8 space-y-8">
          {/* 研究兴趣 - 可展开二级 */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              你的研究兴趣方向是？（多选）
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              点击主类别展开子方向，支持跨类选择 · 已选 <span className="font-bold text-accent">{selectedCount}</span> 项
            </p>
            <div className="space-y-2">
              {INTEREST_CATEGORIES.map((cat) => {
                const isExpanded = expandedCategory === cat.category;
                const catSelected = cat.sub.filter((s) => selectedInterests.includes(s)).length;
                return (
                  <div key={cat.category} className="border border-border/60 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
                        isExpanded
                          ? "bg-primary/5 text-primary"
                          : "hover:bg-muted/50 text-primary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`transition-transform text-xs ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                        {cat.category}
                        {catSelected > 0 && (
                          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                            {catSelected}
                          </span>
                        )}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                        {cat.sub.map((sub) => {
                          const sel = selectedInterests.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => toggleInterest(sub)}
                              className={`text-left p-2.5 text-xs rounded-lg border transition-colors ${
                                sel
                                  ? "border-accent bg-accent/10 text-primary font-medium"
                                  : "border-border hover:border-accent/40 hover:bg-muted/50"
                              }`}
                            >
                              {sel ? "✓ " : ""}{sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 技能 - 多选 11项 */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              你擅长的技能有哪些？（多选）
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              已选 <span className="font-bold text-accent">{selectedSkills.length}</span> 项
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SKILLS.map((skill) => {
                const sel = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`p-2.5 text-xs border rounded-lg transition-colors text-left ${
                      sel
                        ? "border-accent bg-accent/10 text-primary font-medium"
                        : "border-border hover:border-accent/40 hover:bg-muted/50"
                    }`}
                  >
                    {sel ? "✓ " : ""}{skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 每周可投入时间 */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              每周可投入科研时间
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={timeCommitment}
                onChange={(e) => setTimeCommitment(parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-lg font-bold text-primary w-12 text-center">
                {timeCommitment}h
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>5h (轻度参与)</span>
              <span>20h (正常投入)</span>
              <span>40h (全力投入)</span>
            </div>
          </div>

          {/* 职业方向 */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">
              你的职业规划方向
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CAREER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCareerDirection(opt.value)}
                  className={`p-4 border rounded-xl text-center transition-colors ${
                    careerDirection === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/40 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{opt.icon}</span>
                  <span className={`text-sm font-medium block ${careerDirection === opt.value ? "text-primary" : ""}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 自我评估 */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">
              自我评估 (1-5)
            </h3>
            <div className="space-y-4">
              {SELF_RATINGS.map((item) => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="text-sm w-32 text-muted-foreground shrink-0">{item.label}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={ratings[item.key]}
                    onChange={(e) =>
                      setRatings((prev) => ({ ...prev, [item.key]: parseInt(e.target.value) }))
                    }
                    className="flex-1 accent-primary"
                  />
                  <span className="text-sm font-medium w-6 text-center">{ratings[item.key]}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading
              ? "生成中..."
              : canSubmit
                ? "生成我的3周入门路径 →"
                : "请至少选择1个兴趣和1个技能"}
          </button>
        </div>
      )}

      {/* 步骤2：3周路径 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm text-primary">
            {pathDesc}
          </div>

          {/* 知识胶囊 */}
          <AnimatePresence>
            {capsuleLoaded && capsule && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-5 h-5 text-violet-600" />
                  <h4 className="text-sm font-semibold text-violet-800">
                    师兄/师姐的知识胶囊
                  </h4>
                  <span className="text-[10px] text-violet-500 ml-auto">
                    {capsule.contributor}
                  </span>
                </div>
                <p className="text-xs text-violet-700 mb-3">
                  {capsule.name} — 包含 {capsule.assets?.reduce((s: number, a: any) => s + a.count, 0)} 条资产和 {capsule.papers?.length} 篇推荐论文
                </p>
                {capsule.mentorNote && (
                  <div className="bg-white/60 rounded-lg p-3 mb-3 text-xs text-violet-700">
                    <span className="font-medium">导师建议：</span>{capsule.mentorNote}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (capsule.papers) {
                        const ids = capsule.papers.map((p: any) => p.id);
                        localStorage.setItem("yanmai_capsule_paper_ids", JSON.stringify(ids));
                      }
                      const note = capsule.mentorNote || "";
                      const el = document.querySelector("textarea") as HTMLTextAreaElement;
                      if (el && note) el.value = note;
                    }}
                    className="text-xs font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    加载推荐论文 <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => router.push("/capsule")}
                    className="text-xs text-violet-500 hover:text-violet-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    查看胶囊详情
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile summary */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-primary mb-3">你的入组画像</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">兴趣方向：</span>
                <span className="text-primary font-medium">{selectedInterests.join("、")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">擅长技能：</span>
                <span className="text-primary font-medium">{selectedSkills[0]}{selectedSkills.length > 1 ? ` +${selectedSkills.length - 1}项` : ""}</span>
              </div>
              <div>
                <span className="text-muted-foreground">每周投入：</span>
                <span className="text-primary font-medium">{timeCommitment}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">职业方向：</span>
                <span className="text-primary font-medium">
                  {CAREER_OPTIONS.find((c) => c.value === careerDirection)?.label || "未选择"}
                </span>
              </div>
            </div>
          </div>

          {weeks.map((week) => (
            <div key={week.week} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {week.week}
                </div>
                <div>
                  <h4 className="font-semibold text-primary">第{week.week}周</h4>
                  <p className="text-sm text-muted-foreground">{week.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {week.paperIds.map((pid, i) => (
                  <div key={pid} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-accent font-medium">{i + 1}.</span>
                    <span>论文 #{pid}</span>
                    <span className="text-xs text-muted-foreground">— 详见论文研读页面</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            每周读完论文后至少写一条批注。导师可以查看进度，但不会查看你的笔记内容。
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-6 py-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              重新评估
            </button>
            <button
              onClick={() => {
                setStep(1);
                setSelectedInterests([]);
                setSelectedSkills([]);
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              完成入组 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
