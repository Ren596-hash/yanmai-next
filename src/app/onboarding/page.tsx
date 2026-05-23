"use client";

import { useState } from "react";
import { assessOnboarding } from "@/lib/data-access";
import { saveProfile } from "@/lib/storage";

const INTEREST_CATEGORIES: { category: string; sub: string[] }[] = [
  {
    category: "缺陷工程 (MoS₂等)",
    sub: ["MoS₂缺陷调控", "氧化物缺陷(Vₒ/Zn₁)", "缺陷表征技术(EPR/XAFS)", "缺陷催化理论"],
  },
  {
    category: "异质结光催化 (Cu₂O/TiO₂等)",
    sub: ["Z型异质结", "II型异质结", "S型异质结", "界面电荷转移动力学"],
  },
  {
    category: "单原子催化 (Fe-N-C等)",
    sub: ["Fe-N-C ORR", "Co-N-C", "贵金属单原子(Pt/Pd)", "配位环境调控"],
  },
  {
    category: "光电催化 (ZnO等)",
    sub: ["ZnO光电催化", "TiO₂ PEC", "光电催化CO₂还原", "光电催化水分解"],
  },
  {
    category: "ML+催化 (高通量筛选)",
    sub: ["DFT+机器学习", "高通量筛选", "催化活性预测", "材料逆向设计"],
  },
  {
    category: "MXene/新型二维材料",
    sub: ["MXene合成与应用", "TMDs光催化", "钙钛矿催化", "COF/MOF催化"],
  },
];

const SKILLS = [
  "DFT计算/理论推导",
  "CVD/ALD合成实验",
  "XRD/XPS/TEM表征",
  "光/电催化性能测试",
  "Python/R数据分析",
  "LaTeX/论文写作",
  "文献调研/综述写作",
  "EndNote/Zotero文献管理",
  "学术PPT制作/汇报",
  "SEM/拉曼/红外操作",
  "Origin/Prism数据绘图",
];

const SELF_RATINGS = [
  { key: "solidState", label: "固体物理" },
  { key: "catalysis", label: "催化原理" },
  { key: "instrument", label: "仪器分析" },
  { key: "programming", label: "编程/数据分析" },
  { key: "writing", label: "学术写作" },
  { key: "english", label: "英文文献阅读" },
];

const CAREER_OPTIONS = [
  { value: "phd", label: "读博深造", desc: "目标国内/海外博士", icon: "🎓" },
  { value: "industry", label: "企业就业", desc: "半导体/新能源/医药方向", icon: "🏢" },
  { value: "abroad", label: "出国留学", desc: "目标海外硕士/博士", icon: "✈️" },
  { value: "exploring", label: "还在探索", desc: "边学边看，寻找方向", icon: "🧭" },
];

