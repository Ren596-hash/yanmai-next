"use client";

import { useState } from "react";
import { CHAT_SCENES, SCENE_LIST } from "@/lib/seed-data";
import {
  askFirstRound,
  askFollowup,
  debateMode,
} from "@/lib/ai-adapter";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export default function SearchPage() {
  const [mode, setMode] = useState<"think" | "debate">("think");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sceneId, setSceneId] = useState<number | null>(null);
  const [originalQuestion, setOriginalQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [debateRound, setDebateRound] = useState(0);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      if (mode === "debate") {
        const round = debateRound + 1;
        setDebateRound(round);
        const result = await debateMode(userMsg, round);
        setMessages((prev) => [...prev, { role: "ai", text: result.response }]);
      } else if (sceneId !== null) {
        // 第二轮：followup
        const result = await askFollowup(userMsg, sceneId, originalQuestion);
        setMessages((prev) => [...prev, { role: "ai", text: result.response }]);
        setSceneId(null);
      } else {
        // 第一轮：ask
        const result = await askFirstRound(userMsg);
        setSceneId(result.scene_id);
        setOriginalQuestion(userMsg);
        setMessages((prev) => [...prev, { role: "ai", text: result.response }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "抱歉，AI服务暂时不可用。请稍后再试。" },
      ]);
    }

    setLoading(false);
  };

  const handleLoadScene = (sceneId: number) => {
    const scene = CHAT_SCENES.find((s) => s.id === sceneId);
    if (!scene) return;
    setMessages(
      scene.messages.map((m) => ({ role: m.role, text: m.text }))
    );
    setMode(scene.mode);
    setSceneId(null);
    setDebateRound(0);
  };

  const handleModeSwitch = (newMode: "think" | "debate") => {
    setMode(newMode);
    if (newMode === "debate") {
      setDebateRound(0);
      setSceneId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] flex flex-col">
      {/* 模式切换 */}
      <div className="flex gap-2 mb-4 shrink-0">
        {[
          { mode: "think" as const, label: "💡 思维引导", desc: "苏格拉底式反问" },
          { mode: "debate" as const, label: "⚔️ 思维挑战", desc: "AI扮演学术反对者" },
        ].map((m) => (
          <button
            key={m.mode}
            onClick={() => handleModeSwitch(m.mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              mode === m.mode
                ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                : "bg-white text-[#1a3a5c] border-border hover:border-[#c9a96e]"
            }`}
          >
            <div>{m.label}</div>
            <div className="text-xs opacity-70">{m.desc}</div>
          </button>
        ))}
        {debateRound > 0 && (
          <span className="self-center text-xs text-muted-foreground">
            第{debateRound}轮
          </span>
        )}
      </div>

      {/* 对话区 */}
      <div className="flex-1 bg-white rounded-xl border border-border p-6 mb-4 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20">
            <span className="text-5xl block mb-4">💬</span>
            <h2 className="text-xl font-semibold text-[#1a3a5c] mb-2">
              搜索问答 · 先问再推
            </h2>
            <p className="text-sm">
              AI不会直接回答你的问题
              <br />
              而是先反问，引导你独立思考
            </p>
            {mode === "debate" && (
              <p className="text-xs text-[#c9a96e] mt-2">
                ⚔️ 思维挑战模式 — 请陈述你的观点
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-green-100 text-green-900 rounded-br-sm"
                      : "bg-blue-50 text-foreground rounded-bl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-blue-50 px-4 py-3 rounded-xl text-sm text-muted-foreground">
                  AI 正在思考...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 场景选择器 */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 shrink-0">
        {SCENE_LIST.map((scene) => (
          <button
            key={scene.id}
            onClick={() => handleLoadScene(scene.id)}
            className="px-3 py-1.5 text-xs bg-white border border-border rounded-full hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors whitespace-nowrap"
          >
            {scene.icon} {scene.title}
          </button>
        ))}
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setSceneId(null);
              setDebateRound(0);
            }}
            className="px-3 py-1.5 text-xs bg-red-50 border border-red-200 rounded-full text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            清空对话
          </button>
        )}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={
            mode === "debate"
              ? "陈述你的学术观点..."
              : sceneId !== null
                ? "输入你的思考..."
                : "输入你的问题...（AI将先反问，不直接回答）"
          }
          className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/30 text-sm"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-[#1a3a5c] text-white px-6 py-3 rounded-lg hover:bg-[#1a3a5c]/90 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "..." : "发送"}
        </button>
      </div>
    </div>
  );
}
