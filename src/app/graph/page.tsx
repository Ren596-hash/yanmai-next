"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
} from "@reactflow/core";
import { Background } from "@reactflow/background";
import { MiniMap } from "@reactflow/minimap";
import "@reactflow/core/dist/style.css";
import "@reactflow/minimap/dist/style.css";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";
import { buildGraphData, type GraphNode } from "@/lib/knowledge-utils";
import { nodeTypes } from "@/components/graph/nodes";
import { useAppShell } from "@/components/layout/AppShell";
import {
  InsightCard,
  ReferenceCard,
  RiskCard,
  SemanticLinkCard,
  AIPanelSection,
} from "@/components/ai/AIPanelCards";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  GitBranch,
  Sparkles,
  BookOpen,
  Link2,
  AlertTriangle,
} from "lucide-react";

function applyLayout(
  rawNodes: GraphNode[],
  rawEdges: { id: string; source: string; target: string; label?: string; type: string }[],
): { nodes: Node[]; edges: Edge[] } {
  // d3-force simulation
  const simNodes: d3.SimulationNodeDatum[] = rawNodes.map((n) => ({
    id: n.id,
    ...n.position,
  }));

  const simLinks: d3.SimulationLinkDatum<d3.SimulationNodeDatum>[] = rawEdges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink(simLinks)
        .id((d: any) => d.id)
        .distance(150)
    )
    .force("charge", forceManyBody().strength(-400))
    .force("center", forceCenter(0, 0))
    .force("collision", forceCollide(80))
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  const positionedNodes: Node[] = rawNodes.map((n, i) => {
    const simNode = simNodes[i];
    return {
      id: n.id,
      type: n.type,
      position: { x: (simNode.x || 0) + 600, y: (simNode.y || 0) + 400 },
      data: n.data,
    };
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: {
      stroke:
        e.type === "paper_annotation"
          ? "#93c5fd"
          : e.type === "cross_discipline"
            ? "#c4b5fd"
            : e.type === "method_link"
              ? "#6ee7b7"
              : "rgba(148,163,184,0.35)",
      strokeWidth: e.type === "paper_annotation" ? 1.5 : 1,
      strokeDasharray: e.type === "cross_discipline" ? "4 4" : e.type === "method_link" ? "2 2" : "none",
    },
    animated: e.type === "tag_overlap",
  }));

  return { nodes: positionedNodes, edges };
}

