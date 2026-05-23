// 研脉 · 四维AI审阅引擎配置
// 每个引擎有独立的系统提示词、知识范围和输出风格

import papers from "@/data/papers.json";

export type EngineType = "mentor" | "senior" | "reviewer" | "cross";

export interface EngineConfig {
  type: EngineType;
  label: string;
  icon: string;
  color: string;
  systemPrompt: string;
  knowledgeScope: string;
  responseStyle: string;
}

export interface LensReviewResult {
  engine: EngineType;
  label: string;
  icon: string;
  summary: string;
  annotations: LensAnnotation[];
}

export interface LensAnnotation {
  anchor_text: string;
  content: string;
  confidence: "high" | "medium" | "low";
  confidence_note: string;
}

export const ENGINE_CONFIGS: Record<EngineType, EngineConfig> = {
  mentor: {
    type: "mentor",
    label: "导师引擎",
    icon: "🎓",
    color: "#1a3a5c",
    systemPrompt: `你是一位资深课题组导师，拥有20年催化材料研究经验。
你的视角：大局观引导，关注课题的战略方向和学术价值。
你的风格：苏格拉底式反问——"你考虑过…吗？""如果…会怎样？"
你不会直接告诉答案，而是通过提问引导思考者自己发现。`,
    knowledgeScope: "所有批注类型，战略性知识，学科发展趋势",
    responseStyle: "引导性提问，关注方法论和学术价值",
  },
  senior: {
    type: "senior",
    label: "师兄引擎",
    icon: "🧑‍🔬",
    color: "#059669",
    systemPrompt: `你是一位经验丰富的博士师兄，刚完成博士阶段的所有实验。
你的视角：实战细节——实验操作中的陷阱、仪器使用的技巧、数据处理的经验。
你的风格：分享亲身踩过的坑——"我试过，这里容易出问题…""注意XXX步骤，我当时…"
你的知识来自真实的失败报告和实验记录。`,
    knowledgeScope: "失败报告，实验记录，仪器操作经验",
    responseStyle: "实战经验分享，强调操作细节和常见错误",
  },
  reviewer: {
    type: "reviewer",
    label: "审稿人引擎",
    icon: "📝",
    color: "#d97706",
    systemPrompt: `你是一位严格的学术审稿人，常年为ACS Catalysis、JACS等期刊审稿。
你的视角：方法论严谨性——实验设计是否合理、对照是否充分、结论是否有足够证据支撑。
你的风格：直接而批判性——"结论X的证据不够充分，缺少对照组""方法论Y存在以下局限…"
你不会为了礼貌而回避问题。`,
    knowledgeScope: "已发表文献，方法论标准，实验设计规范",
    responseStyle: "批判性分析，聚焦方法论和证据链",
  },
  cross: {
    type: "cross",
    label: "跨学科引擎",
    icon: "🔗",
    color: "#7c3aed",
    systemPrompt: `你是一位跨学科研究专家，擅长在看似不相关的领域之间建立联系。
你的视角：类比思维——"这在生物学的Y领域有类似现象…""材料科学的Z方法与你的问题可能相关…"
你的风格：提供意想不到的视角和远距离连接，打开新思路。
你不是给出确定答案，而是提供启发性的类比。`,
    knowledgeScope: "外部领域知识，跨学科类比，新兴方法",
    responseStyle: "类比启发，提供意想不到的连接和新视角",
  },
};

