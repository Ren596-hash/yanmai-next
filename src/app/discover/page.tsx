"use client";

import { useState, useMemo, useCallback } from "react";
import { searchPapers, getSimilarPapers, type SearchFilters, type SearchablePaper } from "@/lib/search-engine";
import PaperCard from "@/components/discover/PaperCard";
import FilterPanel from "@/components/discover/FilterPanel";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    sortBy: "relevance",
  });
  const [suggestions, setSuggestions] = useState<SearchablePaper[]>([]);

  const results = useMemo(() => searchPapers(query, filters), [query, filters]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    // Generate suggestions for paper titles
    if (value.trim().length > 0) {
      const all = searchPapers("", { tags: [], sortBy: "relevance" });
      const lower = value.toLowerCase();
      setSuggestions(
        all.filter(
          (p) =>
            p.title.toLowerCase().includes(lower) ||
            p.tags.some((t) => t.toLowerCase().includes(lower)) ||
            p.authors.toLowerCase().includes(lower)
        ).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  }, []);

  const handleSelectSuggestion = (paper: SearchablePaper) => {
    setQuery(paper.title);
    setSuggestions([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-2">🔍 论文发现</h2>
        <p className="text-sm text-muted-foreground">
          搜索、筛选、发现你感兴趣的研究论文
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="flex items-center bg-white border-2 border-border rounded-xl px-4 py-3 focus-within:border-[#c9a96e] transition-colors">
          <span className="text-lg mr-2">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="搜索论文标题、作者、关键词..."
            className="flex-1 text-sm bg-transparent outline-none text-[#1a3a5c] placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSuggestions([]); }}
              className="text-muted-foreground hover:text-[#1a3a5c] ml-2"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectSuggestion(p)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
              >
                <p className="text-sm font-medium text-[#1a3a5c] line-clamp-1">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.authors} · {p.journal.split(",")[0]}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content: filter + results */}
      <div className="flex gap-6">
        {/* Left sidebar */}
        <aside className="w-64 shrink-0 hidden md:block">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          {/* Mobile filter toggle */}
          <div className="md:hidden mb-4">
            <details className="bg-white rounded-xl border border-border">
              <summary className="px-4 py-2 text-sm font-medium text-[#1a3a5c] cursor-pointer">
                ⚙️ 筛选条件 {filters.tags.length > 0 && `(${filters.tags.length}标签)`}
              </summary>
              <div className="p-2">
                <FilterPanel filters={filters} onFiltersChange={setFilters} />
              </div>
            </details>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground mb-4">
            找到 {results.length} 篇论文
            {filters.tags.length > 0 && ` · 筛选: ${filters.tags.join(", ")}`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-border">
              <span className="text-4xl">📭</span>
              <p className="mt-3 text-sm text-muted-foreground">没有找到匹配的论文</p>
              <p className="text-xs text-muted-foreground mt-1">试试调整搜索词或筛选条件</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          )}

          {/* Empty state - no query, no filters */}
          {!query && results.length > 0 && filters.tags.length === 0 && (
            <div className="mt-8 bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-xl p-4 text-center text-xs text-muted-foreground">
              💡 提示：使用标签筛选可以快速找到特定方向的论文 · 搜索栏支持中英文混合搜索
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
