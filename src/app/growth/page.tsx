"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import Link from "next/link";
import papers from "@/data/papers.json";
import annotations from "@/data/annotations.json";
import { getReadingLog, type ReadingEntry } from "@/lib/storage";

// --- Types ---
interface ReadingDay {
  date: string;
  count: number;
}

interface TopicCount { tag: string; readCount: number; totalCount: number; }

// --- Helper: build reading heatmap from real data ---
function buildReadingDays(entries: ReadingEntry[]): ReadingDay[] {
  const map = new Map<string, number>();
  entries.forEach((e) => {
    const d = new Date(e.timestamp).toISOString().split("T")[0];
    map.set(d, (map.get(d) || 0) + 1);
  });
  // Fill last 84 days
  const result: ReadingDay[] = [];
  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const ds = d.toISOString().split("T")[0];
    result.push({ date: ds, count: map.get(ds) || 0 });
  }
  return result;
}

// --- Helper: compute streak ---
function computeStreak(days: ReadingDay[]): number {
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const sorted = [...days].reverse();
  let checkDate = new Date(today);
  for (const day of sorted) {
    if (day.date === checkDate.toISOString().split("T")[0]) {
      if (day.count > 0) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    } else if (day.date < checkDate.toISOString().split("T")[0] && day.count > 0) {
      break; // gap
    }
  }
  return streak;
}

// --- Helper: topic coverage ---
function buildTopicCoverage(entries: ReadingEntry[]): TopicCount[] {
  const readPaperIds = new Set(entries.map((e) => e.paper_id));
  const allTags = new Set<string>();
  papers.forEach((p) => p.tags.forEach((t: string) => allTags.add(t)));
  const result: TopicCount[] = [];
  allTags.forEach((tag) => {
    const totalPapers = papers.filter((p) => p.tags.includes(tag)).length;
    let readCount = 0;
    papers.filter((p) => p.tags.includes(tag)).forEach((p) => {
      if (readPaperIds.has(p.id)) readCount++;
    });
    result.push({ tag, readCount, totalCount: totalPapers });
  });
  return result.sort((a, b) => b.totalCount - a.totalCount);
}

// --- Helper: annotation stats ---
function buildAnnotationStats() {
  const lensCount: Record<string, number> = {};
  const confCount: Record<string, number> = {};
  annotations.forEach((a: any) => {
    lensCount[a.lens_type] = (lensCount[a.lens_type] || 0) + 1;
    confCount[a.confidence] = (confCount[a.confidence] || 0) + 1;
  });
  return { lensCount, confCount, total: annotations.length };
}

