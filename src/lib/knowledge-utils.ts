import papers from "@/data/papers.json";
import failures from "@/data/failures.json";
import annotations from "@/data/annotations.json";

// Cross-discipline map from engines.ts (duplicated to avoid browser-only import issues)
const CROSS_DISCIPLINE_MAP: Record<string, string[]> = {
  "缺陷工程": ["半导体离子注入+退火工艺", "合金强化中的位错调控", "蛋白质定点突变改造"],
  "光催化": ["自然光合作用光系统II", "光伏电池电荷分离", "光热治疗纳米平台"],
  "异质结": ["半导体异质结器件", "生物膜离子通道", "热电材料界面工程"],
  "单原子催化": ["均相催化金属中心", "酶活性位点催化", "金属蛋白电子传递"],
  "电催化": ["电解水产氢工业装置", "燃料电池MEA设计", "生物电化学传感"],
  "CO₂还原": ["自然界卡尔文循环", "工业费托合成", "海洋碳固定机制"],
  "机器学习": ["材料基因组计划", "药物虚拟筛选", "计算机视觉特征提取"],
  "MoS₂": ["石墨烯电子器件", "拓扑绝缘体表面态", "层状黏土矿物插层"],
  "钙钛矿": ["传统铁电陶瓷", "高温超导铜氧化物", "有机-无机杂化发光材料"],
  "CVD": ["半导体外延生长", "薄膜涂层工业", "气溶胶颗粒合成"],
};

const TOPIC_CLUSTERS: Record<string, string[]> = {
  "光催化": ["光催化", "光电催化", "PEC", "水分解", "CO₂还原", "光腐蚀", "IPCE"],
  "电催化": ["电催化", "ORR", "OER", "HER", "NRR", "CO2RR", "电解水"],
  "缺陷工程": ["缺陷", "空位", "S空位", "Vₒ", "Zn₁", "EPR", "XAFS", "位错"],
  "异质结": ["异质结", "Z型", "II型", "S型", "界面", "电荷转移"],
  "表征方法": ["XPS", "XRD", "TEM", "SEM", "Raman", "XAFS", "FTIR", "BET", "AFM", "EPR"],
  "合成方法": ["CVD", "水热", "溶剂热", "退火", "煅烧", "ALD", "旋涂", "溅射"],
  "单原子催化": ["单原子", "Fe-N-C", "Co-N-C", "SAC", "配位环境"],
  "机器学习": ["机器学习", "DFT", "高通量", "ML", "预测", "筛选"],
  "二维材料": ["MoS₂", "MXene", "TMDs", "二维", "纳米片", "层状"],
  "钙钛矿": ["钙钛矿", "perovskite"],
};

export type KnowledgeCardType = "failure" | "mentor_insight" | "methodology" | "topic";

export interface KnowledgeCard {
  id: string;
  type: KnowledgeCardType;
  title: string;
  subtitle: string;
  body: string;
  tags: string[];
  sourceRef: string;
  linkedPaperId?: number;
  linkedFailureId?: number;
  confidence?: "high" | "medium" | "low";
  peopleCount?: number;
  author?: string;
  timestamp?: string;
  scope?: string;
}

