"use client";

import { useCustomizations } from "./UserCustomizationsProvider";
import type { CardTemplate } from "@/lib/user-customizations";
import { DEFAULT_CARD_TEMPLATE } from "@/lib/user-customizations";
import { LayoutGrid, Eye, Type, Palette } from "lucide-react";

const DENSITY_OPTIONS: { value: CardTemplate["density"]; label: string; desc: string }[] = [
  { value: "compact", label: "紧凑", desc: "信息密度高，适合快速浏览" },
  { value: "normal", label: "标准", desc: "均衡的间距和字号" },
  { value: "spacious", label: "宽松", desc: "大间距，适合仔细阅读" },
];

const SIZE_OPTIONS: { value: CardTemplate["fontSize"]; label: string }[] = [
  { value: "small", label: "小" },
  { value: "medium", label: "中" },
  { value: "large", label: "大" },
];

const ACCENT_COLORS = [
  { label: "金色", value: "#c9a96e" },
  { label: "学术蓝", value: "#3b82f6" },
  { label: "翠绿", value: "#10b981" },
  { label: "紫罗兰", value: "#8b5cf6" },
  { label: "玫红", value: "#ec4899" },
  { label: "暖橙", value: "#f97316" },
];

export default function CardTemplateEditor() {
  const { customizations, saveTemplate } = useCustomizations();
  const tmpl = customizations.cardTemplate || DEFAULT_CARD_TEMPLATE;

  const update = (patch: Partial<CardTemplate>) => {
    saveTemplate({ ...tmpl, ...patch });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-primary">卡片模板</h3>
      <p className="text-xs text-muted-foreground">
        自定义论文卡片、失败案例卡片的显示样式，影响发现页和知识库的浏览体验。
      </p>

      {/* Density */}
      <div>
        <label className="text-sm font-medium text-primary flex items-center gap-1.5 mb-2">
          <LayoutGrid className="w-3.5 h-3.5" />
          密度
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ density: opt.value })}
              className={`p-3 rounded-lg border text-left transition-colors ${
                tmpl.density === opt.value
                  ? "border-accent bg-accent/5 text-primary"
                  : "border-border text-muted-foreground hover:border-accent/30"
              }`}
            >
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="text-sm font-medium text-primary flex items-center gap-1.5 mb-2">
          <Type className="w-3.5 h-3.5" />
          字号
        </label>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ fontSize: opt.value })}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                tmpl.fontSize === opt.value
                  ? "border-accent bg-accent/5 text-primary"
                  : "border-border text-muted-foreground hover:border-accent/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <label className="text-sm font-medium text-primary flex items-center gap-1.5 mb-2">
          <Palette className="w-3.5 h-3.5" />
          强调色
        </label>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ accentColor: c.value })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                tmpl.accentColor === c.value ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Visibility toggles */}
      <div>
        <label className="text-sm font-medium text-primary flex items-center gap-1.5 mb-2">
          <Eye className="w-3.5 h-3.5" />
          显示选项
        </label>
        <div className="space-y-2">
          {[
            { key: "showTags" as const, label: "显示标签" },
            { key: "showAuthors" as const, label: "显示作者" },
            { key: "showJournal" as const, label: "显示期刊" },
            { key: "showAbstract" as const, label: "显示摘要" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={(tmpl[key] as boolean) ?? true}
                onChange={(e) => update({ [key]: e.target.checked })}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              <span className="text-muted-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="pt-4 border-t border-border">
        <label className="text-sm font-medium text-primary block mb-3">预览</label>
        <div
          className={`rounded-lg border p-4 transition-all ${
            tmpl.density === "compact" ? "space-y-1 text-xs" : tmpl.density === "spacious" ? "space-y-3 text-base" : "space-y-2 text-sm"
          }`}
          style={{ borderColor: tmpl.accentColor + "40" }}
        >
          <h4 className={`font-semibold text-primary ${tmpl.fontSize === "large" ? "text-lg" : tmpl.fontSize === "small" ? "text-sm" : "text-base"}`}>
            MoS₂纳米片的缺陷工程调控及光催化性能研究
          </h4>
          {tmpl.showAuthors && (
            <p className="text-muted-foreground">陈远, 张明远, 李华</p>
          )}
          {tmpl.showJournal && (
            <p className="text-muted-foreground">Applied Catalysis B: Environmental, 2024</p>
          )}
          {tmpl.showTags && (
            <div className="flex gap-1 flex-wrap">
              {["MoS₂", "缺陷工程", "光催化"].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: tmpl.accentColor + "20", color: tmpl.accentColor, borderColor: tmpl.accentColor + "40", borderWidth: 1 }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {tmpl.showAbstract && (
            <p className="text-muted-foreground leading-relaxed">
              系统探究MoS₂纳米片在不同缺陷浓度下的光催化性能变化。发现缺陷浓度与活性之间为非线性关系...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
