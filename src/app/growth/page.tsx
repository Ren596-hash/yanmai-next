"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

// 模拟两周阅读数据
function generateHeatmapData() {
  const data: { date: string; count: number; sections: number }[] = [];
  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const rand = Math.random();
    data.push({
      date: dateStr,
      count: rand > 0.45 ? Math.floor(Math.random() * 4) + 1 : 0,
      sections: rand > 0.45 ? Math.floor(Math.random() * 6) + 1 : 0,
    });
  }
  return data;
}

// 模拟思维深度数据（8周）
const THINK_DEPTH_DATA = Array.from({ length: 8 }, (_, i) => ({
  week: i + 1,
  label: `第${i + 1}周`,
  avgWords: Math.round(20 + i * 12 + Math.random() * 25),
  count: Math.max(1, Math.floor(i * 0.8 + Math.random() * 3)),
}));

// 里程碑
const MILESTONES = [
  { icon: "📖", text: "首次阅读论文", date: "2026-05-08", detail: "MoS₂纳米片的缺陷工程调控" },
  { icon: "💬", text: "首次添加批注", date: "2026-05-10", detail: "在缺陷工程论文上标记了关键段落" },
  { icon: "💡", text: "首次思维引导", date: "2026-05-12", detail: "提交了第1次think-answer" },
  { icon: "⚠️", text: "首次查看失败案例", date: "2026-05-15", detail: "避坑顾问-退火相变案例" },
  { icon: "⚔️", text: "首次思维挑战", date: "2026-05-18", detail: "完成3轮学术辩论" },
  { icon: "🧪", text: "完成新生入组", date: "2026-05-20", detail: "3周学习路径已生成" },
];

// 简化的个人知识图谱数据
const PERSONAL_GRAPH = {
  nodes: [
    { id: "me", type: "self", label: "我", r: 16 },
    { id: "p1", type: "paper", label: "MoS₂缺陷工程", read: true },
    { id: "p2", type: "paper", label: "Cu₂O/TiO₂异质结", read: true },
    { id: "p3", type: "paper", label: "Fe-N-C ORR", read: true },
    { id: "p5", type: "paper", label: "ZnO缺陷工程", read: false },
    { id: "p8", type: "paper", label: "Pt/CeO₂ WGS", read: false },
    { id: "f1", type: "failure", label: "MoS₂相变" },
    { id: "f2", type: "failure", label: "Cu₂O氧化" },
  ],
  links: [
    { source: "me", target: "p1" },
    { source: "me", target: "p2" },
    { source: "me", target: "p3" },
    { source: "me", target: "f1" },
    { source: "p1", target: "f1" },
    { source: "p2", target: "f2" },
  ],
};