export interface MemoryInsight {
  topFailureTags: { tag: string; count: number }[];
  topMentorThemes: { tag: string; count: number }[];
  coOccurringPairs: { pair: [string, string]; count: number }[];
  totalMentorAnnotations: number;
  totalFailures: number;
  highConfidenceCount: number;
  baselineMentionRate: number;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    title: string;
    subtitle: string;
    tags: string[];
    cardType: KnowledgeCardType;
    linkedPaperId?: number;
    linkedFailureId?: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: "tag_overlap" | "paper_annotation" | "method_link" | "cross_discipline";
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((t) => t.toLowerCase()));
  const setB = new Set(b.map((t) => t.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function bigramTokenize(text: string): string[] {
  const cleaned = text.replace(/[^一-龥a-zA-Z0-9]/g, " ").toLowerCase();
  const tokens: string[] = [];
  // English words
  const words = cleaned.match(/[a-z0-9]+/g) || [];
  tokens.push(...words);
  // Chinese bigrams
  const chinese = cleaned.match(/[一-龥]+/g) || [];
  for (const chunk of chinese) {
    for (let i = 0; i < chunk.length - 1; i++) {
      tokens.push(chunk.slice(i, i + 2));
    }
    if (chunk.length === 1) tokens.push(chunk);
  }
  return tokens;
}

function getTopicForTags(tags: string[]): string {
  let bestTopic = "其他";
  let bestScore = 0;
  for (const [topic, keywords] of Object.entries(TOPIC_CLUSTERS)) {
    const score = tags.filter((t) =>
      keywords.some((kw) => t.toLowerCase().includes(kw.toLowerCase()))
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }
  return bestTopic;
}

// ── 1. Unified Knowledge Cards ──

export function unifyKnowledgeCards(): KnowledgeCard[] {
  const cards: KnowledgeCard[] = [];

  // Failure cards
  for (const f of failures as any[]) {
    // Find best matching paper by tag overlap
    let bestPaperId: number | undefined;
    let bestOverlap = 0;
    for (const p of papers as any[]) {
      const overlap = jaccard(f.tags, p.tags);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestPaperId = p.id;
      }
    }
    cards.push({
      id: `failure-${f.id}`,
      type: "failure",
      title: f.title,
      subtitle: `${f.experimenter} · ${f.people_count}人踩坑 · ${f.date}`,
      body: f.lesson,
      tags: f.tags,
      sourceRef: f.experimenter,
      linkedPaperId: bestPaperId,
      linkedFailureId: f.id,
      peopleCount: f.people_count,
      timestamp: f.date,
      scope: f.scope,
    });
  }

  // Mentor annotation cards
  for (const a of annotations as any[]) {
    if (a.role !== "mentor" || !a.content) continue;
    const linkedPaper = (papers as any[]).find((p: any) => p.id === a.paper_id);
    const tags = linkedPaper?.tags || [];
    cards.push({
      id: `annotation-${a.id}`,
      type: "mentor_insight",
      title: a.content.length > 60 ? a.content.slice(0, 60) + "..." : a.content,
      subtitle: `${a.author} · ${a.confidence === "high" ? "高置信度" : a.confidence === "medium" ? "中置信度" : "低置信度"}`,
      body: a.content,
      tags,
      sourceRef: a.author,
      linkedPaperId: a.paper_id,
      confidence: a.confidence,
      author: a.author,
      timestamp: a.created_at,
    });
  }

  // Methodology cards from tags appearing in 2+ papers

  const tagCount = new Map<string, number>();
  for (const p of papers as any[]) {
    const seen = new Set<string>();
    for (const t of p.tags) {
      const lower = t;
      if (!seen.has(lower)) {
        seen.add(lower);
        tagCount.set(lower, (tagCount.get(lower) || 0) + 1);
      }
    }
  }
  for (const f of failures as any[]) {
    for (const t of f.tags) {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    }
  }

  const frequentTags = [...tagCount.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  for (const [tag, count] of frequentTags) {
    const relatedCards = cards.filter((c) =>
      c.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(t.toLowerCase()))
    );
    const body = relatedCards.length > 0
      ? `${relatedCards.length}篇论文/失败案例涉及此标签。${
          relatedCards[0]?.body?.slice(0, 100) || ""
        }`
      : `出现在${count}篇论文中。`;
    cards.push({
      id: `method-${tag}`,
      type: "methodology",
      title: tag,
      subtitle: `${count}篇论文/案例`,
      body,
      tags: [tag],
      sourceRef: `${count} papers`,
    });
  }

  // Topic cards
  const topicGroups = new Map<string, KnowledgeCard[]>();
  for (const card of cards) {
    const topic = getTopicForTags(card.tags);
    if (!topicGroups.has(topic)) topicGroups.set(topic, []);
    topicGroups.get(topic)!.push(card);
  }
  for (const [topic, members] of topicGroups) {
    if (members.length < 2) continue;
    cards.push({
      id: `topic-${topic}`,
      type: "topic",
      title: topic,
      subtitle: `${members.length} cards`,
      body: `Contains ${members.map((c) => c.title.slice(0, 30)).slice(0, 3).join("、")}...`,
      tags: [topic],
      sourceRef: "auto-grouped",
    });
  }

  return cards;
}

// ── 2. Search ──

export function searchKnowledgeCards(
  query: string,
  cards: KnowledgeCard[],
): KnowledgeCard[] {
  if (!query.trim()) return cards;
  const queryTokens = bigramTokenize(query);
  if (queryTokens.length === 0) return cards;

  const scored = cards.map((card) => {
    const titleTokens = bigramTokenize(card.title);
    const bodyTokens = bigramTokenize(card.body);
    const tagTokens = bigramTokenize(card.tags.join(" "));

    let score = 0;
    for (const qt of queryTokens) {
      if (titleTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 3;
      if (tagTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 2;
      if (bodyTokens.some((t) => t.includes(qt) || qt.includes(t))) score += 1;
    }
    // Bonus: full query substring match
    const lowerQ = query.toLowerCase();
    if (card.title.toLowerCase().includes(lowerQ)) score += 5;
    if (card.tags.some((t) => t.toLowerCase().includes(lowerQ))) score += 4;
    return { card, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.card);
}

// ── 3. Memory Insights ──

export function computeMemoryInsights(): MemoryInsight {
  const failureTagCount = new Map<string, number>();
  for (const f of failures as any[]) {
    for (const t of f.tags) {
      failureTagCount.set(t, (failureTagCount.get(t) || 0) + 1);
    }
  }

  const mentorTagCount = new Map<string, number>();
  let totalMentorAnnotations = 0;
  let highConfidenceCount = 0;
  let baselineMentions = 0;
  for (const a of annotations as any[]) {
    if (a.role !== "mentor") continue;
    totalMentorAnnotations++;
    if (a.confidence === "high") highConfidenceCount++;
    if (/对照|control|comparison|基线|baseline/i.test(a.content)) {
      baselineMentions++;
    }
    const paper = (papers as any[]).find((p: any) => p.id === a.paper_id);
    if (paper?.tags) {
      for (const t of paper.tags) {
        mentorTagCount.set(t, (mentorTagCount.get(t) || 0) + 1);
      }
    }
  }

  // Co-occurring pairs
  const pairCount = new Map<string, number>();
  const allCards = unifyKnowledgeCards();
  for (const card of allCards) {
    const sorted = [...new Set(card.tags)].sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}|||${sorted[j]}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }

  return {
    topFailureTags: [...failureTagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
    topMentorThemes: [...mentorTagCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count })),
    coOccurringPairs: [...pairCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, count]) => ({
        pair: pair.split("|||") as [string, string],
        count,
      })),
    totalMentorAnnotations,
    totalFailures: (failures as any[]).length,
    highConfidenceCount,
    baselineMentionRate:
      totalMentorAnnotations > 0
        ? Math.round((baselineMentions / totalMentorAnnotations) * 100)
        : 0,
  };
}

// ── 4. Get Related Cards ──

export function getRelatedCards(
  cardId: string,
  allCards?: KnowledgeCard[],
): KnowledgeCard[] {
  const cards = allCards || unifyKnowledgeCards();
  const source = cards.find((c) => c.id === cardId);
  if (!source) return [];
  return cards
    .filter((c) => c.id !== cardId)
    .map((c) => ({ card: c, score: jaccard(source.tags, c.tags) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.card);
}

// ── 5. Graph Data Builder ──

export function buildGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Paper nodes
  for (const p of papers as any[]) {
    const topic = getTopicForTags(p.tags);
    nodes.push({
      id: `paper-${p.id}`,
      type: "paper-node",
      position: { x: 0, y: 0 },
      data: {
        label: p.title,
        title: p.title,
        subtitle: p.journal?.split(",")[0] || "",
        tags: [...p.tags, topic],
        cardType: "topic",
        linkedPaperId: p.id,
      },
    });
  }

  // Failure nodes
  for (const f of failures as any[]) {
    nodes.push({
      id: `failure-${f.id}`,
      type: "failure-node",
      position: { x: 0, y: 0 },
      data: {
        label: f.title,
        title: f.title,
        subtitle: `${f.experimenter} · ${f.people_count}人`,
        tags: f.tags,
        cardType: "failure",
        linkedFailureId: f.id,
      },
    });
  }

  // Methodology nodes (tags appearing in 2+ papers + failures)
  const tagCount = new Map<string, number>();
  for (const p of papers as any[]) {
    for (const t of p.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  }
  for (const f of failures as any[]) {
    for (const t of f.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  }
  for (const [tag, count] of tagCount) {
    if (count < 2) continue;
    nodes.push({
      id: `method-${tag}`,
      type: "methodology-node",
      position: { x: 0, y: 0 },
      data: {
        label: tag,
        title: tag,
        subtitle: `${count} references`,
        tags: [tag],
        cardType: "methodology",
      },
    });
  }

  // Topic nodes
  const topicGroups = new Map<string, number>();
  for (const p of papers as any[]) {
    const topic = getTopicForTags(p.tags);
    topicGroups.set(topic, (topicGroups.get(topic) || 0) + 1);
  }
  for (const [topic, count] of topicGroups) {
    if (count < 1) continue;
    nodes.push({
      id: `topic-${topic}`,
      type: "topic-node",
      position: { x: 0, y: 0 },
      data: {
        label: topic,
        title: topic,
        subtitle: `${count} papers`,
        tags: [topic],
        cardType: "topic",
      },
    });
  }

  // Annotation (mentor insight) nodes
  for (const a of annotations as any[]) {
    if (a.role !== "mentor" || !a.content) continue;
    nodes.push({
      id: `annotation-${a.id}`,
      type: "mentor-insight-node",
      position: { x: 0, y: 0 },
      data: {
        label: a.content.slice(0, 60),
        title: a.content.slice(0, 60),
        subtitle: a.author,
        tags: (papers as any[]).find((p: any) => p.id === a.paper_id)?.tags || [],
        cardType: "mentor_insight",
        linkedPaperId: a.paper_id,
      },
    });
  }

  // Edges: Tag overlap (paper-paper, paper-failure, failure-failure)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const aIsPaper = a.id.startsWith("paper-");
      const bIsPaper = b.id.startsWith("paper-");
      const aIsFailure = a.id.startsWith("failure-");
      const bIsFailure = b.id.startsWith("failure-");
      const isMethod = a.id.startsWith("method-") || b.id.startsWith("method-");
      const isTopic = a.id.startsWith("topic-") || b.id.startsWith("topic-");

      if (isTopic) continue; // Topics don't get tag edges

      const sim = jaccard(a.data.tags, b.data.tags);
      if (sim >= 0.2 && ((aIsPaper || aIsFailure) && (bIsPaper || bIsFailure))) {
        edges.push({
          id: `overlap-${a.id}-${b.id}`,
          source: a.id,
          target: b.id,
          type: "tag_overlap",
        });
      }

      if (isMethod && sim >= 0.2) {
        const methodNode = a.id.startsWith("method-") ? a : b;
        const otherNode = a.id.startsWith("method-") ? b : a;
        edges.push({
          id: `methodlink-${methodNode.id}-${otherNode.id}`,
          source: methodNode.id,
          target: otherNode.id,
          type: "method_link",
        });
      }
    }
  }

  // Edges: Paper-Annotation links
  for (const a of annotations as any[]) {
    if (a.role !== "mentor" || !a.content) continue;
    const paperNodeId = `paper-${a.paper_id}`;
    const annotationNodeId = `annotation-${a.id}`;
    if (nodes.some((n) => n.id === paperNodeId)) {
      edges.push({
        id: `paperann-${a.id}`,
        source: paperNodeId,
        target: annotationNodeId,
        label: "mentored",
        type: "paper_annotation",
      });
    }
  }

  // Edges: Cross-discipline
  for (const [keyword, analogies] of Object.entries(CROSS_DISCIPLINE_MAP)) {
    const methodNode = nodes.find((n) => n.id === `method-${keyword}`);
    if (!methodNode) continue;
    for (const analogy of analogies) {
      const analogyId = `cross-${analogy.slice(0, 20)}`;
      if (!nodes.some((n) => n.id === analogyId)) {
        nodes.push({
          id: analogyId,
          type: "methodology-node",
          position: { x: 0, y: 0 },
          data: {
            label: analogy,
            title: analogy,
            subtitle: `Cross: ${keyword}`,
            tags: [keyword],
            cardType: "methodology",
          },
        });
      }
      edges.push({
        id: `cross-${methodNode.id}-${analogyId}`,
        source: methodNode.id,
        target: analogyId,
        label: "cross-discipline",
        type: "cross_discipline",
      });
    }
  }

  return { nodes, edges };
}