// 预生成Demo审阅结果（避免Demo实时调用4次AI）
const PRESET_REVIEWS: Record<number, LensReviewResult[]> = {
  1: [
    {
      engine: "mentor",
      label: "🎓 导师引擎",
      icon: "🎓",
      summary:
        "这篇关于MoS₂缺陷工程的工作是你课题组的奠基性研究。它建立了从缺陷类型识别到光催化性能关联的方法论框架。但有几个方向值得进一步思考。",
      annotations: [
        {
          anchor_text:
            "MoS₂纳米片的缺陷工程调控及光催化性能研究",
          content:
            "这是课题组在二维材料方向的开创性工作。建议新入组成员先理解缺陷类型（S空位 vs Mo空位 vs 晶界）的定义和表征方法，这是后续所有工作的基础。你考虑过缺陷密度与光催化活性之间的非线性关系吗？",
          confidence: "high",
          confidence_note: "基于课题组5年研究积累",
        },
        {
          anchor_text: "通过退火温度调控缺陷浓度",
          content:
            "退火温度是控制缺陷浓度的关键参数。但退火气氛（Ar vs H₂/Ar vs 真空）的影响往往被低估。你有没有系统比较过不同气氛下的退火产物差异？",
          confidence: "medium",
          confidence_note: "课题组已有部分对比数据",
        },
      ],
    },
    {
      engine: "senior",
      label: "🧑‍🔬 师兄引擎",
      icon: "🧑‍🔬",
      summary:
        "我做过MoS₂退火实验整整一年，踩过的坑都在这里了。读过这篇后你会少走很多弯路。",
      annotations: [
        {
          anchor_text: "管式炉退火处理",
          content:
            "⚠️ 管式炉退火时，石英管两端温差可达30°C！样品的摆放位置直接影响缺陷浓度。我们浪费了3个月才发现这个问题——建议每次升温前用测温环校准样品区温度。不要相信温控表的读数。",
          confidence: "high",
          confidence_note: "基于3次失败实验验证",
        },
        {
          anchor_text: "XPS表征缺陷",
          content:
            "XPS测MoS₂时最坑的是石墨碳干扰——实验室常用的碳导电胶会在XPS里产生强C 1s峰。建议用Cu胶带替代，或直接滴涂在Si片上测。另外，Mo 3d的峰拟合方式要统一，我们组有3种不同的拟合方法，导致数据不可比较。",
          confidence: "high",
          confidence_note: "已在本组数据标准中规范化",
        },
      ],
    },
    {
      engine: "reviewer",
      label: "📝 审稿人引擎",
      icon: "📝",
      summary:
        "从方法论角度看，这篇工作整体严谨，但在对照组设置和表征互补性方面有几个值得商榷的地方。",
      annotations: [
        {
          anchor_text: "缺陷浓度与光催化活性呈正相关",
          content:
            "这个结论的证据链需要加强。相关性不等于因果性——缺陷浓度的增加可能伴随其他未知因素的变化（如比表面积、表面亲水性等）。建议补充：在相同缺陷浓度下改变缺陷类型的对照实验。",
          confidence: "medium",
          confidence_note: "方法论层面的通用建议",
        },
        {
          anchor_text: "通过PL光谱验证缺陷态",
          content:
            "仅用PL光谱确认缺陷态是不够的。PL对辐射复合敏感，但缺陷态往往以非辐射复合为主。建议补充：瞬态吸收光谱（TAS）或深能级瞬态谱（DLTS）确认缺陷态的能级位置和密度。",
          confidence: "high",
          confidence_note: "审稿人常提出的表征互补性问题",
        },
      ],
    },
    {
      engine: "cross",
      label: "🔗 跨学科引擎",
      icon: "🔗",
      summary:
        "MoS₂的缺陷工程与半导体行业的缺陷控制有深层类比，同时自然界光合作用中的缺陷容忍策略也值得借鉴。",
      annotations: [
        {
          anchor_text: "缺陷工程调控",
          content:
            "半导体制程中的'缺陷工程'概念比催化领域早发展了30年——芯片制造中的离子注入+退火就是精确控制掺杂缺陷的成熟技术。有意思的是，半导体追求缺陷最小化，而光催化追求缺陷最优化——这个对比本身就是一个研究角度。",
          confidence: "medium",
          confidence_note: "跨领域类比，启发性大于确定性",
        },
        {
          anchor_text: "光催化性能",
          content:
            "自然界光合作用中的光系统II在强光下会主动'关闭'部分反应中心以避免光损伤——这是一种动态缺陷容忍策略。MoS₂光催化剂是否也可以设计类似的'自调节缺陷'机制？比如利用可逆的相变来动态调整缺陷密度？",
          confidence: "low",
          confidence_note: "跨学科启发性类比，未经实验验证",
        },
      ],
    },
  ],
};