// --- Reading Heatmap Component ---
function ReadingHeatmap({ entries }: { entries: ReadingEntry[] }) {
  const days = buildReadingDays(entries);
  const hasData = entries.length > 0;

  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: typeof days = [];
  days.forEach((d) => {
    currentWeek.push(d);
    if (new Date(d.date).getDay() === 6 || d === days[days.length - 1]) {
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
      {!hasData && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <p className="mb-2">📖 暂无阅读记录</p>
          <Link href="/reader" className="text-[#c9a96e] hover:underline">去读一篇论文 →</Link>
        </div>
      )}
      {hasData && (
        <>
          <div className="flex gap-1 overflow-x-auto">
            {dayLabels.map((l, i) => (
              <div key={i} className="text-[10px] text-muted-foreground w-4 text-center shrink-0">{l}</div>
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
        </>
      )}
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

// --- Reading Stats Component ---
function ReadingStats({ entries }: { entries: ReadingEntry[] }) {
  const readPaperIds = new Set(entries.map((e) => e.paper_id));
  const totalSections = entries.filter((e) => e.action === "view_section").length;
  const totalDwell = entries.reduce((sum, e) => sum + (e.dwell_seconds || 0), 0);
  const streak = computeStreak(buildReadingDays(entries));
  const recentEntries = entries.filter((e) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return e.timestamp > weekAgo;
  });

  const stats = [
    { label: "已读论文", value: readPaperIds.size, unit: "篇", icon: "📄" },
    { label: "阅读章节", value: totalSections, unit: "节", icon: "📑" },
    { label: "阅读时长", value: Math.round(totalDwell / 60), unit: "分钟", icon: "⏱️" },
    { label: "连续打卡", value: streak, unit: "天", icon: "🔥" },
    { label: "本周活跃", value: recentEntries.length, unit: "次", icon: "📊" },
  ];

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">📊 阅读统计</h4>
      {entries.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <p>开始阅读论文后，这里会显示统计数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-lg">{s.icon}</span>
              <p className="text-xl font-bold text-[#1a3a5c]">{s.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{s.unit}</span></p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Topic Coverage Radar Chart ---
function TopicRadar({ entries }: { entries: ReadingEntry[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const topics = buildTopicCoverage(entries);

  useEffect(() => {
    if (!svgRef.current || topics.length === 0) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = 260;
    const margin = 50;
    const radius = Math.min(w, h) / 2 - margin;
    const cx = w / 2;
    const cy = h / 2;
    svg.selectAll("*").remove();

    const topTopics = topics.slice(0, 8);
    const angles = topTopics.map((_, i) => (Math.PI * 2 * i) / topTopics.length - Math.PI / 2);

    const maxVal = d3.max(topTopics, (d) => d.totalCount) || 10;

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

    // Grid circles
    [0.25, 0.5, 0.75, 1].forEach((r) => {
      g.append("circle").attr("r", radius * r).attr("fill", "none").attr("stroke", "#e5e7eb").attr("stroke-width", 0.5);
    });

    // Axes
    angles.forEach((angle) => {
      g.append("line")
        .attr("x2", Math.cos(angle) * radius)
        .attr("y2", Math.sin(angle) * radius)
        .attr("stroke", "#e5e7eb")
        .attr("stroke-width", 0.5);
    });

    // Labels
    angles.forEach((angle, i) => {
      const x = Math.cos(angle) * (radius + 18);
      const y = Math.sin(angle) * (radius + 18);
      g.append("text")
        .attr("x", x).attr("y", y)
        .attr("text-anchor", x > 0 ? "start" : x < 0 ? "end" : "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "9")
        .attr("fill", "#374151")
        .text(`${topTopics[i].tag}(${topTopics[i].readCount}/${topTopics[i].totalCount})`);
    });

    // Read polygon
    const readPoints = angles.map((a, i) => {
      const r = (topTopics[i].readCount / maxVal) * radius;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    g.append("polygon")
      .attr("points", readPoints.map((p) => p.join(",")).join(" "))
      .attr("fill", "#c9a96e")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "#c9a96e")
      .attr("stroke-width", 1.5);

    // Read dots
    g.selectAll(".dot-read").data(readPoints).join("circle")
      .attr("cx", (d) => d[0]).attr("cy", (d) => d[1])
      .attr("r", 4).attr("fill", "#c9a96e");

    // Total polygon (dashed)
    const totalPoints = angles.map((a, i) => {
      const r = (topTopics[i].totalCount / maxVal) * radius;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    g.append("polygon")
      .attr("points", totalPoints.map((p) => p.join(",")).join(" "))
      .attr("fill", "#1a3a5c")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#1a3a5c")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,3");

    // Legend
    const lg = svg.append("g").attr("transform", `translate(${w - 100},10)`);
    lg.append("rect").attr("width", 10).attr("height", 10).attr("fill", "#c9a96e").attr("opacity", 0.5);
    lg.append("text").attr("x", 14).attr("y", 9).text("已读").attr("font-size", "9").attr("fill", "#6b7280");
    lg.append("rect").attr("width", 10).attr("height", 10).attr("y", 14).attr("fill", "#1a3a5c").attr("opacity", 0.3);
    lg.append("text").attr("x", 14).attr("y", 23).text("全库").attr("font-size", "9").attr("fill", "#6b7280");
  }, [topics]);

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6">
        <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">🎯 话题覆盖雷达</h4>
        <div className="text-center py-10 text-xs text-muted-foreground">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-1">🎯 话题覆盖雷达</h4>
      <p className="text-[10px] text-muted-foreground mb-2">金色=已读覆盖 · 深蓝虚线=全库分布</p>
      <svg ref={svgRef} width="100%" height="260" />
    </div>
  );
}

// --- Annotation Donut Chart ---
function AnnotationDonut() {
  const svgRef = useRef<SVGSVGElement>(null);
  const stats = buildAnnotationStats();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const w = svgRef.current!.clientWidth;
    const h = 200;
    const r = Math.min(w, h) / 2 - 30;
    const cx = w / 2;
    const cy = h / 2;

    const colors: Record<string, string> = { mentor: "#1a3a5c", senior: "#c9a96e", reviewer: "#6b7280", cross: "#3b82f6" };
    const labels: Record<string, string> = { mentor: "导师", senior: "师兄", reviewer: "审稿人", cross: "跨学科" };
    const data = Object.entries(stats.lensCount).map(([k, v]) => ({ type: k, count: v, label: labels[k] || k, color: colors[k] || "#9ca3af" }));

    const pie = d3.pie<typeof data[0]>().value((d) => d.count);
    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(r * 0.6).outerRadius(r);

    const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);
    g.selectAll("path").data(pie(data)).join("path")
      .attr("d", arc as any)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#fff").attr("stroke-width", 2);

    g.selectAll("text").data(pie(data)).join("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle").attr("font-size", "10").attr("fill", "#fff")
      .text((d) => d.data.count);

    // Legend
    const lg = svg.append("g").attr("transform", `translate(${w - 70},${h - 70})`);
    data.forEach((d, i) => {
      lg.append("rect").attr("x", 0).attr("y", i * 16).attr("width", 8).attr("height", 8).attr("fill", d.color).attr("rx", 1);
      lg.append("text").attr("x", 12).attr("y", i * 16 + 7).text(d.label).attr("font-size", "9").attr("fill", "#6b7280");
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-1">💬 批注透镜分布</h4>
      <p className="text-[10px] text-muted-foreground mb-2">共 {stats.total} 条批注</p>
      <svg ref={svgRef} width="100%" height="200" />
    </div>
  );
}

// --- Knowledge Map (dynamic from real data) ---
function KnowledgeMap({ entries }: { entries: ReadingEntry[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const readPaperIds = new Set(entries.map((e) => e.paper_id));

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.clientWidth;
    const h = 280;
    svg.selectAll("*").remove();

    const colorMap: Record<string, string> = { self: "#1a3a5c", paper: "#3b82f6", read: "#10b981", unread: "#d1d5db" };

    const nodes: any[] = [
      { id: "me", type: "self", label: "我", r: 14, color: colorMap.self },
      ...papers.map((p: any) => ({
        id: `p${p.id}`,
        type: "paper",
        label: p.title.slice(0, 12) + (p.title.length > 12 ? "…" : ""),
        r: readPaperIds.has(p.id) ? 10 : 7,
        color: readPaperIds.has(p.id) ? colorMap.read : colorMap.unread,
        read: readPaperIds.has(p.id),
        fullTitle: p.title,
      })),
    ];

    const links: any[] = [];
    papers.forEach((p: any) => {
      links.push({ source: "me", target: `p${p.id}`, value: readPaperIds.has(p.id) ? 2 : 1 });
    });
    // Connect papers with shared tags
    for (let i = 0; i < papers.length; i++) {
      for (let j = i + 1; j < papers.length; j++) {
        const pi = papers[i] as any;
        const pj = papers[j] as any;
        const commonTags = pi.tags.filter((t: string) => (pj as any).tags.includes(t));
        if (commonTags.length >= 2) {
          links.push({ source: `p${pi.id}`, target: `p${pj.id}`, value: commonTags.length * 0.5 });
        }
      }
    }

    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.source === "me" || d.target === "me" ? 55 : 30))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collision", d3.forceCollide().radius(16));

    const g = svg.append("g");

    g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", (d: any) => d.value > 1.5 ? "#c9a96e" : "#e5e7eb")
      .attr("stroke-width", (d: any) => d.value)
      .attr("stroke-dasharray", (d: any) => d.value > 1.5 ? "0" : "3,2");

    const node = g.append("g").selectAll("g").data(nodes).join("g");

    node.append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#fff").attr("stroke-width", 2)
      .attr("opacity", (d: any) => d.read === false ? 0.5 : 1);

    node.append("text")
      .text((d: any) => d.label)
      .attr("font-size", 7).attr("dx", (d: any) => d.r + 2).attr("dy", 2)
      .attr("fill", "#374151").attr("pointer-events", "none");

    node.filter((d: any) => d.type === "paper").append("title").text((d: any) => d.fullTitle || d.label);

    node.call(d3.drag<any, any>()
      .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any);

    simulation.on("tick", () => {
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [readPaperIds]);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-1">🗺️ 个人知识地图</h4>
      <p className="text-[10px] text-muted-foreground mb-2">
        深蓝=我 · 绿=已读 · 灰=未读 · 金线=共享标签≥2
      </p>
      <svg ref={svgRef} width="100%" height="280" />
      <div className="text-[10px] text-muted-foreground mt-1 text-center">
        已读{readPaperIds.size}篇 · 未读{papers.length - readPaperIds.size}篇
      </div>
    </div>
  );
}

// --- Growth Suggestions ---
function GrowthSuggestions({ entries }: { entries: ReadingEntry[] }) {
  const readPaperIds = new Set(entries.map((e) => e.paper_id));
  const readTags = new Set<string>();
  papers.filter((p) => readPaperIds.has(p.id)).forEach((p) => p.tags.forEach((t: string) => readTags.add(t)));

  const unreadPapers = papers.filter((p) => !readPaperIds.has(p.id));
  const suggestions = unreadPapers.map((p: any) => {
    const missingTags = p.tags.filter((t: string) => !readTags.has(t));
    const newTagCount = missingTags.length;
    return { ...p, missingTags, newTagCount, score: newTagCount * 10 + (10 - p.id) };
  }).sort((a: any, b: any) => b.score - a.score).slice(0, 3);

  const hasReadings = entries.length > 0;

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">💡 成长建议</h4>
      {!hasReadings ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p className="mb-2">📚 开始阅读后，系统会根据你的阅读盲区推荐论文</p>
          <Link href="/reader" className="text-[#c9a96e] hover:underline inline-flex items-center gap-1">
            去研读第一篇论文 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">🎉 你已覆盖全部论文！</p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground mb-2">基于你的阅读盲区，推荐以下未读论文：</p>
              {suggestions.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/reader?paper=${p.id}`}
                  className="block p-3 border border-border rounded-lg hover:border-[#c9a96e]/50 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-xs font-medium text-[#1a3a5c]">{p.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.tags.map((t: string) => (
                      <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full ${readTags.has(t) ? "bg-muted text-muted-foreground" : "bg-[#c9a96e]/20 text-[#c9a96e]"}`}>
                        {t}{readTags.has(t) ? " ✓" : " 🆕"}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    将为你覆盖 {p.newTagCount} 个新话题
                  </p>
                </Link>
              ))}
            </>
          )}
          <div className="text-[10px] text-muted-foreground pt-2 border-t border-border">
            已覆盖 {readTags.size} 个话题标签 · 全库共 {new Set(papers.flatMap((p: any) => p.tags)).size} 个
          </div>
        </div>
      )}
    </div>
  );
}

// --- Milestones (dynamic from annotations + reading) ---
function Milestones({ entries }: { entries: ReadingEntry[] }) {
  const milestones: { icon: string; text: string; date: string; detail: string }[] = [];

  if (entries.length > 0) {
    const first = [...entries].sort((a, b) => a.timestamp - b.timestamp)[0];
    milestones.push({
      icon: "📖", text: "首次阅读论文",
      date: new Date(first.timestamp).toISOString().split("T")[0],
      detail: `开始研读论文 #${first.paper_id}`,
    });
  }

  // Check annotations
  const annPaperIds = new Set((annotations as any[]).map((a: any) => a.paper_id));
  const readPaperIds = new Set(entries.map((e) => e.paper_id));
  const hasAnnotations = [...annPaperIds].some((id) => readPaperIds.has(id));

  if (hasAnnotations) {
    milestones.push({
      icon: "💬", text: "接触课题组批注",
      date: "—",
      detail: `你已读的论文中有课题组的前辈批注`,
    });
  }

  const thinkAnns = (annotations as any[]).filter((a: any) => a.has_think_prompt && readPaperIds.has(a.paper_id));
  if (thinkAnns.length > 0) {
    milestones.push({
      icon: "💡", text: "遇到思维引导问题",
      date: "—",
      detail: `${thinkAnns.length} 个思考题等待你的回答`,
    });
  }

  if (entries.length >= 3) {
    milestones.push({
      icon: "⚔️", text: "形成阅读习惯",
      date: "—",
      detail: `已稳定阅读 ${readPaperIds.size} 篇论文`,
    });
  }

  // Static onboarding indicator
  if (typeof localStorage !== "undefined") {
    try {
      const lp = localStorage.getItem("yanmai_learning_path");
      if (lp) {
        const parsed = JSON.parse(lp);
        milestones.push({ icon: "🚀", text: "完成新生入组", date: parsed.savedAt?.split("T")[0] || "—", detail: "3周学习路径已生成" });
      }
    } catch {}
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h4 className="text-sm font-semibold text-[#1a3a5c] mb-3">🏆 思维里程碑</h4>
      {milestones.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <p className="mb-2">🏁 开始阅读论文，解锁你的第一个里程碑</p>
          <Link href="/reader" className="text-[#c9a96e] hover:underline">去研读 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-lg mt-0.5">{m.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-[#1a3a5c] text-xs">{m.text}</p>
                <p className="text-xs text-muted-foreground">{m.detail}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main Page ---
export default function GrowthPage() {
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getReadingLog().then((log) => {
      setEntries(log || []);
      setLoaded(true);
    }).catch(() => {
      // Fallback: use localStorage sync data
      try {
        const raw = localStorage.getItem("yanmai_reading_log_sync");
        if (raw) {
          const parsed = JSON.parse(raw);
          setEntries(Array.isArray(parsed) ? parsed : []);
        }
      } catch {}
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasData = entries.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-2 text-center">
        🧠 个人思维成长档案
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center">
        你的每一条思考、每一次阅读、每一个批注，都在这里留下痕迹
      </p>

      {/* Empty state CTA */}
      {!hasData && (
        <div className="mb-8 bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-xl p-6 text-center">
          <p className="text-sm text-[#1a3a5c] font-medium mb-2">🌱 这里还是一片空白</p>
          <p className="text-xs text-muted-foreground mb-4">
            去研读几篇论文，添加一些批注和思考，你的成长档案就会逐渐丰富起来
          </p>
          <Link
            href="/reader"
            className="inline-block px-6 py-2 bg-[#1a3a5c] text-white rounded-lg text-sm hover:bg-[#1a3a5c]/90 transition-colors"
          >
            开始研读 →
          </Link>
        </div>
      )}

      {/* Row 1: Calendar + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReadingHeatmap entries={entries} />
        <ReadingStats entries={entries} />
      </div>

      {/* Row 2: Radar + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopicRadar entries={entries} />
        <AnnotationDonut />
      </div>

      {/* Row 3: Knowledge Map + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <KnowledgeMap entries={entries} />
        <GrowthSuggestions entries={entries} />
      </div>

      {/* Row 4: Milestones */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Milestones entries={entries} />
      </div>

      {/* Footer note */}
      <div className="mt-8 bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-xl p-4 text-center text-xs text-muted-foreground">
        数据来源：阅读行为追踪 + 批注 + 思考回答 · 数据仅自己可见 · 导师可见统计概览而非具体内容
      </div>
    </div>
  );
}
