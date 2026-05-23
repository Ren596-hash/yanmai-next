"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

// ============================================================
// 数据 (从Flask版迁移)
// ============================================================
const GRAPH_DATA = {
  nodes: [
    // 论文 (blue)
    { id: "p1", type: "paper", label: "MoS₂缺陷工程", tags: ["MoS₂", "缺陷工程", "光催化"], group: 1 },
    { id: "p2", type: "paper", label: "Cu₂O/TiO₂异质结", tags: ["异质结", "CO₂还原", "Cu₂O"], group: 1 },
    { id: "p3", type: "paper", label: "Fe-N-C ORR", tags: ["单原子催化", "ORR", "Fe-N-C"], group: 2 },
    { id: "p4", type: "paper", label: "Operando XAFS", tags: ["原位XAFS", "ORR", "operando"], group: 2 },
    { id: "p5", type: "paper", label: "ZnO缺陷工程", tags: ["ZnO", "缺陷工程", "光电催化"], group: 1 },
    { id: "p6", type: "paper", label: "ML+钙钛矿", tags: ["机器学习", "钙钛矿", "高通量筛选"], group: 3 },
    { id: "p7", type: "paper", label: "Cu双金属CO₂RR", tags: ["电催化", "CO₂还原", "双金属"], group: 1 },
    { id: "p8", type: "paper", label: "Pt/CeO₂ WGS", tags: ["单原子催化", "水煤气变换", "DFT"], group: 2 },
    { id: "p9", type: "paper", label: "MXene析氢", tags: ["MXene", "光催化", "析氢"], group: 3 },
    { id: "p10", type: "paper", label: "钙钛矿热化学", tags: ["钙钛矿", "热化学", "制氢"], group: 3 },
    // 成员 (pink)
    { id: "m1", type: "member", label: "张明远(博)", mastery: 95, status: "即将毕业", group: 4 },
    { id: "m2", type: "member", label: "陈强(博)", mastery: 72, status: "在研", group: 4 },
    { id: "m3", type: "member", label: "李华(硕)", mastery: 68, status: "在研", group: 4 },
    { id: "m4", type: "member", label: "王芳(硕)", mastery: 31, status: "在研", group: 4 },
    { id: "m5", type: "member", label: "赵刚(新)", mastery: 5, status: "在研", group: 4 },
    { id: "m0", type: "member", label: "陈老师(PI)", mastery: 100, status: "导师", group: 4 },
    // 失败案例 (red)
    { id: "f1", type: "failure", label: "MoS₂相变", tags: ["退火", "MoS₂", "相变"], group: 5 },
    { id: "f2", type: "failure", label: "Cu₂O氧化", tags: ["Cu₂O", "氧化", "异质结"], group: 5 },
    { id: "f3", type: "failure", label: "pH沉积失败", tags: ["Cu₂O", "pH", "沉积"], group: 5 },
    { id: "f4", type: "failure", label: "XPS石墨碳干扰", tags: ["XPS", "数据分析", "MoS₂"], group: 5 },
    { id: "f7", type: "failure", label: "TEM束损伤", tags: ["TEM", "MoS₂", "表征"], group: 5 },
    { id: "f5", type: "failure", label: "溶剂效应", tags: ["溶剂", "可重复性", "CO₂还原"], group: 5 },
  ],
  links: [
    // 批注关系 (实线): member → paper
    { source: "m0", target: "p1", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p3", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p4", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p5", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p6", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p8", type: "annotation", label: "导师批注" },
    { source: "m0", target: "p10", type: "annotation", label: "导师批注" },
    { source: "m1", target: "p1", type: "annotation", label: "实验+发现" },
    { source: "m1", target: "p2", type: "annotation", label: "核心方法" },
    { source: "m1", target: "p5", type: "annotation", label: "类比经验" },
    { source: "m1", target: "p8", type: "annotation", label: "DFT方法论" },
    { source: "m2", target: "p3", type: "annotation", label: "Mössbauer专家" },
    { source: "m2", target: "p4", type: "annotation", label: "XAFS专家" },
    { source: "m2", target: "p6", type: "annotation", label: "ML贡献" },
    { source: "m3", target: "p1", type: "annotation", label: "实验" },
    { source: "m3", target: "p2", type: "annotation", label: "失败案例" },
    { source: "m3", target: "p7", type: "annotation", label: "合成方法" },
    { source: "m4", target: "p6", type: "annotation", label: "阴性样本" },
    { source: "m4", target: "p9", type: "annotation", label: "MXene研究" },
    { source: "m5", target: "p9", type: "annotation", label: "MXene警示" },
    // 标签关联 (虚线): paper ↔ failure
    { source: "p1", target: "f1", type: "tag_link", label: "MoS₂·退火" },
    { source: "p1", target: "f4", type: "tag_link", label: "MoS₂·XPS" },
    { source: "p1", target: "f7", type: "tag_link", label: "MoS₂·TEM" },
    { source: "p2", target: "f2", type: "tag_link", label: "Cu₂O·氧化" },
    { source: "p2", target: "f3", type: "tag_link", label: "Cu₂O·pH" },
    { source: "p7", target: "f5", type: "tag_link", label: "CO₂·溶剂" },
  ],
};

const ALERTS = [
  { level: "danger" as const, text: "数据标准不一致 — XPS定标方法存在3种不同规范" },
  { level: "danger" as const, text: "方法论分歧 — MoS₂退火工艺两组方案矛盾" },
  { level: "danger" as const, text: "设备隐患 — 管式炉热电偶近3个月未校准" },
  { level: "warning" as const, text: "文献未读 — 3位成员超过2周未记录文献阅读" },
  { level: "warning" as const, text: "知识流失 — 张明远即将毕业，缺陷工程节点面临断层" },
  { level: "warning" as const, text: "数据偏倚 — ML训练数据74%来自成功实验" },
  { level: "success" as const, text: "跨代传承良好 — 第三代对第一代核心方法掌握度78%" },
];

const MEMBERS = [
  { name: "陈老师", role: "导师", mastery: 100, status: "在研" },
  { name: "张明远", role: "博士", mastery: 95, status: "即将毕业" },
  { name: "陈强", role: "博士", mastery: 72, status: "在研" },
  { name: "李华", role: "硕士", mastery: 68, status: "在研" },
  { name: "王芳", role: "硕士", mastery: 31, status: "在研" },
  { name: "赵刚", role: "新生", mastery: 5, status: "在研" },
];

// ============================================================
// D3图谱组件
// ============================================================
function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = 400;
    svg.selectAll("*").remove();

    const tooltip = d3.select(tooltipRef.current);

    const colorMap: Record<string, string> = {
      paper: "#3b82f6",
      member: "#ec4899",
      failure: "#ef4444",
    };

    const nodes = GRAPH_DATA.nodes.map((d) => ({ ...d }));
    const links = GRAPH_DATA.links.map((d) => ({ ...d }));

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(80)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    // 连线
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.type === "tag_link" ? "#d1d5db" : "#9ca3af"))
      .attr("stroke-width", (d) => (d.type === "tag_link" ? 1 : 2))
      .attr("stroke-dasharray", (d) => (d.type === "tag_link" ? "5,3" : "none"));

    // 节点
    const node = g
      .append("g")
      .selectAll<SVGCircleElement, any>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => {
        if (d.type === "paper") return 12;
        if (d.type === "member") return 10 + (d.mastery || 5) / 10;
        return 10;
      })
      .attr("fill", (d) => colorMap[d.type])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .call(
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

    // 标签
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 9)
      .attr("dx", 14)
      .attr("dy", 3)
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    // 悬停
    node
      .on("mouseenter", (_event, d) => {
        tooltip
          .style("display", "block")
          .html(
            `<div class="text-xs">
              <strong>${d.label}</strong><br/>
              类型: ${d.type === "paper" ? "📄 论文" : d.type === "member" ? "👤 成员" : "⚠️ 失败案例"}<br/>
              ${d.tags ? "标签: " + d.tags.join(", ") : ""}
              ${d.mastery !== undefined ? "掌握度: " + d.mastery + "%" : ""}
              ${d.status ? "<br/>状态: " + d.status : ""}
            </div>`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseleave", () => {
        tooltip.style("display", "none");
      })
      .on("click", (_event, d) => {
        if (d.type === "paper") {
          const pid = d.id.replace("p", "");
          router.push(`/reader`);
        } else if (d.type === "failure") {
          router.push("/advisor");
        } else if (d.type === "member") {
          alert(`${d.label}\n掌握度: ${d.mastery}%\n状态: ${d.status}`);
        }
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [router]);

  return (
    <div className="relative">
      <svg ref={svgRef} width="100%" height="400" className="bg-white rounded-xl" />
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white border border-border rounded-lg p-2 shadow-lg pointer-events-none z-50"
      />
      {/* 图例 */}
      <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
        <span>🔵 论文</span>
        <span>🩷 成员</span>
        <span>🔴 失败案例</span>
        <span>— 批注关系</span>
        <span>- - 标签关联</span>
      </div>
    </div>
  );
}

// ============================================================
// 预警列表
// ============================================================
function AlertList() {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="font-semibold text-[#1a3a5c] mb-4">🔔 系统预警</h3>
      <div className="space-y-2">
        {ALERTS.map((alert, i) => (
          <div
            key={i}
            className={`border-l-4 p-3 rounded-r-lg text-sm ${
              alert.level === "danger"
                ? "border-red-500 bg-red-50"
                : alert.level === "warning"
                  ? "border-orange-400 bg-orange-50"
                  : "border-green-500 bg-green-50"
            }`}
          >
            <span className="mr-1">
              {alert.level === "danger" ? "🔴" : alert.level === "warning" ? "🟡" : "🟢"}
            </span>
            {alert.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 周报预览
// ============================================================
function WeeklyDigest() {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1a3a5c]">📋 本周摘要预览</h3>
        <button className="text-xs font-medium text-[#c9a96e] hover:text-[#1a3a5c] transition-colors px-3 py-1 rounded border border-[#c9a96e]/30 hover:bg-[#c9a96e]/10">
          发送周报 →
        </button>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
        <p>
          <strong className="text-[#1a3a5c]">本周概览（5/15 - 5/21）：</strong>
        </p>
        <ul className="space-y-1 text-xs">
          <li>📖 <strong>阅读活动</strong>：3位成员阅读了5篇论文，累计21个章节</li>
          <li>💬 <strong>新增批注</strong>：李华添加了2条新批注，王芳回复了1条</li>
          <li>⚠️ <strong>失败案例</strong>：陈强提交了1份新失败报告（Cu双金属CO₂RR合成）</li>
          <li>🧪 <strong>实验进展</strong>：张明远完成XAFS原位测试，数据正常</li>
          <li>🎓 <strong>传承风险</strong>：张明远毕业在即，缺陷工程和原位表征节点待接班人</li>
        </ul>
        <p className="text-xs mt-2">
          📊 <strong>知识健康指数</strong>：<span className="text-green-600 font-medium">78分</span>（较上周+3分）
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        AI自动生成 · 导师审阅后可一键发送至课题组邮箱
      </p>
    </div>
  );
}

// ============================================================
// 成员掌握度
// ============================================================
function MemberMastery() {
  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <h3 className="font-semibold text-[#1a3a5c] mb-4">👥 成员知识掌握度</h3>
      <div className="space-y-3 mb-4">
        {MEMBERS.map((m) => {
          const color =
            m.mastery >= 90
              ? "bg-blue-500"
              : m.mastery >= 70
                ? "bg-green-500"
                : m.mastery >= 50
                  ? "bg-orange-400"
                  : m.mastery >= 20
                    ? "bg-purple-500"
                    : "bg-red-500";
          return (
            <div key={m.name} className="flex items-center gap-3 text-sm">
              <div className={`w-3 h-3 rounded-full ${color} shrink-0`} />
              <span className="font-medium w-16">{m.name}</span>
              <span className="text-muted-foreground w-8">({m.role})</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${m.mastery}%` }}
                />
              </div>
              <span className="font-medium w-12 text-right">{m.mastery}%</span>
              <span className="text-xs text-muted-foreground w-16">{m.status}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
        ⚠️ 张明远即将毕业，缺陷工程和原位表征两个节点流失风险最高
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold text-[#1a3a5c] mb-4">
        📊 导师驾驶舱
      </h2>

      {/* 知识图谱 */}
      <div className="mb-6">
        <KnowledgeGraph />
      </div>

      {/* 周报预览 */}
      <div className="mb-6">
        <WeeklyDigest />
      </div>

      {/* 下半部分：预警 + 成员 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertList />
        <MemberMastery />
      </div>
    </div>
  );
}
