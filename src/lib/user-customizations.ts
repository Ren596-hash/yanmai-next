export interface CustomTag {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface CardTemplate {
  density: "compact" | "normal" | "spacious";
  showTags: boolean;
  showAuthors: boolean;
  showJournal: boolean;
  showAbstract: boolean;
  accentColor: string;
  fontSize: "small" | "medium" | "large";
}

export interface UserCustomizations {
  tags: CustomTag[];
  cardTemplate: CardTemplate;
  updatedAt: string;
}

export const DEFAULT_CARD_TEMPLATE: CardTemplate = {
  density: "normal",
  showTags: true,
  showAuthors: true,
  showJournal: true,
  showAbstract: true,
  accentColor: "#c9a96e",
  fontSize: "medium",
};

export const DEFAULT_CUSTOMIZATIONS: UserCustomizations = {
  tags: [],
  cardTemplate: DEFAULT_CARD_TEMPLATE,
  updatedAt: new Date().toISOString(),
};

export const TAG_COLOR_PRESETS = [
  { label: "学术蓝", value: "#3b82f6" },
  { label: "翠绿", value: "#10b981" },
  { label: "琥珀", value: "#f59e0b" },
  { label: "玫红", value: "#ec4899" },
  { label: "紫罗兰", value: "#8b5cf6" },
  { label: "青蓝", value: "#06b6d4" },
  { label: "暖橙", value: "#f97316" },
  { label: "深红", value: "#dc2626" },
  { label: "靛蓝", value: "#4f46e5" },
  { label: "金色", value: "#c9a96e" },
];