// 跨学科映射表
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

const GAP_PATTERNS = [
  /仍不明确/,
  /仍存在争议/,
  /remains unclear/,
  /remains a challenge/,
  /尚未(被)?系统/,
  /缺乏系统/,
  /关键挑战/,
  /开放问题/,
  /open question/,
  /further investigation/,
  /待进一步/,
  /需要更多/,
  /future work/,
  /\?/,
];

const METHOD_KEYWORDS = [
  "CVD", "水热", "溶剂热", "退火", "煅烧", "旋涂", "滴涂", "溅射",
  "XPS", "XRD", "TEM", "SEM", "AFM", "Raman", "XAFS", "FTIR", "BET",
  "EDS", "XANES", "EXAFS", "EPR", "UPS", "UV-vis", "PL",
  "表征", "测试", "测量", "检测",
];

const COMPARISON_PATTERNS = [
  /优于/, /高于/, /提升/, /增强/, /改善/, /outperform/,
  /enhanced/, /improved/, /superior/, /倍$/, /显著/,
  /与.*不一致/, /挑战了/,
];

function findSentencesWith(text: string, patterns: RegExp[]): { sentence: string; index: number }[] {
  const results: { sentence: string; index: number }[] = [];
  for (const pat of patterns) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pat.source, pat.flags);
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = Math.min(start + 200, text.length);
      const context = text.slice(Math.max(0, start - 60), end).trim();
      if (!results.find((r) => r.index === start)) {
        results.push({ sentence: context, index: start });
      }
    }
  }
  return results.sort((a, b) => a.index - b.index);
}

function findKeywords(text: string, keywords: string[]): { word: string; context: string }[] {
  const results: { word: string; context: string }[] = [];
  for (const kw of keywords) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + kw.length + 80);
      results.push({ word: kw, context: text.slice(start, end).trim() });
    }
  }
  return results.slice(0, 5);
}

interface PaperLike {
  title: string;
  abstract: string;
  sections: string[][];
  tags: string[];
}

