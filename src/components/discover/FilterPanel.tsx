"use client";

import { getAllTags, getAllJournals, type SearchFilters } from "@/lib/search-engine";

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

const SORT_OPTIONS = [
  { value: "relevance" as const, label: "相关性" },
  { value: "newest" as const, label: "最新" },
  { value: "most_annotated" as const, label: "最多批注" },
];

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const allTags = getAllTags();
  const journals = getAllJournals();

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: next });
  };

  const clearFilters = () => {
    onFiltersChange({ tags: [], journal: undefined, yearMin: undefined, yearMax: undefined, sortBy: "relevance" });
  };

  const hasFilters = filters.tags.length > 0 || filters.journal || filters.sortBy !== "relevance";

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-5">
      {/* Sort */}
      <div>
        <h4 className="text-xs font-semibold text-[#1a3a5c] mb-2 uppercase tracking-wide">排序</h4>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, sortBy: opt.value })}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.sortBy === opt.value
                  ? "bg-[#1a3a5c] text-white"
                  : "bg-muted text-muted-foreground hover:bg-[#1a3a5c]/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="text-xs font-semibold text-[#1a3a5c] mb-2 uppercase tracking-wide">
          研究标签 ({allTags.length})
        </h4>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {allTags.map(({ tag, count }) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                  active
                    ? "bg-[#c9a96e] text-white"
                    : "bg-muted text-muted-foreground hover:bg-[#c9a96e]/20"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Journal */}
      <div>
        <h4 className="text-xs font-semibold text-[#1a3a5c] mb-2 uppercase tracking-wide">期刊</h4>
        <select
          value={filters.journal || ""}
          onChange={(e) => onFiltersChange({ ...filters, journal: e.target.value || undefined })}
          className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-white text-[#1a3a5c]"
        >
          <option value="">全部期刊</option>
          {journals.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-xs text-[#c9a96e] hover:text-[#1a3a5c] transition-colors py-2"
        >
          清除所有筛选
        </button>
      )}
    </div>
  );
}