function ReadingHeatmap() {
  const [data] = useState(() => generateHeatmapData());

  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: typeof data = [];
  data.forEach((d) => {
    const day = new Date(d.date).getDay();
    currentWeek.push(d);
    if (day === 6 || d === data[data.length - 1]) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const colorScale = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-400";
    if (count === 3) return "bg-green-500";
    return "bg-green-600";
  };

  const dayLabels = ["", "一", "", "三", "", "五", ""];

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">📅 阅读日历</h4>
      <div className="flex gap-1 overflow-x-auto">
        {dayLabels.map((l, i) => (
          <div key={i} className="text-[10px] text-muted-foreground w-4 text-center shrink-0">
            {l}
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => {
              const d = week[di];
              return (
                <div
                  key={di}
                  className={`w-4 h-4 rounded-sm ${d ? colorScale(d.count) : "bg-transparent"} shrink-0`}
                  title={d ? `${d.date}: ${d.count}次阅读` : ""}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-muted" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <div className="w-3 h-3 rounded-sm bg-green-600" />
        <span>多</span>
      </div>
    </div>
  );
}

function ThinkDepthChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = 160;
    const margin = { top: 15, right: 20, bottom: 25, left: 35 };

    svg.selectAll("*").remove();

    const x = d3
      .scaleBand()
      .domain(THINK_DEPTH_DATA.map((d) => d.label))
      .range([margin.left, w - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(THINK_DEPTH_DATA, (d) => d.avgWords)! + 20])
      .range([h - margin.bottom, margin.top]);

    const line = d3
      .line<(typeof THINK_DEPTH_DATA)[0]>()
      .x((d) => x(d.label)! + x.bandwidth() / 2)
      .y((d) => y(d.avgWords));

    svg
      .append("path")
      .datum(THINK_DEPTH_DATA)
      .attr("fill", "none")
      .attr("stroke", "#1a3a5c")
      .attr("stroke-width", 2)
      .attr("stroke-linejoin", "round")
      .attr("d", line);

    svg
      .selectAll("circle")
      .data(THINK_DEPTH_DATA)
      .join("circle")
      .attr("cx", (d) => x(d.label)! + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.avgWords))
      .attr("r", (d) => Math.max(3, d.count * 2))
      .attr("fill", "#c9a96e")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    svg
      .append("g")
      .attr("transform", `translate(0,${h - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll("text")
      .attr("font-size", "9");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(0))
      .selectAll("text")
      .attr("font-size", "9");
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">📈 思维深度曲线</h4>
      <p className="text-[10px] text-muted-foreground mb-2">
        每周think-answer平均字数（圆大小=思考次数）
      </p>
      <svg ref={svgRef} width="100%" height="160" />
    </div>
  );
}

function Milestones() {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">🏆 思维里程碑</h4>
      <div className="space-y-3">
        {MILESTONES.map((m, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <span className="text-lg mt-0.5">{m.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-[#1a3a5c] text-xs">{m.text}</p>
              <p className="text-xs text-muted-foreground">{m.detail}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {m.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalKnowledgeMap() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = 280;
    svg.selectAll("*").remove();

    const colorMap: Record<string, string> = {
      self: "#1a3a5c",
      paper: "#3b82f6",
      failure: "#ef4444",
    };

    const nodes = PERSONAL_GRAPH.nodes.map((d) => ({ ...d }));
    const links = PERSONAL_GRAPH.links.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => (d.source === "me" || d.target === "me" ? 60 : 40))
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(18));

    const g = svg.append("g");

    g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2");

    const node = g
      .append("g")
      .selectAll<SVGCircleElement, any>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.r || (d.type === "paper" ? 9 : 7))
      .attr("fill", (d) => colorMap[d.type] || "#9ca3af")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", (d) => (d.read === false ? 0.4 : 1));

    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 8)
      .attr("dx", 11)
      .attr("dy", 2.5)
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    node.call(
      d3
        .drag<SVGCircleElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any
    );

    simulation.on("tick", () => {
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => { simulation.stop(); };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-1">🗺️ 个人知识地图</h4>
      <p className="text-[10px] text-muted-foreground mb-2">
        深蓝：你 · 蓝：已读论文 · 灰：未读 · 红：关注失败案例
      </p>
      <svg ref={svgRef} width="100%" height="280" />
      <div className="text-[10px] text-muted-foreground mt-1 text-center">
        已读3篇 · 未读2篇 · 关联2个失败案例
      </div>
    </div>
  );
}

export default function GrowthPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-2 text-center">
        🧠 个人思维成长档案
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center">
        你的每一条思考、每一次阅读、每一个批注，都在这里留下痕迹
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReadingHeatmap />
        <ThinkDepthChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalKnowledgeMap />
        <Milestones />
      </div>

      {/* 底部提示 */}
      <div className="mt-8 bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-xl p-4 text-center text-xs text-muted-foreground">
        数据来源：阅读行为追踪 + 批注 + 思考回答 · 数据仅自己可见 · 导师可见统计概览而非具体内容
      </div>
    </div>
  );
}