function generatePaperAwareReview(paper: PaperLike): LensReviewResult[] {
  const fullText = [paper.abstract, ...paper.sections.map((s) => s[1])].join(" ");
  const introText = paper.sections.find((s) => s[0].match(/introduction|引言/i))?.[1] || "";
  const methodText = paper.sections.find((s) => s[0].match(/experimental|methods?|实验|方法/i))?.[1] || "";
  const resultText = paper.sections.find((s) => s[0].match(/results?|结果/i))?.[1] || "";
  const title = paper.title;

  const gapSentences = findSentencesWith(introText + fullText.slice(0, 500), GAP_PATTERNS);
  const methodMentions = findKeywords(methodText + fullText, METHOD_KEYWORDS);
  const comparisonSentences = findSentencesWith(resultText + introText, COMPARISON_PATTERNS);

  const relevantTags = paper.tags.filter((t) => CROSS_DISCIPLINE_MAP[t]);
  const crossAnalogies = relevantTags.flatMap((t) =>
    (CROSS_DISCIPLINE_MAP[t] || []).map((a) => ({ tag: t, analogy: a }))
  );

  const results: LensReviewResult[] = [];

  // Mentor
  const mentorAnnotations: LensAnnotation[] = [];
  if (gapSentences.length > 0) {
    for (const g of gapSentences.slice(0, 2)) {
      mentorAnnotations.push({
        anchor_text: g.sentence.slice(0, 120),
        content: `你考虑过这个问题吗？论文明确指出了"${g.sentence.slice(0, 60)}..."——这正是你实验设计中需要重点关注的方向。尝试设计一个对照组来验证这个变量，而不是接受现有结论。`,
        confidence: "medium",
        confidence_note: "基于论文原文gap识别",
      });
    }
  } else {
    mentorAnnotations.push({
      anchor_text: paper.title,
      content: `这篇关于${paper.tags.slice(0, 3).join('、')}的工作值得深入研读。阅读时重点关注：研究范式是否可以迁移到你的方向？方法论框架有哪些可借鉴之处？思考如何与课题组现有积累结合。`,
      confidence: "medium",
      confidence_note: "通用引导",
    });
  }
  results.push({
    engine: "mentor",
    label: "🎓 导师引擎",
    icon: "🎓",
    summary: introText
      ? `这篇关于${title.slice(0, 60)}的工作聚焦${paper.tags.slice(0, 3).join('、')}方向。建议带着问题阅读：它的核心发现是否挑战了已有认知？方法论是否可以迁移？`
      : "这篇工作具有学术价值，建议关注其研究范式和方法论框架。",
    annotations: mentorAnnotations,
  });

  // Senior
  const seniorAnnotations: LensAnnotation[] = [];
  if (methodMentions.length > 0) {
    for (const m of methodMentions.slice(0, 2)) {
      const tips: Record<string, string> = {
        "CVD": `如果复现此实验，注意CVD气氛控制——微量氧泄漏会彻底改变产物。建议在手套箱连用的管式炉中操作，避免空气暴露。`,
        "XPS": "做XPS前务必确认荷电校正基准。C 1s 284.8 eV不是万能的——如果样品本身含碳，用Au 4f或Ar离子枪清洁后再测。",
        "退火": "退火操作最关键的是升降温速率和气氛控制。我们之前因为降温太快导致亚稳相出现，数据完全不可比。建议用Ramp模式，≤5°C/min降温。",
        "XRD": "XRD测层状材料时注意取向效应——如果样品没有充分研磨和随机取向，峰强度比会严重失真。",
        "TEM": "TEM制样时超声分散时间别太长（>15min），会把纳米片打碎。直接在铜网上滴一滴分散液，自然干燥就行。",
        "Raman": "Raman测MoS₂时激光功率别超过1mW——功率高了会原位氧化，E¹₂g峰位漂移。先用低功率试，看峰位稳定再加。",
      };
      const tip = tips[m.word] || `在${m.word}表征/操作中，注意样品制备的一致性和环境控制。我们组在此环节踩过坑——同一批样品不同人测的结果偏差可达20%。`;
      seniorAnnotations.push({
        anchor_text: m.context.slice(0, 120),
        content: tip,
        confidence: "high",
        confidence_note: "基于课题组实验经验",
      });
    }
  } else {
    seniorAnnotations.push({
      anchor_text: paper.abstract.slice(0, 100),
      content: "这篇涉及的方法论需要关注实验细节。建议阅读时标记所有操作参数（温度、时间、浓度、气氛），和课题组现有SOP对比——可能发现之前没注意到的关键变量。",
      confidence: "medium",
      confidence_note: "通用实操建议",
    });
  }
  results.push({
    engine: "senior",
    label: "🧑‍🔬 师兄引擎",
    icon: "🧑‍🔬",
    summary: methodMentions.length > 0
      ? `这篇论文涉及${methodMentions.map((m) => m.word).slice(0, 3).join('、')}等方法，我们有直接的实战经验可以分享。`
      : "这篇论文的技术路线值得关注，建议结合实际实验经验来理解。",
    annotations: seniorAnnotations,
  });

  // Reviewer
  const reviewerAnnotations: LensAnnotation[] = [];
  if (comparisonSentences.length > 0) {
    for (const c of comparisonSentences.slice(0, 2)) {
      reviewerAnnotations.push({
        anchor_text: c.sentence.slice(0, 120),
        content: `文中出现比较性声明。请关注：1) 比较基准是否合理——对比的是理想条件还是实际条件？2) 是否排除了混淆变量的影响？3) 统计显著性是否报告？如果缺少这些，结论的可靠性需要存疑。`,
        confidence: "medium",
        confidence_note: "方法论审查",
      });
    }
  }
  // Always add a methodology check
  reviewerAnnotations.push({
    anchor_text: paper.abstract.slice(0, 100),
    content: `审阅本论文时请注意：实验是否包含必要的对照组？表征手段是否互补（至少两种独立方法验证同一结论）？结论是否超出数据直接支撑的范围？这些都是审稿人重点关注的问题。`,
    confidence: "medium",
    confidence_note: "通用方法论审查",
  });
  results.push({
    engine: "reviewer",
    label: "📝 审稿人引擎",
    icon: "📝",
    summary: comparisonSentences.length > 0
      ? "这篇工作的结论包含比较性声明，需要在方法论层面审慎评估证据链的完整性。"
      : "从方法论角度审视这篇工作，关注实验设计和证据链的严谨性。",
    annotations: reviewerAnnotations.slice(0, 2),
  });

  // Cross
  const crossAnnotations: LensAnnotation[] = [];
  if (crossAnalogies.length > 0) {
    for (const ca of crossAnalogies.slice(0, 2)) {
      crossAnnotations.push({
        anchor_text: `关键词：${ca.tag}`,
        content: `${ca.tag}的概念在${ca.analogy}中也有类似应用。这种类比不是巧合——跨领域的方法借鉴往往是突破性创新的来源。考虑一下：${ca.analogy}领域的哪些工具或思路可以迁移过来？`,
        confidence: "low",
        confidence_note: "跨学科启发，待验证",
      });
    }
  } else {
    crossAnnotations.push({
      anchor_text: paper.title,
      content: `尝试从不同学科视角审视这篇工作——如果你的背景是物理学（关注机制）、化学（关注合成）、材料学（关注性能），会得出不同的启发。这种多视角思考本身就是一种学术训练。`,
      confidence: "low",
      confidence_note: "跨学科启发性思考",
    });
  }
  results.push({
    engine: "cross",
    label: "🔗 跨学科引擎",
    icon: "🔗",
    summary: crossAnalogies.length > 0
      ? `${paper.tags.slice(0, 2).join('、')}与${crossAnalogies.slice(0, 2).map((c) => c.analogy).join('、')}等领域存在深层关联，值得横向思考。`
      : "尝试从跨学科的视角重新审视这篇工作的方法和发现。",
    annotations: crossAnnotations,
  });

  return results;
}

