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
    icon: "",
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
    icon: "",
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
    icon: "",
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
    icon: "",
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
      label: "导师引擎",
      icon: "",
      summary:
        "这篇关于微服务拆分粒度的实证研究是你课题组在软件架构方向的开创性工作。它建立了从DDD限界上下文到BCA量化评估的方法论桥梁。但有几个方向值得进一步思考。",
      annotations: [
        {
          anchor_text:
            "微服务拆分粒度对系统可维护性的影响研究",
          content:
            "这是课题组在软件架构方向的奠基性研究。建议新入组成员先理解DDD的限界上下文(Bounded Context)和聚合根(Aggregate Root)的概念——这是后续评估拆分合理性的理论基础。你考虑过组织架构（团队拓扑）对拆分决策的约束吗？康威定律在这里的影响可能比技术指标更大。",
          confidence: "high",
          confidence_note: "基于课题组5年架构研究积累",
        },
        {
          anchor_text: "超过60%的微服务迁移项目在第一年内经历了至少一次重大的服务边界重构",
          content:
            "这个数据触目惊心。但边界重构不一定意味着失败——它可能反映了团队对业务领域理解的深化。关键问题是：重构的代价有多大？如果边界调整需要大量数据迁移和API重写，那就是拆分决策的问题。你有没有分析过哪些类型的拆分错误最容易导致高代价重构？",
          confidence: "medium",
          confidence_note: "课题组已有部分重构代价的案例数据",
        },
      ],
    },
    {
      engine: "senior",
      label: "师兄引擎",
      icon: "",
      summary:
        "我参与过把电商平台从单体拆成微服务的项目，踩过的坑都在这里了。读过这篇后你会少走很多弯路。",
      annotations: [
        {
          anchor_text: "BCA = (限界上下文内聚度 × 数据局部性) / (跨服务耦合度 × 分布式事务比例)",
          content:
            "BCA公式看起来很美，但实际项目中数据局部性很难衡量——因为数据库分片策略通常是渐进演化的。我的经验：与其计算精确的BCA，不如先画一张服务间的运行时依赖图（用Jaeger的Service Dependency Graph）。如果依赖图看起来像意大利面——环形依赖、长链调用——BCA一定低。先治标（打破循环依赖）再治本（重新划分边界）。",
          confidence: "high",
          confidence_note: "基于实际微服务迁移项目经验",
        },
        {
          anchor_text: "Jaeger收集了6个月的运维数据",
          content:
            "Jaeger的数据量在微服务架构下增长非常快——我们之前1天就产生200GB的trace数据。生产环境必须配置采样策略：对于健康检查类的请求(约占流量的40%)完全跳过；对于正常请求使用probabilistic sampling 10%；对于错误和慢请求保留100%。这样能把数据量控制在5GB/天以内，还能捕获所有异常。",
          confidence: "high",
          confidence_note: "基于生产环境运维经验",
        },
      ],
    },
    {
      engine: "reviewer",
      label: "审稿人引擎",
      icon: "",
      summary:
        "从方法论角度看，这篇工作整体严谨，但在样本选择偏差和外部效度方面有几个值得商榷的地方。",
      annotations: [
        {
          anchor_text: "BCA指标与系统可维护性（以平均故障恢复时间MTTR衡量）呈显著正相关(r=0.78)",
          content:
            "这个结论的证据链需要加强。r=0.78是强相关，但相关性不等于因果性——可能存在confounding factor。例如，BCA高的项目往往团队工程成熟度也高（能理解DDD概念并付诸实践），MTTR低可能是因为团队能力强而非拆分合理。建议控制团队经验年限、CI成熟度和自动化测试覆盖率等变量后重新分析。",
          confidence: "medium",
          confidence_note: "方法论层面的通用建议——相关性vs因果性",
        },
        {
          anchor_text: "12个工业级微服务系统",
          content:
            "12个项目的样本量在实证软件工程研究中处于可接受范围，但三个行业（电商、金融、物流）各4个项目可能导致行业特定效应与拆分效果混淆。建议：在跨行业分析中明确将行业作为控制变量，并报告每个行业内的效应大小（effect size）而非仅报告总体相关性。",
          confidence: "high",
          confidence_note: "审稿人常提出的样本代表性问题",
        },
      ],
    },
    {
      engine: "cross",
      label: "跨学科引擎",
      icon: "",
      summary:
        "微服务的服务边界决策与城市功能区规划、细胞信号通路模块化存在深层类比，这些跨领域的划分智慧值得借鉴。",
      annotations: [
        {
          anchor_text: "限界上下文(Bounded Context)",
          content:
            "DDD的限界上下文概念与城市规划中的功能区划分惊人地相似——一个城市的商业区、工业区、住宅区各自有独立的规划逻辑和演变节奏。城市如果在商业区中间插了一个工厂，就像微服务中把支付逻辑嵌在用户服务里一样别扭。有意思的是，城市规划中也有类似微服务的'数据局部性'原则——商业区需要靠近交通枢纽（减少通信开销），工业区需要靠近原材料（数据的自然归属）。",
          confidence: "medium",
          confidence_note: "跨领域类比，启发性大于确定性",
        },
        {
          anchor_text: "分布式事务",
          content:
            "微服务的分布式事务管理让人联想到生物体中的细胞间通信——每个细胞是一个独立的服务单元，通过化学信号（激素/神经递质）而非共享内存来协调。生物体对'分布式事务失败'有惊人的容错能力：单个细胞的信号丢失不会导致整个系统崩溃，而是通过冗余信号通路和负反馈机制来维持稳态。微服务架构是否也可以借鉴这种生物学的鲁棒性设计？",
          confidence: "low",
          confidence_note: "跨学科启发性类比，未经工程验证",
        },
      ],
    },
  ],
};

