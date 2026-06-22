"use client";

import { useState } from "react";
import TagManager from "@/components/settings/TagManager";
import CardTemplateEditor from "@/components/settings/CardTemplateEditor";
import { UserCustomizationsProvider } from "@/components/settings/UserCustomizationsProvider";
import { Settings, Tag, LayoutGrid } from "lucide-react";

const TABS = [
  { id: "tags", label: "标签管理", icon: Tag },
  { id: "template", label: "卡片样式", icon: LayoutGrid },
];

function SettingsContent() {
  const [tab, setTab] = useState("tags");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-primary mb-2 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        自定义设置
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        管理你的自定义标签和知识卡片显示样式。更改自动同步到云端。
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:border-accent"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-card rounded-xl border border-border p-6">
        {tab === "tags" && <TagManager />}
        {tab === "template" && <CardTemplateEditor />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <UserCustomizationsProvider>
      <SettingsContent />
    </UserCustomizationsProvider>
  );
}
