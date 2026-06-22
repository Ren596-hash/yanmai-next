"use client";

import { useState } from "react";
import { useCustomizations } from "./UserCustomizationsProvider";
import type { CustomTag } from "@/lib/user-customizations";
import { TAG_COLOR_PRESETS } from "@/lib/user-customizations";
import { X, Plus, Palette } from "lucide-react";

export default function TagManager() {
  const { customizations, addTag, updateTag, deleteTag } = useCustomizations();
  const [editing, setEditing] = useState<CustomTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#3b82f6", description: "" });

  const resetForm = () => {
    setForm({ name: "", color: "#3b82f6", description: "" });
    setEditing(null);
    setCreating(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await addTag({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      color: form.color,
      description: form.description.trim(),
      createdAt: new Date().toISOString(),
    });
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editing || !form.name.trim()) return;
    await updateTag(editing.id, {
      name: form.name.trim(),
      color: form.color,
      description: form.description.trim(),
    });
    resetForm();
  };

  const startEdit = (tag: CustomTag) => {
    setEditing(tag);
    setForm({ name: tag.name, color: tag.color, description: tag.description });
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">自定义标签</h3>
        <button
          onClick={() => { resetForm(); setCreating(true); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新建标签
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        自定义标签用于标记论文、批注和失败案例，方便按自己的分类体系组织知识。
      </p>

      {/* Tag list */}
      <div className="space-y-2">
        {customizations.tags.length === 0 && !creating && (
          <p className="text-xs text-muted-foreground text-center py-6">暂无自定义标签，点击上方按钮创建</p>
        )}

        {customizations.tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent/30 transition-colors"
          >
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{tag.name}</p>
              {tag.description && (
                <p className="text-xs text-muted-foreground truncate">{tag.description}</p>
              )}
            </div>
            <button
              onClick={() => startEdit(tag)}
              className="text-xs text-muted-foreground hover:text-accent transition-colors px-2 py-1"
            >
              编辑
            </button>
            <button
              onClick={() => deleteTag(tag.id)}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <div className="p-4 rounded-lg border border-accent/50 bg-accent/5 space-y-3">
          <h4 className="text-sm font-medium text-primary">
            {creating ? "新建标签" : "编辑标签"}
          </h4>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">标签名</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：重点关注、待复现、方法论经典"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-card"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              <Palette className="w-3 h-3 inline mr-1" />
              颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    form.color === c.value ? "border-primary scale-110 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">说明（可选）</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="简短描述此标签的用途"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 bg-card"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={creating ? handleCreate : handleUpdate}
              disabled={!form.name.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "创建" : "保存"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