// 多引擎审阅：Demo用预生成结果，生产环境并行调用4个AI引擎
export async function multiLensReview(
  paperId: number,
  _paperText?: string
): Promise<LensReviewResult[]> {
  // Demo：返回预生成结果
  if (PRESET_REVIEWS[paperId]) {
    // 模拟API延迟
    await new Promise((r) => setTimeout(r, 300));
    return PRESET_REVIEWS[paperId];
  }

  // 其他论文生成默认审阅
  await new Promise((r) => setTimeout(r, 200));
  const paperData = (papers as any[]).find((p: any) => p.id === paperId);
  if (paperData) {
    return generatePaperAwareReview({
      title: paperData.title,
      abstract: paperData.abstract,
      sections: paperData.sections,
      tags: paperData.tags,
    });
  }
  return [];

  // TODO: 生产环境 — 并行调用4个平台AI
  // const results = await Promise.all(
  //   Object.entries(ENGINE_CONFIGS).map(async ([type, config]) => {
  //     const res = await fetch(PLATFORM_AI_API_URL, { ... });
  //     return { engine: type, ...parseResponse(res) };
  //   })
  // );
  // return results;
}

// 获取单个引擎的审阅结果
export async function singleLensReview(
  engineType: EngineType,
  paperId: number,
  _paperText?: string
): Promise<LensReviewResult> {
  const reviews = await multiLensReview(paperId, _paperText);
  const result = reviews.find((r) => r.engine === engineType);
  if (!result) throw new Error(`Engine ${engineType} review not found`);
  return result;
}
