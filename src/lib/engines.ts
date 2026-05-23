// 研脉 · 四维AI审阅引擎配置
// 每个引擎有独立的系统提示词、知识范围和输出风格

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

// 为其他论文生成默认审阅
function generateDefaultReview(paperId: number): LensReviewResult[] {
  const engines = ["mentor", "senior", "reviewer", "cross"] as const;
  const labels: Record<string, string> = {
    mentor: "🎓 导师引擎",
    senior: "🧑‍🔬 师兄引擎",
    reviewer: "📝 审稿人引擎",
    cross: "🔗 跨学科引擎",
  };
  const summaries: Record<string, string> = {
    mentor:
      "这篇工作的研究方向具有重要的学术价值。在阅读时，请关注其研究范式和方法论框架，思考如何与课题组现有方向结合。",
    senior:
      "这篇论文涉及的方法我部分实践过，有些操作细节值得注意。建议结合课题组积累的实验经验来理解。",
    reviewer:
      "从方法论角度看，这篇工作的实验设计有可取之处，但也存在一些需要注意的局限性。",
    cross: "这篇工作的方法和思路与其他领域有一些有趣的关联，值得从跨学科角度思考潜在的新方向。",
  };

  return engines.map((engine) => ({
    engine,
    label: labels[engine],
    icon: ENGINE_CONFIGS[engine].icon,
    summary: summaries[engine],
    annotations: [
      {
        anchor_text: "（论文摘要关键词）",
        content: `[${ENGINE_CONFIGS[engine].label}] 对论文#${paperId}的审阅：此论文可纳入课题组知识库进行深入研读。具体批注将在学生阅读过程中动态浮现。`,
        confidence: "medium" as const,
        confidence_note: "通用审阅，待深度分析",
      },
    ],
  }));
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
  return generateDefaultReview(paperId);

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
