// 研脉 · 前端种子数据 (从Flask版app.py迁移)
// Demo阶段直接使用，生产环境替换为Supabase查询

export interface ChatSceneDef {
  id: number;
  title: string;
  icon: string;
  mode: "think" | "debate";
  description: string;
  messages: { role: "ai" | "user"; text: string }[];
}

export const CHAT_SCENES: ChatSceneDef[] = [
  {
    id: 1,
    title: "论文研读引导",
    icon: "",
    mode: "think",
    description: "阅读论文时AI先提问引导再展示批注",
    messages: [
      { role: "ai", text: "我注意到你在读微服务拆分粒度的论文。在展示张明远的架构重构经验之前，想先问你：<b>你觉得决定服务拆分粒度最关键的因素是什么？为什么？</b>" },
      { role: "user", text: "业务逻辑的内聚性吧，相关的功能放在一起" },
      { role: "ai", text: "合理的思路。追问一句——<b>如果一个功能的子模块变更频率完全不同（如支付费率每月改 vs 订单流程半年不改），应该拆开吗？</b>" },
      { role: "user", text: "应该拆开？因为变更频率不同会互相影响" },
      { role: "ai", text: "<b>是的。</b>现在展示张明远2024年3月的架构复盘：<br><br><i>\"把订单和支付拆成两个服务是我们做过最痛苦的决定。订单创建和支付扣款本来在一个事务里，拆分后要用Saga协调——大促时补偿事务大量失败。最后还是合回去了。\"</i><br><br>他还补充：<i>\"一个服务应该能在一个迭代(2周)内被一个开发者完全理解和修改。超过10000行的服务，认知负荷和信息隐藏开始失效。\"</i><br><br>建议：先画服务间的运行时依赖图。如果看起来像意大利面——环形依赖、长链调用——BCA一定低。先治标再治本。" },
    ],
  },
  {
    id: 2,
    title: "实验方案设计",
    icon: "",
    mode: "think",
    description: "设计架构方案时AI引导避坑",
    messages: [
      { role: "ai", text: "你想为SaaS产品设计SSR方案。<b>你打算用Next.js的哪个渲染策略？选择这个策略的主要理由是什么？</b>" },
      { role: "user", text: "SSR吧，SEO友好而且首屏加载快" },
      { role: "ai", text: "选择主流方案是务实的。但我追问：<b>全站SSR对服务器资源有什么影响？你的页面中有多少内容对每个用户是不同的（个性化）？</b>" },
      { role: "user", text: "大部分是公用的，只有用户头像和购物车是个性化的" },
      { role: "ai", text: "好问题。本组研究过类似场景。李华2025.03故障复盘：<br><br><i>\"全量SSR渲染2000个产品页，Node.js内存从500MB线性增长到2GB导致OOMKilled。闭包泄漏和PurgeCSS临时buffer是两个主要泄漏源。\"</i><br><br>王芳建议：<i>\"用RSC在组件级别控制渲染位置——默认服务端渲染，只有交互组件标记'use client'。首屏TTI从7.2s降到4.1s。但必须设置Sentry追踪hydration mismatch。\"</i><br><br>建议从ISR开始——产品页1小时revalidate一次，个性化部分用客户端Suspense包裹。" },
    ],
  },
  {
    id: 3,
    title: "数据分析引导",
    icon: "",
    mode: "think",
    description: "处理数据时AI提醒常见陷阱",
    messages: [
      { role: "ai", text: "你在排查一个API接口响应超过2秒的问题，准备看PostgreSQL慢查询日志。<b>你确认过是数据库慢还是网络延迟吗？加过APM追踪了吗？</b>" },
      { role: "user", text: "看了Nginx access log，response_time确实2s+。还没加APM" },
      { role: "ai", text: "那么瓶颈至少有三种可能：①SQL本身慢（缺索引/全表扫描）②数据库连接池耗尽排队 ③N+1查询被循环放大。<b>你倾向于先排查哪个方向？</b>" },
      { role: "user", text: "先看慢查询日志，应该能找到具体SQL" },
      { role: "ai", text: "这是正确的起点。但王芳2025.07踩过一个坑：<br><br><i>\"EXPLAIN ANALYZE显示用了索引，但实际执行还是慢。发现是work_mem太小导致磁盘排序——Bitmap Heap Scan花了1.8s。调大work_mem后降到12ms。\"</i><br><br>陈老师建议：<i>\"永远不要只看慢查询日志——同时抓pg_stat_statements的shared_blks_read。高块读说明缓冲池不够，问题在内存不在SQL。\"</i><br><br> 先用EXPLAIN (ANALYZE, BUFFERS)看真实执行计划——有时规划器的行数估计和实际差几个数量级。" },
    ],
  },
  {
    id: 4,
    title: "文献综述引导",
    icon: "",
    mode: "think",
    description: "写综述时AI提醒文献质量判断",
    messages: [
      { role: "ai", text: "准备写分布式共识算法的文献综述。<b>Raft和Paxos的核心区别是什么？在什么场景下Raft的领导者选举会比Paxos更优？</b>" },
      { role: "user", text: "Raft强调可理解性，把共识拆成领导者选举、日志复制、安全性三个独立子问题。Paxos更通用但更难实现" },
      { role: "ai", text: "方向对。但容易被忽略的维度——<b>性能方面呢？Multi-Paxos和Raft在高负载下的吞吐量差异你关注过吗？</b>" },
      { role: "user", text: "好像Multi-Paxos可以并行提交，Raft只能串行？" },
      { role: "ai", text: "<b>对了一部分。</b>但很多文献的benchmark条件不一致。陈老师(2024.09)审稿批注：<br><br><i>\"比较共识算法时，首先要看实验的磁盘配置。SSD vs HDD对日志刷盘延迟的影响可能比算法本身差异更大。很多早期Paxos论文用HDD跑实验，对比Raft在SSD上的数据——这不公平。\"</i><br><br>张明远做etcd性能优化时发现：<i>\"Raft的批处理(batch)参数对吞吐影响巨大——默认50ms的batch interval在高并发下成为瓶颈。调成5ms后吞吐翻倍但延迟抖动增加。这不是算法问题，是实现参数问题。\"</i><br><br> 写综述时标注每篇论文的实验硬件配置和关键参数——这是判断结论可迁移性的基础。" },
    ],
  },
  {
    id: 5,
    title: "职业规划引导",
    icon: "",
    mode: "think",
    description: "毕业生参考前人就业路径",
    messages: [
      { role: "ai", text: "你在考虑硕士毕业后方向。<b>读研期间最让你有成就感的时刻是什么？——不是别人觉得厉害，是你自己觉得\"这事做得真好\"。</b>" },
      { role: "user", text: "第一次在组会上独立分析清楚一个复杂数据的时候" },
      { role: "ai", text: "那是有价值的线索。<b>如果未来工作能持续获得这种\"把复杂问题理清楚\"的正反馈，更倾向学术界基础研究还是工业界应用开发？</b>" },
      { role: "user", text: "想去工业界但不确定具体做什么" },
      { role: "ai", text: "了解前人路径，但不必照搬。本组近5年去向：<br><br>• 张明远(2023硕) → 字节跳动基础架构<br>  <i>\"分布式系统+数据库内核最让我兴奋\"</i><br>• 王磊(2022硕) → 蚂蚁集团中间件<br>• 刘洋(2021硕) → 高校信息化中心<br><br>张明远建议：<i>\"工业界后端团队分两类——业务开发（快速迭代+领域建模）和基础设施（分布式系统+性能优化）。想清楚你享受的是从零搭建一个系统还是把现有系统做到极致稳定。\"</i><br><br> 对\"分布式+AI\"交叉感兴趣的话可以了解GPU集群调度和MLSys方向。" },
    ],
  },
  {
    id: 6,
    title: "思维挑战模式",
    icon: "",
    mode: "debate",
    description: "AI扮演反对者进行学术辩论",
    messages: [
      { role: "ai", text: "<b>思维挑战模式已激活</b><br>你说你的实验结果表明微服务越细粒度系统可维护性越好。我理解你的结论，但我想挑战你：<b>你确定服务粒度是唯一变量吗？拆服务的同时你们有没有也改了部署流程、监控体系、或者团队结构？这些混淆变量可能才是可维护性改善的真正原因。</b>" },
      { role: "user", text: "我们用API网关的请求量变化和PR合并频率来量化可维护性，拆分成8个服务后两个指标都改善了" },
      { role: "ai", text: "PR合并频率和API请求量都是聚合指标。但拆分后不同服务的变更节奏差异巨大——<b>高频变更的服务（支付费率每周改）和低频服务（用户认证半年改一次）放在一起对比是否有意义？有没有按服务类型分层分析？</b><br><br> 这是一个已确认的工程认知：不同变更频率的服务放在同一粒度下衡量可维护性是统计陷阱。" },
      { role: "user", text: "确实没分层。但大部分微服务拆分的研究也是看整体指标" },
      { role: "ai", text: "\"大部分研究都这么做\"是危险的思维方式——这就是为什么很多微服务迁移在理论上成功、实际上团队叫苦不迭。一个建设性的方向：<b>用Cognitive Load Metric（每个服务变更需要理解的文件数×文件间依赖数）分层衡量，然后看它和故障率的关联。</b><br><br> 这是一个常见但非普遍的实践建议——Team Topologies和逆康威定律的研究现在要求区分\"运行时耦合\"和\"认知耦合\"。<br><br>总结本轮的挑战：你的核心数据没问题，但\"服务粒度→可维护性\"的因果关系需要排除\"团队结构变化\"和\"变更频率分层\"两个混淆变量。做个认知负荷分层分析就清楚了。" },
    ],
  },
  {
    id: 7,
    title: "新生入组引导",
    icon: "",
    mode: "think",
    description: "AI引导新生完成评估并推荐入门路径",
    messages: [
      { role: "ai", text: "欢迎加入软件工程与分布式系统实验室！我是研脉的入组助手。<br><br>在给你推荐入门路径之前，我想先了解你。<b>你本科阶段最感兴趣的软件/系统方向是什么？有没有做过相关项目？</b>" },
      { role: "user", text: "学过操作系统和计算机网络，做过几个Web全栈项目。对分布式系统和后端架构比较感兴趣" },
      { role: "ai", text: "了解。那<b>你更擅长也更享受哪一种：底层系统开发（喜欢理解\"为什么这么快\"）还是应用层架构设计（喜欢把复杂业务拆清楚）？</b>" },
      { role: "user", text: "偏底层系统，但想多接触工业级架构设计" },
      { role: "ai", text: "很好。基于你的背景和偏好，为你生成了3周入门路径：<br><br> <b>Week 1：建立理论框架</b><br>① 微服务拆分粒度对系统可维护性的影响（课题组奠基性工作）<br>② Raft与Paxos在生产环境中的可用性对比（分布式理论必读）<br><br> <b>Week 2：工程实践基础</b><br>③ React Server Components流式SSR的性能优化（全栈架构经典案例）<br>④ K8s HPA弹性伸缩的滞后性分析（云原生入门）<br><br> <b>Week 3：前沿+动手</b><br>⑤ 基于推测解码的LLM推理加速（AI+系统工程交叉）<br>⑥ 参加本周组会+跟随张明远师兄搭建一次CI/CD流水线<br><br> 第2周读工程论文时，特别注意看张明远的批注——他记录了最多生产事故和调试技巧。<br> 每天读完后在系统里写一条批注（一句话也行），这是建立工程思维习惯的关键。" },
    ],
  },
];

export const SCENE_LIST = CHAT_SCENES.map((s) => ({
  id: s.id,
  title: s.title,
  icon: s.icon,
  mode: s.mode,
}));

export const HOME_STATS = {
  generations: "3代",
  papers: "10篇",
  annotations: "30条",
  failures: "15例",
  capsules: "3个",
};