// 跨学科映射表
const CROSS_DISCIPLINE_MAP: Record<string, string[]> = {
  "微服务": ["康威定律与组织结构映射", "市政规划功能区划分", "细胞生物学信号通路模块化"],
  "分布式系统": ["区块链拜占庭将军问题", "议会投票与法定人数机制", "蚁群觅食的分布式决策"],
  "LLM推理": ["编译器JIT即时编译优化", "数据库查询计划缓存", "CPU分支预测与推测执行"],
  "向量检索": ["图书馆分类法与索书号", "大脑海马体记忆索引", "物流分拣系统的路径优化"],
  "React": ["打印机预渲染页面描述", "PDF流式加载与渐进渲染", "视频播放器的自适应码率切换"],
  "SSR": ["传统CGI服务端渲染", "报纸印刷的模板排布", "CAD工程图的服务器端光栅化"],
  "Kubernetes": ["机场航班调度与登机口分配", "电网负载均衡与削峰填谷", "医院手术室排班调度"],
  "CI/CD": ["汽车产线的自动化装配", "新闻编辑部的采编发流水线", "航空签派放行检查单"],
  "WebAssembly": ["JVM字节码跨平台执行", "游戏主机模拟器的指令翻译", "FPGA的硬件加速描述"],
  "MLOps": ["制药行业的GMP质量规范", "航天任务的发射checklist", "金融风控模型的持续验证"],
  "CRDT": ["Git三路合并与冲突解决", "区块链的分布式账本同步", "Wikipedia多人编辑的冲突协商"],
  "软件架构": ["建筑设计的结构工程学", "城市的综合管廊规划", "交响乐的配器与声部编排"],
  "性能优化": ["F1赛车的轻量化设计", "航空发动机的推重比优化", "餐厅后厨的出餐流程优化"],
  "边缘计算": ["加油站的分布式储油", "快递驿站的最后一公里", "CDN的内容就近分发"],
  "协同编辑": ["交响乐团的多声部协作", "多人在线游戏的同步机制", "航空管制的多席位协调"],
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
  "Docker", "K8s", "React", "Next.js", "TypeScript", "Rust", "Webpack", "Vite",
  "Redis", "PostgreSQL", "Elasticsearch", "Prometheus", "Grafana",
  "gRPC", "GraphQL", "WebSocket", "WASM", "Nginx", "CI/CD", "Git",
  "Terraform", "OAuth", "JWT", "REST", "SSR", "CSR", "ISR", "HPA",
  "微服务", "分布式", "云原生", "容器化", "性能优化", "代码审查",
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
    label: " 导师引擎",
    icon: "",
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
        "Docker": "如果复现此实验，注意Docker构建缓存——不合理的Dockerfile层顺序会导致每次构建都重新安装依赖，CI时间从3分钟膨胀到15分钟。建议将package.json COPY放在代码COPY之前，利用BuildKit的层缓存。另外，不要在生产镜像中保留构建工具（npm devDependencies），使用多阶段构建分离build和runtime。",
        "K8s": "K8s部署最容易被忽略的是resource requests/limits配置。没设requests的Pod在节点压力下最先被驱逐——你的生产服务可能在凌晨莫名其妙重启。建议至少设置requests=limits的70%，并且对关键服务使用Guaranteed QoS（requests==limits）。另外，liveness probe的initialDelaySeconds一定要大于应用的实际启动时间——我们之前就因为启动慢于probe导致Pod反复重启。",
        "Prometheus": "Prometheus的scrape_interval不是越短越好——15s对大多数指标足够了。缩短到5s以下会导致：(1)Prometheus本身CPU翻倍；(2)时间序列基数爆炸（每新增一个target就是几百条新series）；(3)存储需求指数增长。真正需要高频率采样的指标（如请求延迟p99）应该用Histogram的_sum和_count来计算，不需要提高scrape频率。",
        "PostgreSQL": "PostgreSQL的查询优化器有时会选择次优计划——特别是涉及多表JOIN和子查询时。不要盲目相信EXPLAIN的输出（它是估算不是实际），使用EXPLAIN ANALYZE看实际执行时间。如果优化器选错索引，可以用pg_hint_plan强制指定。另外，vacuum频率不够是慢查询的常见元凶——定期检查pg_stat_user_tables中dead tuple占比，超过10%就该vacuum了。",
        "Redis": "Redis的热key问题是分布式缓存的经典陷阱。某个key被频繁访问时，所有请求打在同一个节点上，即使集群有10个节点也只有1个在工作。解决方案：(1)本地缓存(如Caffeine)做第一层防御；(2)对热key做replication，客户端随机选择一个副本读取；(3)使用Redis 7的key spec（如TS-{user_id}）让同一用户的key分布到不同slot。",
        "CI/CD": "CI管道设计中最容易被滥用的就是缓存——缓存过大或不正确的缓存键会导致：(1)构建产物包含过期依赖；(2)缓存恢复时间超过重新构建的时间；(3)缓存命中率低但占用大存储空间。建议：npm/pip的依赖缓存设置max-size限制，定期清理；Docker层缓存只在base image变化时才失效；Git LFS的大文件不要缓存。",
        "TypeScript": "TypeScript的strict: true是团队协作的最低要求——没有strict类型检查的TS项目比JS好不到哪去。特别是strictNullChecks——这是消除Cannot read property of undefined类bug的唯一方法。如果老项目迁移strict成本太高，至少开启noImplicitAny和strictNullChecks两个最关键的选项。毕竟一个类型检查器的价值主要由它捕获的运行时错误数量决定。",
        "React": "React性能调优有个反直觉的规则：不要过早使用useMemo/useCallback。先把组件拆小、把状态放低（lifting state down），让每个组件自然地不依赖不变的数据。useMemo的diff开销有时比重新计算还大——只有当计算复杂度O(n>1000)或引用稳定性影响子组件memo时才使用。React DevTools Profiler是你的朋友——先测量再优化。",
      };
      const tip = tips[m.word] || `在${m.word}的使用中，注意文档和最佳实践的遵循。我们在实际项目中踩过坑——配置不当或不合理的架构选择可能导致线上故障。建议参考官方文档和生产案例，结合自己的场景做取舍。`;
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
    label: "师兄引擎",
    icon: "",
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
    label: " 审稿人引擎",
    icon: "",
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
    label: " 跨学科引擎",
    icon: "",
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
