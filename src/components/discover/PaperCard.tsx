"use client";

import Link from "next/link";
import type { SearchablePaper } from "@/lib/search-engine";

interface PaperCardProps {
  paper: SearchablePaper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-accent/50 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link
          href={`/reader?paper=${paper.id}`}
          className="text-sm font-semibold text-primary hover:text-accent transition-colors line-clamp-2 flex-1"
        >
          {paper.title}
        </Link>
        {paper.annotationCount > 0 && (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full shrink-0">
            {paper.annotationCount} 批注
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
        {paper.authors} · {paper.journal.split(",")[0].trim()}{paper.year ? ` (${paper.year})` : ""}
      </p>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {paper.abstract}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {paper.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] bg-muted text-primary px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <Link
          href={`/reader?paper=${paper.id}`}
          className="text-xs text-primary hover:text-accent transition-colors font-medium"
        >
           阅读
        </Link>
        <Link
          href={`/reader?paper=${paper.id}&tab=review`}
          className="text-xs text-primary hover:text-accent transition-colors"
        >
           四维审阅
        </Link>
      </div>
    </div>
  );
}
