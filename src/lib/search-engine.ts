// 研脉 · 搜索引擎
// TF-IDF 风格全文检索（中文 bigram + 英文分词）

import papers from "@/data/papers.json";
import annotations from "@/data/annotations.json";

export interface SearchablePaper {
  id: number;
  title: string;
  authors: string;
  journal: string;
  doi: string;
  abstract: string;
  tags: string[];
  sections: string[][];
  year?: number;
  annotationCount: number;
}

export interface SearchFilters {
  tags: string[];
  journal?: string;
  yearMin?: number;
  yearMax?: number;
  sortBy: "relevance" | "newest" | "most_annotated";
}

// Preprocess: extract year from journal string
function extractYear(journal: string): number | undefined {
  const m = journal.match(/(\d{4})/);
  return m ? parseInt(m[1]) : undefined;
}

// Build searchable paper index
function buildIndex(): SearchablePaper[] {
  const annCountMap = new Map<number, number>();
  (annotations as any[]).forEach((a) => {
    annCountMap.set(a.paper_id, (annCountMap.get(a.paper_id) || 0) + 1);
  });

  return (papers as any[]).map((p) => ({
    id: p.id,
    title: p.title,
    authors: p.authors,
    journal: p.journal,
    doi: p.doi,
    abstract: p.abstract,
    tags: p.tags,
    sections: p.sections,
    year: extractYear(p.journal),
    annotationCount: annCountMap.get(p.id) || 0,
  }));
}

// Chinese bigram tokenization
function cnBigrams(text: string): string[] {
  const cn = text.replace(/[^一-鿿]/g, "");
  const result: string[] = [];
  for (let i = 0; i < cn.length - 1; i++) {
    result.push(cn.slice(i, i + 2));
  }
  return result;
}

// English word tokenization
function enWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["the", "and", "for", "with", "that", "this", "from", "are", "was", "has", "its"].includes(w));
}

// TF-IDF search
export function searchPapers(query: string, filters: SearchFilters): SearchablePaper[] {
  const allPapers = buildIndex();

  if (!query.trim()) {
    // No query: return all papers with filters
    return applyFiltersAndSort(allPapers, filters);
  }

  const tokens = [...cnBigrams(query), ...enWords(query), query.toLowerCase()];
  if (tokens.length === 0) return applyFiltersAndSort(allPapers, filters);

  // Build document vectors
  const docTexts = allPapers.map((p) => {
    const sectionText = p.sections.map((s) => s[0] + " " + s[1].replace(/<[^>]+>/g, "")).join(" ");
    return `${p.title} ${p.title} ${p.title} ${p.abstract} ${p.tags.join(" ")} ${sectionText}`;
  });

  const N = allPapers.length;
  const df: Map<string, number> = new Map();
  const docVecs: Map<string, number>[] = [];

  for (const text of docTexts) {
    const tf: Map<string, number> = new Map();
    const words = [...cnBigrams(text), ...enWords(text)];
    for (const w of words) {
      tf.set(w, (tf.get(w) || 0) + 1);
    }
    // Normalize TF
    const maxTf = Math.max(...tf.values(), 1);
    for (const [w, c] of tf) {
      tf.set(w, c / maxTf);
      if (c / maxTf > 0) df.set(w, (df.get(w) || 0) + 1);
    }
    docVecs.push(tf);
  }

  // Compute IDF
  const idf: Map<string, number> = new Map();
  for (const [w, d] of df) {
    idf.set(w, Math.log((N + 1) / (d + 1)) + 1);
  }

  // Score each document
  const scored = allPapers.map((paper, i) => {
    let score = 0;
    for (const token of tokens) {
      const tf = docVecs[i].get(token) || 0;
      const idfVal = idf.get(token) || 0;
      score += tf * idfVal;
    }
    // Boost: title match
    const titleLower = paper.title.toLowerCase();
    if (tokens.some((t) => titleLower.includes(t))) score *= 1.5;
    // Boost: tag match
    const tagLower = paper.tags.join(" ").toLowerCase();
    if (tokens.some((t) => tagLower.includes(t))) score *= 1.3;

    return { paper, score };
  });

  const matched = scored
    .filter((s) => s.score > 0 || query.length <= 1)
    .sort((a, b) => b.score - a.score);

  let result = matched.map((m) => m.paper);
  result = applyFiltersAndSort(result, filters);
  return result;
}

function applyFiltersAndSort(papers: SearchablePaper[], filters: SearchFilters): SearchablePaper[] {
  let result = papers.filter((p) => {
    // Tag filter
    if (filters.tags.length > 0) {
      const hasAll = filters.tags.every((t) => p.tags.includes(t));
      if (!hasAll) return false;
    }
    // Journal filter
    if (filters.journal && !p.journal.toLowerCase().includes(filters.journal.toLowerCase())) {
      return false;
    }
    // Year filter
    if (filters.yearMin && p.year && p.year < filters.yearMin) return false;
    if (filters.yearMax && p.year && p.year > filters.yearMax) return false;
    return true;
  });

  // Sort
  switch (filters.sortBy) {
    case "newest":
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
      break;
    case "most_annotated":
      result.sort((a, b) => b.annotationCount - a.annotationCount);
      break;
    default:
      break; // relevance order preserved
  }

  return result;
}

// Get all unique tags from all papers
export function getAllTags(): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  (papers as any[]).forEach((p) => {
    p.tags.forEach((t: string) => map.set(t, (map.get(t) || 0) + 1));
  });
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Get unique journals
export function getAllJournals(): string[] {
  const set = new Set<string>();
  (papers as any[]).forEach((p) => {
    const jName = p.journal.split(",")[0].trim();
    set.add(jName);
  });
  return [...set].sort();
}

// Similar papers by Jaccard tag overlap
export function getSimilarPapers(paperId: number, topN = 3): SearchablePaper[] {
  const allPapers = buildIndex();
  const target = allPapers.find((p) => p.id === paperId);
  if (!target) return [];

  const others = allPapers.filter((p) => p.id !== paperId);
  const scored = others.map((p) => {
    const setA = new Set(target.tags);
    const setB = new Set(p.tags);
    const intersection = [...setA].filter((t) => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return { paper: p, score: union > 0 ? intersection / union : 0 };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.paper);
}
