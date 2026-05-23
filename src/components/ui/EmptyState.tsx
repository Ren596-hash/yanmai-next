"use client";

import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-medium text-[#1a3a5c] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mb-4 max-w-xs">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block px-5 py-2 bg-[#1a3a5c] text-white rounded-lg text-xs hover:bg-[#1a3a5c]/90 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
