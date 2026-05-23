"use client";

import { useState, useMemo } from "react";
import failures from "@/data/failures.json";
import {
  askFirstRound,
  askFollowup,
} from "@/lib/ai-adapter";

interface FailureData {
  id: number;
  title: string;
  experimenter: string;
  date: string;
  what: string;
  failure: string;
  why: string;
  lesson: string;
  tags: string[];
  people_count: number;
  scope: string;
}

export default function AdvisorPage() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"ask" | "think" | "results">("ask");
  const [aiQuestion, setAiQuestion] = useState("");
  const [thinkAnswer, setThinkAnswer] = useState("");
  const [matches, setMatches] = useState<FailureData[]>([]);
  const [loading, setLoading] = useState(false);

  const allFailures = failures as FailureData[];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setPhase("ask");

    const result = await askFirstRound(query);
    setAiQuestion(result.response);
    setPhase("think");
    setLoading(false);
  };

  const handleThinkSubmit = async () => {
    if (!thinkAnswer.trim()) return;
    setLoading(true);

    // 前端关键词匹配
    const lower = query.toLowerCase();
    const scored = allFailures
      .map((f) => {
        let score = 0;
        const searchText = `${f.title} ${f.what} ${f.failure} ${f.why} ${f.tags.join(" ")}`.toLowerCase();
        // 检查每个查询词
        query.split(/\s+/).forEach((word) => {
          if (searchText.includes(word.toLowerCase())) score += 1;
        });
        // 标签精确匹配额外加分
        f.tags.forEach((tag) => {
          if (lower.includes(tag.toLowerCase())) score += 2;
        });
        return { ...f, score };
      })
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score - a.score);

    setMatches(scored);
    setPhase("results");
    setLoading(false);
  };

  const reset = () => {
    setQuery("");
    setPhase("ask");
    setAiQuestion("");
    setThinkAnswer("");
    setMatches([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex gap-6">
      {/* 左侧主区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-xl font-semibold text-[#1a3a5c] mb-4">
          ⚠️ 避坑顾问 · 案例匹配
        </h2>

        {/* 搜索区 */}
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="描述你的实验方案，系统自动匹配历史失败案例..."
              className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="bg-[#1a3a5c] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a3a5c]/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {loading ? "分析中..." : "搜索"}
            </button>
            {phase !== "ask" && (
              <button
                onClick={reset}
                className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors shrink-0"
              >
                重新搜索
              </button>
            )}
          </div>
        </div>

        {/* 结果区域 */}
        <div className="flex-1 bg-white rounded-xl border border-border p-6 overflow-y-auto">
          {phase === "ask" && !loading && (
            <div className="text-center text-muted-foreground mt-16">
              <span className="text-5xl block mb-4">⚠️</span>
              <p>输入实验方案关键词</p>
              <p className="text-xs mt-1">
                试试：退火 / Cu₂O / XPS / pH / 溶剂 / NaBH₄ / TEM ...
              </p>
            </div>
          )}

          {phase === "think" && (
            <div className="think-prompt-box">
              <p className="text-sm font-medium text-amber-800 mb-2">
                🤔 先思考再查看
              </p>
              <div
                className="text-sm text-amber-700 mb-4"
                dangerouslySetInnerHTML={{ __html: aiQuestion }}
              />
              <textarea
                value={thinkAnswer}
                onChange={(e) => setThinkAnswer(e.target.value)}
                placeholder="写下你的思考..."
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-2"
                rows={3}
              />
              <button
                onClick={handleThinkSubmit}
                disabled={!thinkAnswer.trim() || loading}
                className="w-full bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {loading ? "匹配中..." : "提交思考，查看案例 →"}
              </button>
            </div>
          )}

          {phase === "results" && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <p className="text-center text-muted-foreground mt-16">
                  未匹配到相关失败案例
                  <br />
                  <span className="text-xs">尝试更具体的关键词</span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    匹配到 {matches.length} 条相关失败案例
                  </p>
                  {matches.map((f, i) => (
                    <div
                      key={f.id}
                      className={`p-4 rounded-lg border ${
                        i === 0
                          ? "border-red-300 bg-red-50"
                          : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {i === 0 && <span className="text-sm">🔥</span>}
                        <span className="text-sm">{i === 0 ? "最相关" : "📌"}</span>
                        <h4 className="font-semibold text-[#1a3a5c]">{f.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">实验者：</span>
                          {f.experimenter} · {f.date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">踩坑人数：</span>
                          {f.people_count}人
                        </div>
                      </div>
                      <div className="text-sm space-y-1 mb-2">
                        <p>
                          <span className="font-medium text-[#1a3a5c]">做了什么：</span>
                          {f.what}
                        </p>
                        <p>
                          <span className="font-medium text-red-600">失败现象：</span>
                          {f.failure}
                        </p>
                        <p>
                          <span className="font-medium text-amber-600">原因：</span>
                          {f.why}
                        </p>
                        <p>
                          <span className="font-medium text-green-600">教训：</span>
                          {f.lesson}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧失败案例库 */}
      <div className="w-64 shrink-0 bg-white rounded-xl border border-border p-4 overflow-y-auto">
        <h3 className="font-semibold text-[#1a3a5c] mb-3 text-sm">
          失败案例库 ({allFailures.length})
        </h3>
        <div className="space-y-1">
          {allFailures.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setQuery(f.title);
                setPhase("ask");
              }}
              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              <span className="font-medium text-[#1a3a5c]">{f.title}</span>
              <span className="text-muted-foreground block text-[10px]">
                {f.experimenter} · {f.people_count}人踩坑
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