function GraphPageInner() {
  const router = useRouter();
  const { setAIPanelOpen, setAIPanelContent } = useAppShell();
  const reactFlowInstance = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hideTopics, setHideTopics] = useState(false);
  const [layoutKey, setLayoutKey] = useState(0);

  const rawData = useMemo(() => buildGraphData(), []);
  const { nodes: rawNodes, edges: rawEdges } = rawData;

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => applyLayout(rawNodes, rawEdges),
    [rawNodes, rawEdges, layoutKey]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutKey]);

  // Filter topic nodes
  const visibleNodes = useMemo(
    () => (hideTopics ? nodes.filter((n) => n.type !== "topic-node") : nodes),
    [nodes, hideTopics]
  );

  // Semantic highlight
  useEffect(() => {
    if (!selectedNodeId) {
      setNodes((nds) =>
        nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } }))
      );
      setEdges((eds) =>
        eds.map((e) => ({ ...e, style: { ...e.style, opacity: 1 } }))
      );
      return;
    }

    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(selectedNodeId);
    layoutedEdges.forEach((e) => {
      if (e.source === selectedNodeId) connectedNodeIds.add(e.target);
      if (e.target === selectedNodeId) connectedNodeIds.add(e.source);
    });

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: connectedNodeIds.has(n.id) ? 1 : 0.25,
          transition: "opacity 0.3s ease",
        },
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: e.source === selectedNodeId || e.target === selectedNodeId ? 1 : 0.08,
          transition: "opacity 0.3s ease",
        },
      }))
    );
  }, [selectedNodeId]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      const data = node.data as any;
      const type = node.type || "";

      const connectedNodeIds = new Set<string>();
      layoutedEdges.forEach((e) => {
        if (e.source === node.id) connectedNodeIds.add(e.target);
        if (e.target === node.id) connectedNodeIds.add(e.source);
      });

      const relatedNodes = rawNodes.filter(
        (n) => connectedNodeIds.has(n.id) && n.id !== node.id
      );

      const relatedFailures = relatedNodes.filter((n) => n.type === "failure-node");
      const relatedPapers = relatedNodes.filter((n) => n.type === "paper-node");
      const relatedInsights = relatedNodes.filter((n) => n.type === "mentor-insight-node");

      setAIPanelContent(
        <div className="space-y-3">
          <AIPanelSection title="节点详情" icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}>
            <InsightCard
              title={data.title || data.label}
              body={data.subtitle || ""}
            />
          </AIPanelSection>

          {data.tags && data.tags.length > 0 && (
            <AIPanelSection title="Tags" icon={<GitBranch className="w-3.5 h-3.5 text-accent" />}>
              <div className="flex flex-wrap gap-1">
                {data.tags.slice(0, 6).map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </AIPanelSection>
          )}

          {relatedPapers.length > 0 && (
            <AIPanelSection title="相关论文" icon={<BookOpen className="w-3.5 h-3.5 text-blue-500" />}>
              {relatedPapers.slice(0, 3).map((rn) => (
                <ReferenceCard
                  key={rn.id}
                  type="paper"
                  title={rn.data.title}
                  subtitle={rn.data.subtitle}
                  onClick={() => router.push("/reader")}
                />
              ))}
            </AIPanelSection>
          )}

          {relatedFailures.length > 0 && (
            <AIPanelSection title="相关失败案例" icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}>
              {relatedFailures.slice(0, 3).map((rn) => (
                <RiskCard
                  key={rn.id}
                  title={rn.data.title}
                  risk={rn.data.subtitle}
                  suggestion="在开始相关实验前，先回顾此失败案例的教训。"
                />
              ))}
            </AIPanelSection>
          )}

          {relatedInsights.length > 0 && (
            <AIPanelSection title="相关洞见" icon={<Link2 className="w-3.5 h-3.5 text-violet-500" />}>
              {relatedInsights.slice(0, 2).map((rn) => (
                <ReferenceCard
                  key={rn.id}
                  type="annotation"
                  title={rn.data.title}
                  subtitle={rn.data.subtitle}
                />
              ))}
            </AIPanelSection>
          )}

          {relatedNodes.length >= 2 && (
            <SemanticLinkCard
              from={{ label: node.id.replace(/-.*/, ""), type: type }}
              to={{ label: relatedNodes[0].id.replace(/-.*/, ""), type: relatedNodes[0].type || "unknown" }}
              relationship={`${connectedNodeIds.size - 1} 条连接`}
            />
          )}
        </div>
      );
      setAIPanelOpen(true);
    },
    [rawNodes, layoutedEdges]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      reactFlowInstance.fitView({ nodes: [{ id: node.id }], duration: 300 });
    },
    [reactFlowInstance]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-card/80 backdrop-blur-sm shrink-0"
      >
        <GitBranch className="w-4 h-4 text-accent" />
        <h1 className="text-sm font-semibold text-primary mr-4">科研图谱</h1>

        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          <button
            onClick={() => reactFlowInstance.zoomIn()}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-background transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => reactFlowInstance.zoomOut()}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-background transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => reactFlowInstance.fitView({ duration: 300 })}
            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-background transition-colors"
            title="适应视图"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-border/60" />

        <button
          onClick={() => setLayoutKey((k) => k + 1)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1"
        >
          重新布局
        </button>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={hideTopics}
            onChange={(e) => setHideTopics(e.target.checked)}
            className="w-3 h-3 rounded accent-accent"
          />
          隐藏主题
        </label>

        <span className="text-xs text-muted-foreground ml-auto">
          {rawNodes.length} 节点 · {rawEdges.length} 边
        </span>
      </motion.div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, duration: 300 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              style: { stroke: "rgba(148,163,184,0.2)", strokeWidth: 1 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(148,163,184,0.15)" gap={24} />
            <MiniMap
              nodeColor={(node: Node) => {
                switch (node.type) {
                  case "paper-node": return "#3b82f6";
                  case "methodology-node": return "#10b981";
                  case "failure-node": return "#f59e0b";
                  case "mentor-insight-node": return "#8b5cf6";
                  case "topic-node": return "#6b7280";
                  default: return "#9ca3af";
                }
              }}
              style={{ backgroundColor: "var(--card, #fff)", border: "1px solid var(--border, #e5e7eb)" }}
              maskColor="rgba(0,0,0,0.08)"
            />
          </ReactFlow>
      </div>

      {/* Empty state hint */}
      {selectedNodeId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-2 shadow-lg text-xs text-muted-foreground"
        >
          点击空白取消选择 · 双击节点聚焦
        </motion.div>
      )}
    </div>
  );
}

export default function GraphPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">加载图谱中...</div>
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <GraphPageInner />
    </ReactFlowProvider>
  );
}
