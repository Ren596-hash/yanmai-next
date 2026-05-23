"use client";

import { useState } from "react";
import { assessOnboarding } from "@/lib/data-access";

const INTERESTS = [
  "缺陷工程 (MoS₂等)",
  "异质结光催化 (Cu₂O/TiO₂等)",
  "单原子催化 (Fe-N-C等)",
  "光电催化 (ZnO等)",
  "ML+催化 (高通量筛选)",
  "MXene/新型二维材料",
];

const SKILLS = [
  "DFT计算/理论推导",
  "实验操作/仪器使用",
  "数据分析/编程处理",
  "文献调研/综述写作",
];

const SELF_RATINGS = [
  { key: "solidState", label: "固体物理" },
  { key: "catalysis", label: "催化原理" },
  { key: "instrument", label: "仪器分析" },
  { key: "programming", label: "编程/数据分析" },
];

interface WeekPlan {
  week: number;
  description: string;
  paperIds: number[];
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    solidState: 3,
    catalysis: 3,
    instrument: 3,
    programming: 3,
  });
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [pathDesc, setPathDesc] = useState("");

  const canSubmit = selectedInterests.length > 0 && selectedSkill !== "";

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data = assessOnboarding({
        interests: selectedInterests,
        skills: selectedSkill,
        selfRatings: ratings,
      });
      if (data.weeks) {
        setWeeks(data.weeks);
        setPathDesc(data.description);
        localStorage.setItem("yanmai_learning_path", JSON.stringify({
          weeks: data.weeks,
          description: data.description,
          interests: selectedInterests,
          skill: selectedSkill,
          savedAt: new Date().toISOString(),
        }));
        setStep(2);
      }
    } catch {
      const fallbackWeeks = [
        { week: 1, description: "建立知识框架 — 从课题组核心方向入手", paperIds: [1, 9] },
        { week: 2, description: "实验方法基础 — 学习关键制备与表征技术", paperIds: [2, 3] },
        { week: 3, description: "前沿探索 + 动手实践", paperIds: [6, 8] },
      ];
      setWeeks(fallbackWeeks);
      setPathDesc("个性化入门路径（Demo模式）");
      localStorage.setItem("yanmai_learning_path", JSON.stringify({
        weeks: fallbackWeeks,
        description: "个性化入门路径（Demo模式）",
        interests: selectedInterests,
        skill: selectedSkill,
        savedAt: new Date().toISOString(),
      }));
      setStep(2);
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setStep(1);
    setSelectedInterests([]);
    setSelectedSkill("");
    setRatings({ solidState: 3, catalysis: 3, instrument: 3, programming: 3 });
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
            {i < 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* 步骤1：兴趣评估 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-border p-8">
          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-4">
            你的研究兴趣方向是？（多选）
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`p-3 border rounded-lg text-sm transition-colors ${
                  selectedInterests.includes(interest)
                    ? "border-[#c9a96e] bg-[#c9a96e]/10 text-[#1a3a5c] font-medium"
                    : "border-border hover:border-[#c9a96e] hover:bg-[#c9a96e]/5"
                }`}
              >
                {selectedInterests.includes(interest) ? "✅ " : ""}
                {interest}
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-4">
            你最擅长的是？（单选）
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`p-3 border rounded-lg text-sm transition-colors ${
                  selectedSkill === skill
                    ? "border-[#c9a96e] bg-[#c9a96e]/10 text-[#1a3a5c] font-medium"
                    : "border-border hover:border-[#c9a96e] hover:bg-[#c9a96e]/5"
                }`}
              >
                {selectedSkill === skill ? "✅ " : ""}
                {skill}
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-[#1a3a5c] mb-4">
            自我评估 (1-5)
          </h3>
          <div className="space-y-4 mb-8">
            {SELF_RATINGS.map((item) => (
              <div key={item.key} className="flex items-center gap-4">
                <span className="text-sm w-28 text-muted-foreground">
                  {item.label}
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={ratings[item.key]}
                  onChange={(e) =>
                    setRatings((prev) => ({
                      ...prev,
                      [item.key]: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1 accent-[#1a3a5c]"
                />
                <span className="text-sm font-medium w-6 text-center">
                  {ratings[item.key]}
                </span>
              </div>
            ))}
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

          {weeks.map((week) => (
            <div
              key={week.week}
              className="bg-white rounded-xl border border-border p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center font-bold text-sm">
                  {week.week}
                </div>
                <div>
                  <h4 className="font-semibold text-[#1a3a5c]">
                    Week {week.week}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {week.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {week.paperIds.map((pid, i) => (
                  <div
                    key={pid}
                    className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-xs text-[#c9a96e] font-medium">
                      {i + 1}.
                    </span>
                    <span>论文 #{pid}</span>
                    <span className="text-xs text-muted-foreground">
                      — 详见论文研读页面
                    </span>
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
                setSelectedSkill("");
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
