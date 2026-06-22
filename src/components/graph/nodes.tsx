"use client";

import { memo } from "react";
import type { NodeProps } from "@reactflow/core";
import { Handle, Position } from "@reactflow/core";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileText, AlertTriangle, FlaskConical, Lightbulb, Layers } from "lucide-react";

type NodeData = {
  label: string;
  title: string;
  subtitle: string;
  tags: string[];
  cardType: string;
  linkedPaperId?: number;
  linkedFailureId?: number;
};

const iconByType: Record<string, React.ReactNode> = {
  topic: <Layers className="w-3.5 h-3.5" />,
  methodology: <FlaskConical className="w-3.5 h-3.5" />,
  failure: <AlertTriangle className="w-3.5 h-3.5" />,
  mentor_insight: <Lightbulb className="w-3.5 h-3.5" />,
};

const borderColors: Record<string, string> = {
  topic: "border-slate-200 dark:border-slate-700",
  methodology: "border-emerald-200/60 dark:border-emerald-800/40",
  failure: "border-amber-200/60 dark:border-amber-800/40",
  mentor_insight: "border-violet-200/60 dark:border-violet-800/40",
  paper: "border-blue-200/60 dark:border-blue-800/40",
};

const bgColors: Record<string, string> = {
  topic: "bg-slate-50/80 dark:bg-slate-900/30",
  methodology: "bg-emerald-50/50 dark:bg-emerald-950/20",
  failure: "bg-amber-50/50 dark:bg-amber-950/20",
  mentor_insight: "bg-violet-50/50 dark:bg-violet-950/20",
  paper: "bg-blue-50/50 dark:bg-blue-950/20",
};

const dotColors: Record<string, string> = {
  topic: "bg-slate-400",
  methodology: "bg-emerald-500",
  failure: "bg-amber-500",
  mentor_insight: "bg-violet-500",
  paper: "bg-blue-500",
};

function PaperNodeImpl({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <motion.div
      whileHover={{ boxShadow: "0 0 20px rgba(59,130,246,0.15)", y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[200px] rounded-xl border bg-card p-3 shadow-sm",
        borderColors.paper,
        bgColors.paper
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="flex items-start gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          Paper
        </span>
      </div>
      <p className="text-xs font-semibold text-primary line-clamp-2 mb-1">{d.title}</p>
      <p className="text-[10px] text-muted-foreground truncate">{d.subtitle}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{d.tags.slice(0, 3).join(" · ")}</span>
        {d.linkedPaperId && (
          <span className="text-[10px] font-medium text-blue-600">#{d.linkedPaperId}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </motion.div>
  );
}

function FailureNodeImpl({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <motion.div
      whileHover={{ boxShadow: "0 0 20px rgba(245,158,11,0.12)", y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[180px] rounded-xl border bg-card p-3 shadow-sm",
        borderColors.failure,
        bgColors.failure
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">Failure</span>
      </div>
      <p className="text-xs font-semibold text-primary line-clamp-2 mb-1">{d.title}</p>
      <p className="text-[10px] text-muted-foreground truncate">{d.subtitle}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
    </motion.div>
  );
}

function MethodologyNodeImpl({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <motion.div
      whileHover={{ boxShadow: "0 0 20px rgba(16,185,129,0.12)", y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[140px] rounded-xl border bg-card p-2.5 shadow-sm text-center",
        borderColors.methodology,
        bgColors.methodology
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
      <div className="flex items-center justify-center gap-1 mb-1">
        <FlaskConical className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Method</span>
      </div>
      <p className="text-xs font-semibold text-primary">{d.title}</p>
      <p className="text-[10px] text-muted-foreground">{d.subtitle}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
    </motion.div>
  );
}

function MentorInsightNodeImpl({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <motion.div
      whileHover={{ boxShadow: "0 0 20px rgba(139,92,246,0.12)", y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[180px] rounded-xl border bg-card p-3 shadow-sm",
        borderColors.mentor_insight,
        bgColors.mentor_insight
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400" />
      <div className="flex items-center gap-2 mb-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-violet-500" />
        <span className="text-[10px] font-medium text-violet-700 dark:text-violet-300">Insight</span>
      </div>
      <p className="text-xs text-primary line-clamp-2 mb-1">{d.title}</p>
      <p className="text-[10px] text-muted-foreground">{d.subtitle}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-400" />
    </motion.div>
  );
}

function TopicNodeImpl({ data }: NodeProps) {
  const d = data as unknown as NodeData;
  return (
    <motion.div
      whileHover={{ boxShadow: "0 0 24px rgba(100,116,139,0.12)", y: -1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-[200px] rounded-xl border bg-card p-3.5 shadow-sm",
        borderColors.topic,
        bgColors.topic
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Topic</span>
        </div>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors.topic}`} />
      </div>
      <p className="text-sm font-semibold text-primary text-center">{d.title}</p>
      <p className="text-[10px] text-muted-foreground text-center mt-0.5">{d.subtitle}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </motion.div>
  );
}

export const PaperNode = memo(PaperNodeImpl);
export const FailureNode = memo(FailureNodeImpl);
export const MethodologyNode = memo(MethodologyNodeImpl);
export const MentorInsightNode = memo(MentorInsightNodeImpl);
export const TopicNode = memo(TopicNodeImpl);

export const nodeTypes = {
  "paper-node": PaperNode,
  "failure-node": FailureNode,
  "methodology-node": MethodologyNode,
  "mentor-insight-node": MentorInsightNode,
  "topic-node": TopicNode,
};
