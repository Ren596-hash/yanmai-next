"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Link2,
  Sparkles,
  Zap,
  FileText,
} from "lucide-react";

const cardEntry = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

// ── InsightCard ──

interface InsightCardProps {
  icon?: React.ReactNode;
  title: string;
  body: string;
  confidence?: "high" | "medium" | "low";
}

const confidenceDots: Record<string, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-400",
};

export function InsightCard({ icon, title, body, confidence }: InsightCardProps) {
  return (
    <motion.div
      {...cardEntry}
      className="p-3 rounded-lg bg-muted/40 border-l-2 border-l-accent"
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon || <Lightbulb className="w-4 h-4 text-blue-500" />}
        <h4 className="text-xs font-semibold text-primary">{title}</h4>
        {confidence && (
          <span className={cn("w-2 h-2 rounded-full shrink-0 ml-auto", confidenceDots[confidence])} />
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}

// ── SuggestionCard ──

interface SuggestionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function SuggestionCard({ title, description, actionLabel, onAction }: SuggestionCardProps) {
  return (
    <motion.div
      {...cardEntry}
      className="p-3 rounded-lg bg-accent/5 border border-accent/20"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Zap className="w-3.5 h-3.5 text-accent" />
        <h4 className="text-xs font-semibold text-primary">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <button
        onClick={onAction}
        className="w-full text-xs font-medium text-accent hover:text-white bg-accent/10 hover:bg-accent py-1.5 rounded-md transition-colors inline-flex items-center justify-center gap-1"
      >
        {actionLabel} <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ── ReferenceCard ──

interface ReferenceCardProps {
  type: "paper" | "failure" | "annotation";
  title: string;
  subtitle: string;
  onClick?: () => void;
}

const refIcons: Record<string, React.ReactNode> = {
  paper: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
  failure: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  annotation: <FileText className="w-3.5 h-3.5 text-violet-500" />,
};

const refBgs: Record<string, string> = {
  paper: "bg-blue-50 dark:bg-blue-950/20",
  failure: "bg-amber-50 dark:bg-amber-950/20",
  annotation: "bg-violet-50 dark:bg-violet-950/20",
};

export function ReferenceCard({ type, title, subtitle, onClick }: ReferenceCardProps) {
  return (
    <motion.button
      {...cardEntry}
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-lg hover:bg-muted/60 transition-colors flex items-start gap-2.5",
        refBgs[type]
      )}
    >
      <div className="w-7 h-7 rounded-md bg-background flex items-center justify-center shrink-0 mt-0.5">
        {refIcons[type]}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary line-clamp-2">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </motion.button>
  );
}

// ── RiskCard ──

interface RiskCardProps {
  title: string;
  risk: string;
  suggestion: string;
}

export function RiskCard({ title, risk, suggestion }: RiskCardProps) {
  return (
    <motion.div
      {...cardEntry}
      className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200">{title}</h4>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">{risk}</p>
      <p className="text-[10px] text-muted-foreground">{suggestion}</p>
    </motion.div>
  );
}

// ── SemanticLinkCard ──

interface SemanticLinkCardProps {
  from: { label: string; type: string };
  to: { label: string; type: string };
  relationship: string;
}

export function SemanticLinkCard({ from, to, relationship }: SemanticLinkCardProps) {
  return (
    <motion.div
      {...cardEntry}
      className="p-3 rounded-lg bg-muted/30 border border-border/60"
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary truncate max-w-[90px]">
          {from.label}
        </span>
        <div className="flex-1 flex flex-col items-center">
          <Link2 className="w-3 h-3 text-muted-foreground rotate-90" />
          <span className="text-[9px] text-muted-foreground text-center">{relationship}</span>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent truncate max-w-[90px]">
          {to.label}
        </span>
      </div>
    </motion.div>
  );
}

// ── AIPanelSection ──

interface AIPanelSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function AIPanelSection({ title, icon, children }: AIPanelSectionProps) {
  return (
    <motion.div {...cardEntry} className="space-y-2">
      <div className="flex items-center gap-1.5">
        {icon || <Sparkles className="w-3.5 h-3.5 text-accent" />}
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
      </div>
      {children}
    </motion.div>
  );
}