interface WeekPlan {
  week: number;
  description: string;
  paperIds: number[];
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({
    solidState: 3, catalysis: 3, instrument: 3, programming: 3, writing: 3, english: 3,
  });
  const [timeCommitment, setTimeCommitment] = useState(15);
  const [careerDirection, setCareerDirection] = useState("");
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [pathDesc, setPathDesc] = useState("");

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
        { week: 1, description: "建立知识框架 — 从课题组核心方向入手", paperIds: [1, 9] },
        { week: 2, description: "实验方法基础 — 学习关键制备与表征技术", paperIds: [2, 3] },
        { week: 3, description: "前沿探索 + 动手实践", paperIds: [6, 8] },
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
    setRatings({ solidState: 3, catalysis: 3, instrument: 3, programming: 3, writing: 3, english: 3 });
    setTimeCommitment(15);
    setCareerDirection("");
    setWeeks([]);
    setPathDesc("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-8 text-center">
        🚀 新生入组 · 3周入门路径
      </h2>

      {/* 步骤指示器 */}
      <div className="flex justify-center gap-4 mb-8">
        {["兴趣评估", "3周路径"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 <= step ? "bg-[#1a3a5c] text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span className={`text-sm ${i + 1 <= step ? "text-[#1a3a5c] font-medium" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* 步骤1：评估 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-8 space-y-8">
          {/* 研究兴趣 - 可展开二级 */}
          <div>
            <h3 className="text-lg font-semibold text-[#1a3a5c] mb-1">
              你的研究兴趣方向是？（多选）
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              点击主类别展开子方向，支持跨类选择 · 已选 <span className="font-bold text-[#c9a96e]">{selectedCount}</span> 项
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
                          ? "bg-[#1a3a5c]/5 text-[#1a3a5c]"
                          : "hover:bg-muted/50 text-[#1a3a5c]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`transition-transform text-xs ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                        {cat.category}
                        {catSelected > 0 && (
                          <span className="text-xs bg-[#c9a96e]/20 text-[#c9a96e] px-2 py-0.5 rounded-full">
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
                                  ? "border-[#c9a96e] bg-[#c9a96e]/10 text-[#1a3a5c] font-medium"
                                  : "border-border hover:border-[#c9a96e]/40 hover:bg-muted/50"
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
            <h3 className="text-lg font-semibold text-[#1a3a5c] mb-1">
              你擅长的技能有哪些？（多选）
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              已选 <span className="font-bold text-[#c9a96e]">{selectedSkills.length}</span> 项
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
                        ? "border-[#c9a96e] bg-[#c9a96e]/10 text-[#1a3a5c] font-medium"
                        : "border-border hover:border-[#c9a96e]/40 hover:bg-muted/50"
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
            <h3 className="text-lg font-semibold text-[#1a3a5c] mb-1">
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
                className="flex-1 accent-[#1a3a5c]"
              />
              <span className="text-lg font-bold text-[#1a3a5c] w-12 text-center">
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
            <h3 className="text-lg font-semibold text-[#1a3a5c] mb-4">
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
                      ? "border-[#c9a96e] bg-[#c9a96e]/10"
                      : "border-border hover:border-[#c9a96e]/40 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{opt.icon}</span>
                  <span className={`text-sm font-medium block ${careerDirection === opt.value ? "text-[#1a3a5c]" : ""}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 自我评估 */}
          <div>
            <h3 className="text-lg font-semibold text-[#1a3a5c] mb-4">
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
                    className="flex-1 accent-[#1a3a5c]"
                  />
                  <span className="text-sm font-medium w-6 text-center">{ratings[item.key]}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full bg-[#1a3a5c] text-white py-3 rounded-lg hover:bg-[#1a3a5c]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
          <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-xl p-4 text-sm text-[#1a3a5c]">
            📋 {pathDesc}
          </div>

          {/* Profile summary */}
          <div className="bg-white rounded-xl border border-border p-4">
            <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">📝 你的入组画像</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">兴趣方向：</span>
                <span className="text-[#1a3a5c] font-medium">{selectedInterests.join("、")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">擅长技能：</span>
                <span className="text-[#1a3a5c] font-medium">{selectedSkills[0]}{selectedSkills.length > 1 ? ` +${selectedSkills.length - 1}项` : ""}</span>
              </div>
              <div>
                <span className="text-muted-foreground">每周投入：</span>
                <span className="text-[#1a3a5c] font-medium">{timeCommitment}h</span>
              </div>
              <div>
                <span className="text-muted-foreground">职业方向：</span>
                <span className="text-[#1a3a5c] font-medium">
                  {CAREER_OPTIONS.find((c) => c.value === careerDirection)?.label || "未选择"}
                </span>
              </div>
            </div>
          </div>

          {weeks.map((week) => (
            <div key={week.week} className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center font-bold text-sm">
                  {week.week}
                </div>
                <div>
                  <h4 className="font-semibold text-[#1a3a5c]">Week {week.week}</h4>
                  <p className="text-sm text-muted-foreground">{week.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {week.paperIds.map((pid, i) => (
                  <div key={pid} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-[#c9a96e] font-medium">{i + 1}.</span>
                    <span>论文 #{pid}</span>
                    <span className="text-xs text-muted-foreground">— 详见论文研读页面</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            💡 每周读完后在系统里写至少一条批注。导师可查看进度但看不到你的思考笔记。
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
              className="px-6 py-3 bg-[#1a3a5c] text-white rounded-lg text-sm hover:bg-[#1a3a5c]/90 transition-colors"
            >
              完成入组 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
