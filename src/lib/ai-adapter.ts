// 研脉 · AI适配器
// 封装竞赛平台AI调用。当前用预设回复模拟（从Flask版迁移），
// 待平台API确定后替换 fetchToPlatformAI() 即可。

import type { AskFirstResponse, FollowupResponse } from "./types";

// --- AI 配置接口 ---
// 在竞赛平台或生产环境中设置这些值，即可启用真实AI调用

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

let aiConfig: AIConfig = {
  apiUrl: "",
  apiKey: "",
  model: "platform-model",
  enabled: false,
};

export function configureAI(config: Partial<AIConfig>): void {
  aiConfig = { ...aiConfig, ...config };
}

export function getAIConfig(): AIConfig {
  return { ...aiConfig };
}

async function fetchToPlatformAI(
  messages: { role: string; content: string }[],
  temperature = 0.7
): Promise<string> {
  if (!aiConfig.enabled || !aiConfig.apiUrl) {
    throw new Error("Platform AI not configured");
  }

  const res = await fetch(aiConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiConfig.apiKey}`,
    },
    body: JSON.stringify({ model: aiConfig.model, messages, temperature }),
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.response || JSON.stringify(data);
}

// ============================================================
// 预设回复 (关键词匹配 + 预写回复)
// ============================================================

interface PresetReply {
  keywords: string[];
  response: string;
  sceneId: number | null;
}

const PRESET_ASK_REPLIES: PresetReply[] = [
  {
    keywords: ["微服务", "microservice", "DDD", "限界上下文", "拆分", "分布式系统"],
    response:
      "我注意到你对微服务架构感兴趣。在展示课题组的前人经验之前，想先问你：<b>你觉得决定服务拆分粒度最关键的因素是什么？拆得太细除了增加运维复杂度，还可能导致什么隐藏的问题？</b>",
    sceneId: 1,
  },
  {
    keywords: ["React", "Next.js", "SSR", "RSC", "Server Components", "前端架构"],
    response:
      "你在考虑React SSR方案。这个选择有一个经典的工程陷阱。<b>你先想想——React Server Components在什么场景下反而会让页面变慢？流式SSR的hydration mismatch在哪些边界条件下最容易被触发？</b>",
    sceneId: 2,
  },
  {
    keywords: ["数据库", "PostgreSQL", "慢查询", "索引", "EXPLAIN", "性能"],
    response:
      "数据库慢查询优化看起来标准，但实际的执行计划可能和EXPLAIN的输出完全不同。<b>你的表数据量和生产环境一致吗？查询优化器在数据量变化时可能选择不同的计划——你注意到JOIN顺序变了的情况吗？</b>",
    sceneId: 3,
  },
  {
    keywords: ["综述", "文献综述", "分布式", "共识算法", "Raft", "Paxos"],
    response:
      "写分布式共识算法的综述很有价值。<b>但我先问你——Raft和Paxos在生产环境中失败模式的最大区别是什么？它们在leader election、日志复制、成员变更三个维度上的trade-off是什么？</b>",
    sceneId: 4,
  },
  {
    keywords: ["毕业", "就业", "去向", "职业", "工作", "工业界", "学术界"],
    response:
      "考虑毕业后方向是很重要的事。<b>在给你看师兄师姐的去向之前，先想想——读研期间什么时刻最让你有成就感？不是别人觉得厉害，是你自己觉得'这事做得真好'。</b>",
    sceneId: 5,
  },
  {
    keywords: ["新生", "入门", "怎么开始", "从哪里开始", "读什么"],
    response:
      "欢迎加入课题组！在推荐入门路径之前想先了解你。<b>你本科阶段最感兴趣的软件工程方向是什么？有没有做过相关项目或实习？</b>",
    sceneId: 7,
  },
  {
    keywords: ["辩论", "挑战", "质疑", "反对"],
    response:
      "<b> 思维挑战模式已激活</b><br>请先陈述你的观点或实验结论，我会扮演同行评审者进行建设性挑战。你准备好了吗？",
    sceneId: 6,
  },
  {
    keywords: ["LLM", "推理", "大模型", "推测解码", "speculative", "decoding", "推理加速"],
    response:
      "LLM推理加速是当前最热门的系统优化方向之一。<b>在你选择方案之前想一想——推测解码(speculative decoding)和continuous batching各自的适用场景是什么？为什么vLLM选择了后者而非前者作为默认策略？</b>",
    sceneId: 8,
  },
  {
    keywords: ["K8s", "Kubernetes", "容器", "弹性伸缩", "HPA", "云原生"],
    response:
      "K8s弹性伸缩的配置空间很大。<b>在调HPA参数之前，你想清楚了吗——你的应用是CPU-bound还是IO-bound？基于CPU的HPA对IO-bound应用几乎是无效的，你准备用什么自定义指标来驱动伸缩？</b>",
    sceneId: 9,
  },
  {
    keywords: ["WASM", "WebAssembly", "边缘计算", "WASI", "运行时"],
    response:
      "WebAssembly正从浏览器走向边缘计算。<b>先思考——WASM的沙箱隔离模型和Docker容器有什么本质区别？冷启动时间优势在什么场景下最明显？但WASI Preview 2的接口覆盖度能满足你的场景吗？</b>",
    sceneId: 10,
  },
  {
    keywords: ["CI/CD", "CI", "CD", "pipeline", "部署", "GitHub Actions"],
    response:
      "CI/CD管道是软件工程的基础设施，但Garbage In, Garbage Out。<b>你的pipeline依赖缓存策略——什么情况下缓存命中反而会导致问题？当你从缓存中恢复node_modules时，如何确保依赖版本和生产环境一致？</b>",
    sceneId: 11,
  },
  {
    keywords: ["Redis", "缓存", "cache", "memcache", "CDN", "缓存策略"],
    response:
      "缓存是性能优化的利器，但每种缓存策略都有自己的陷阱。<b>如果你的Redis热key突然失效，所有请求瞬间打到数据库——这种缓存雪崩你准备怎么防范？缓存穿透和缓存击穿的区别你清楚吗？</b>",
    sceneId: 12,
  },
  {
    keywords: ["监控", "可观测性", "observability", "logging", "tracing", "metrics"],
    response:
      "可观测性是分布式系统的眼睛，但每层都有盲区。<b>Metrics告诉你what happened, Tracing告诉你where, Logging告诉你why——但你的告警系统是基于哪个维度配置的？过度依赖单一维度是线上故障排查慢的主要原因吗？</b>",
    sceneId: 13,
  },
  {
    keywords: ["复现", "重现", "bug", "不能复现", "生产环境", "本地", "调试"],
    response:
      "Bug不重现是软件工程最常见的挫败来源。<b>在归因于'环境差异'之前，先系统排查——Node版本、依赖版本、环境变量、浏览器缓存、CDN缓存...你记录了哪些变量？生产环境和本地环境有哪些可能被你忽略的差异？</b>",
    sceneId: 14,
  },
  {
    keywords: ["论文写作", "投稿", "写文章", "写作", "技术博客", "文档"],
    response:
      "技术写作是工程师的最后一公里。<b>在动笔之前——你文章的核心技术问题是什么？用一句话能说清楚吗？你的benchmark数据、架构决策和trade-off分析都是围绕这个核心问题组织的吗？</b>",
    sceneId: 15,
  },
  {
    keywords: ["CRDT", "OT", "协同编辑", "collaborative", "Yjs", "实时同步"],
    response:
      "CRDT/OT是协同编辑的核心技术。<b>想一想——你的协同场景需要离线支持吗？如果用户A离线编辑了一小时回来，与用户B的在线编辑发生了冲突，你期望的合并行为是什么？CRDT的'最终收敛'能保证用户的编辑意图不丢失吗？</b>",
    sceneId: 16,
  },
];

const DEFAULT_ASK_REPLY: PresetReply = {
  keywords: [],
  response:
    "这是一个好问题。在分享课题组积累的相关知识之前，我想先听听你的想法。<b>你对这个问题目前了解多少？你觉得可能的关键因素是什么？</b>",
  sceneId: null,
};

// ============================================================
// 公共接口
// ============================================================

export async function askFirstRound(
  question: string
): Promise<AskFirstResponse> {
  // Priority 1: 尝试平台AI
  try {
    const aiResponse = await fetchToPlatformAI([
      { role: "system", content: BUILTIN_SYSTEM_PROMPT },
      { role: "user", content: question },
    ]);
    return { response: aiResponse, scene_id: null, mode: "ask_first" };
  } catch {
    // 降级到预设回复
  }

  // Priority 2: 关键词匹配 + 预设回复
  const lower = question.toLowerCase();
  const match = PRESET_ASK_REPLIES.find((r) =>
    r.keywords.some((kw) => lower.includes(kw.toLowerCase()))
  );

  const result = match || DEFAULT_ASK_REPLY;
  return { response: result.response, scene_id: result.sceneId, mode: "ask_first" };
}

export async function askFollowup(
  answer: string,
  sceneId: number | null,
  originalQuestion: string
): Promise<FollowupResponse> {
  try {
    const aiResponse = await fetchToPlatformAI([
      { role: "system", content: BUILTIN_SHOW_KNOWLEDGE_PROMPT },
      { role: "user", content: `原始问题: ${originalQuestion}\n学生思考: ${answer}` },
    ]);
    return { response: aiResponse, mode: "show_experience" };
  } catch {
    // 降级: 简单评估
  }

  const length = answer.length;
  const hasNumbers = /\d/.test(answer);
  const hasRef = /(?:文献|论文|ref|doi|报道|article)/i.test(answer);
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  if (length < 10) {
    return {
      response:
        "你似乎还没有充分思考这个问题。别着急，试着从以下几个方面想一想：<br><br>1. 这个问题的核心变量是什么？<br>2. 有哪些可能的机制或原因？<br>3. 你手头有什么数据或证据支持你的想法？<br><br>试着写2-3句话回答，然后再看看课题组的经验。",
      mode: "ask_deeper",
    };
  }

  if (length < 40) {
    return {
      response:
        "不错，你给出了初步想法。让我们再深入一点：<b>你提到的观点有没有可能被其他因素干扰？如果改变其中一个实验条件，你觉得结果会怎么变化？</b><br><br>试着把推理链条展开一步，然后再看看课题组的经验。",
      mode: "ask_deeper",
    };
  }

  if (hasRef && length > 100) {
    return {
      response:
        `非常好，你不仅深入思考了问题，还引用了相关文献！基于你的回答和课题组知识库，这里是你可能感兴趣的相关积累：<br><br><b> 课题组相关经验：</b><br>• 失败案例库中有类似的实验条件，需要注意退火温度控制和价态稳定性<br>• 高年级成员在XPS数据分析中积累了系统的定标经验<br>• 跨学科类比在催化材料研究中经常产生意外突破<br><br><i>提示：当前为Demo预设回复模式。接入平台AI后将根据实际检索结果生成个性化回复，每条知识点将标注来源和置信度。</i>`,
      mode: "show_experience",
    };
  }

  if (length > 80) {
    return {
      response:
        `感谢你的深度思考。${hasNumbers ? "你的回答包含了定量分析，这很好。" : ""}基于课题组的集体智慧，以下是一些相关积累：<br><br><b> 课题组知识：</b><br>• 在MoS₂体系中，退火温度是控制缺陷浓度的首要参数，但相变温度是硬上限<br>• Cu₂O/TiO₂异质结的界面质量取决于沉积气氛——惰性环境是必须的<br>• 多个失败案例的根因都指向'未控制的变量'<br><br><i>提示：当前为Demo预设回复模式。接入平台AI后将根据实际检索结果生成个性化回复。</i><br><br> 你可以继续深入探讨，或者切换到 <b>辩论模式</b> 来测试你的论证强度。`,
      mode: "show_experience",
    };
  }

  return {
    response:
      "感谢你的思考。基于你的回答和课题组知识库，以下是一些相关的积累：<br><br><i>提示：当前为Demo预设回复模式。接入平台AI后将根据实际检索结果生成个性化回复，每条知识点将标注来源和置信度。</i><br><br> 你可以继续深入探讨，或者切换到其他模式试试。",
    mode: "show_experience",
  };
}

export async function debateMode(
  statement: string,
  roundCount: number
): Promise<FollowupResponse> {
  try {
    const aiResponse = await fetchToPlatformAI([
      { role: "system", content: BUILTIN_DEBATE_PROMPT },
      { role: "user", content: `学生观点: ${statement}\n这是第${roundCount}轮辩论` },
    ]);
    return { response: aiResponse, mode: "show_experience" };
  } catch {
    // 降级
  }

  return {
    response: `<b> 思维挑战 · 第${roundCount}轮</b><br><br>我理解你的观点。但我想挑战你：<b>你确定你观察到的效应是单一变量导致的吗？有没有可能的混淆变量？</b><br><br>在催化研究中，一个常见的陷阱是将相关性误判为因果性。例如：<br>• 退火温度↑ → 缺陷浓度↑ → 活性↑<br>但温度↑ 同时也会改变：晶粒尺寸、表面重构、杂质扩散...<br><br> 这是一个已确认的学术认知：单一变量实验在复杂催化体系中几乎不可能真正实现。<br><br>建议的改进方向：<b>做一组控制实验，固定缺陷浓度（改变其他合成参数），验证活性是否真的只由缺陷浓度决定。</b>`,
    mode: "show_experience",
  };
}

// ============================================================
// analyzePaper — 上传论文后自动生成摘要和标签建议
// ============================================================

export interface PaperAnalysis {
  summary: string;
  suggestedTags: string[];
  difficulty: "introductory" | "intermediate" | "advanced";
  relatedFailures: string[];
  readingOrder: number;
}

export function analyzePaper(
  title: string,
  abstract: string,
  tags: string[],
  sections: string[][]
): PaperAnalysis {
  const allText = `${title} ${abstract} ${sections.map((s) => s[1] || "").join(" ")}`;
  const lowerText = allText.toLowerCase();

  // Determine difficulty from content signals
  let difficulty: PaperAnalysis["difficulty"] = "intermediate";
  const advancedSignals = ["DFT", "in-situ", "operando", "d-band", "reaction mechanism", "first-principles", "XAFS", "synchrotron"];
  const introSignals = ["review", "综述", "introduction", "fundamental", "basic principle"];
  const advHits = advancedSignals.filter((s) => lowerText.includes(s.toLowerCase())).length;
  const introHits = introSignals.filter((s) => lowerText.includes(s.toLowerCase())).length;
  if (advHits >= 2) difficulty = "advanced";
  else if (introHits >= 2) difficulty = "introductory";

  // Suggest tags based on keyword patterns
  const tagPatterns: [string, string[]][] = [
    ["MoS₂", ["MoS2", "MoS₂", "molybdenum disulfide"]],
    ["光催化", ["photocatalysis", "photocatalytic", "光催化"]],
    ["异质结", ["heterojunction", "heterostructure", "异质结"]],
    ["DFT", ["DFT", "density functional", "first-principles", "VASP"]],
    ["单原子催化", ["single-atom", "single atom", "SAC", "单原子"]],
    ["缺陷工程", ["defect", "vacancy", "空位", "缺陷"]],
    ["CO₂还原", ["CO2 reduction", "CO₂ reduction", "carbon dioxide", "CO2RR"]],
    ["电催化", ["electrocatalysis", "ORR", "OER", "HER", "electrocatalytic"]],
    ["机器学习", ["machine learning", "ML", "neural network", "高通量"]],
    ["原位表征", ["in-situ", "in situ", "operando", "原位"]],
  ];

  const suggestedTags: string[] = tags.slice(0, 3);
  for (const [tag, patterns] of tagPatterns) {
    if (patterns.some((p) => lowerText.includes(p.toLowerCase())) && !suggestedTags.includes(tag)) {
      suggestedTags.push(tag);
    }
  }

  // Summary generation
  const sectionCount = sections.length;
  const summary = `${title.slice(0, 60)} — ${sectionCount}章节论文，涉及${suggestedTags.slice(0, 3).join("、")}等方向。建议${difficulty === "advanced" ? "在阅读课题组入门论文后再深入研读" : difficulty === "introductory" ? "作为入门阅读材料" : "配合相关失败案例分析阅读"}。`;

  return {
    summary,
    suggestedTags: suggestedTags.slice(0, 6),
    difficulty,
    relatedFailures: [],
    readingOrder: difficulty === "introductory" ? 1 : difficulty === "intermediate" ? 2 : 3,
  };
}

// ============================================================
// suggestReading — 基于用户兴趣+技能评分推荐论文
// ============================================================

export interface ReadingSuggestion {
  paperId: number;
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export function suggestReading(
  interests: string[],
  skillRatings: Record<string, number>,
  readPaperIds: number[]
): ReadingSuggestion[] {
  // Static recommendation pool with interest/skill matching
  const pool: { id: number; title: string; tags: string[]; skillReq: string[] }[] = [
    { id: 1, title: "MoS₂纳米片的缺陷工程调控及光催化性能研究", tags: ["MoS₂", "缺陷", "光催化"], skillReq: ["catalysis", "instrument"] },
    { id: 2, title: "Cu₂O/TiO₂异质结光催化还原CO₂的界面效应", tags: ["异质结", "CO₂还原", "Cu₂O"], skillReq: ["catalysis", "instrument"] },
    { id: 3, title: "单原子Fe-N-C催化剂的ORR活性位点识别", tags: ["单原子", "ORR", "Fe-N-C"], skillReq: ["catalysis", "programming"] },
    { id: 6, title: "机器学习指导的钙钛矿氧化物催化剂的发现与优化", tags: ["ML", "钙钛矿", "高通量"], skillReq: ["programming", "catalysis"] },
    { id: 8, title: "单原子Pt/CeO₂催化剂的水煤气变换反应机理研究", tags: ["单原子", "DFT", "Pt"], skillReq: ["solidState", "catalysis"] },
    { id: 4, title: "ZnO纳米线阵列光电催化分解水研究", tags: ["ZnO", "光电催化", "纳米线"], skillReq: ["catalysis", "instrument"] },
    { id: 5, title: "g-C₃N₄基Z型异质结光催化产氢研究", tags: ["g-C₃N₄", "Z型异质结", "产氢"], skillReq: ["catalysis"] },
    { id: 7, title: "金属有机框架(MOF)衍生碳基ORR催化剂研究", tags: ["MOF", "ORR", "碳基"], skillReq: ["catalysis", "writing"] },
    { id: 9, title: "二维过渡金属硫族化合物的相工程与催化应用", tags: ["TMD", "相变", "二维材料"], skillReq: ["solidState", "catalysis"] },
    { id: 10, title: "Co₃O₄/CeO₂复合氧化物催化CO氧化反应研究", tags: ["氧化物", "CO氧化", "CeO₂"], skillReq: ["catalysis", "instrument"] },
  ];

  const suggestions: ReadingSuggestion[] = [];

  for (const paper of pool) {
    if (readPaperIds.includes(paper.id)) continue;

    const interestMatch = interests.filter((i) =>
      paper.tags.some((t) => t.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(t.toLowerCase()))
    ).length;

    const avgSkill = paper.skillReq.reduce((sum, sk) => {
      const mappedKey = sk === "catalysis" ? "catalysis" : sk === "solidState" ? "solidState" : sk === "programming" ? "programming" : sk === "writing" ? "writing" : sk === "instrument" ? "instrument" : "english";
      return sum + (skillRatings[mappedKey] || 3);
    }, 0) / (paper.skillReq.length || 1);

    const score = interestMatch * 3 + avgSkill;
    if (interestMatch > 0 || avgSkill >= 3) {
      suggestions.push({
        paperId: paper.id,
        title: paper.title,
        reason: interestMatch > 1
          ? `与你的${interestMatch}个兴趣方向匹配`
          : avgSkill >= 4
            ? "适合你的技能水平"
            : "课题组推荐阅读",
        priority: score > 10 ? "high" : score > 6 ? "medium" : "low",
      });
    }
  }

  return suggestions.sort((a, b) => (a.priority === "high" ? -1 : a.priority === "medium" ? (b.priority === "high" ? 1 : -1) : 1)).slice(0, 5);
}

// ============================================================
// System Prompts (与Flask版保持一致)
// ============================================================

const BUILTIN_SYSTEM_PROMPT = `你是一位资深课题组导师的AI分身。你的学生正在科研中遇到问题来请教你。
你的职责不是直接给答案，而是像苏格拉底一样引导他们自己找到答案。

核心规则:
1. 永远不要在第一轮直接回答——先问学生对这个问题了解多少
2. 提出问题推动学生思考，而不是给出答案
3. 如果学生展示出独立思考，再揭示本课题组积累的相关知识
4. 保持鼓励和建设性的语气`;

const BUILTIN_SHOW_KNOWLEDGE_PROMPT = `你是课题组知识库的检索与展示助手。学生已经经过了思考阶段，现在需要展示相关知识。

规则:
1. 基于提供的检索内容回答学生的问题
2. 每条信息必须标注来源、置信度（高/中/低）、适用范围
3. 如果检索内容不足以回答，明确告知限制
4. 回答后提供2-3个更深入的思考方向`;

const BUILTIN_DEBATE_PROMPT = `你是学术辩论模式。你的角色是一位持相反观点的同行评审者。
你的目标不是打击学生，而是通过挑战帮他们发现论证的薄弱环节。

规则:
1. 针对学生的每一个论点，找到一个合理的反论点
2. 反论点必须基于真实的学术争议或已知的方法论陷阱
3. 用"我理解你的观点，但你是否考虑过..."的句式
4. 绝不攻击个人，只讨论学术问题
5. 每轮挑战后提供一个建设性的改进方向`;
