import json
import os

BASE = r"C:\Users\Lenovo\Desktop\C C test\yanmai-next\src\data"

# Load existing papers
with open(os.path.join(BASE, "papers.json"), "r", encoding="utf-8") as f:
    papers = json.load(f)

# Define directions and enrich papers
directions_map = {
    1: "分布式系统与微服务",
    2: "前端架构与性能优化",
    3: "AI/ML系统工程",
    4: "分布式系统与微服务",
    5: "前端架构与性能优化",
    6: "分布式系统与微服务",
    7: "AI/ML系统工程",
    8: "前端架构与性能优化",
    9: "AI/ML系统工程",
    10: "前端架构与性能优化",
}

students_map = {
    1: "张明远, 2020级硕士, 毕业去向: 字节跳动基础架构",
    2: "王芳, 2021级硕士, 毕业去向: 蚂蚁集团前端",
    3: "陈明, 2021级硕士, 毕业去向: 腾讯AI Lab",
    4: "王磊, 2020级硕士, 毕业去向: 华为分布式存储",
    5: "赵刚, 2022级硕士, 在读",
    6: "李华, 2019级博士, 毕业去向: 高校教职",
    7: "张明远, 2020级硕士, 毕业去向: 字节跳动基础架构",
    8: "王芳, 2021级硕士, 毕业去向: 蚂蚁集团前端",
    9: "陈明, 2021级硕士, 毕业去向: 腾讯AI Lab",
    10: "赵刚, 2022级硕士, 在读",
}

innovation_points_map = {
    1: [{"title": "BCA评估框架", "content": "首创基于DDD限界上下文的微服务拆分量化评估指标——BCA(Bounded Context Alignment)，综合耦合度、内聚度和数据完整性三维度，可在CI/CD管道中自动化评估服务边界健康度。"}, {"title": "实证基线数据", "content": "收集了12个工业级项目的6个月运维数据，建立了微服务拆分粒度的实证基线——单个服务2000-8000行代码时BCA最优。"}],
    2: [{"title": "自适应流式渲染策略", "content": "首创根据客户端CPU、内存、网络RTT和带宽四维能力画像动态调整RSC渲染边界的自适应策略，3G网络下FCP提升42%。"}, {"title": "客户端能力指纹", "content": "设计HTTP请求头携带的轻量级客户端能力指纹协议，无需额外JavaScript探测，首请求即可获取设备画像。"}],
    3: [{"title": "自适应推测解码(ASD)", "content": "首创基于上下文熵值动态预测草稿长度的推测解码框架，在Llama-3-70B上实现2.7倍加速，生成质量无统计显著差异。"}, {"title": "KV缓存复用", "content": "设计草稿模型与目标模型间的KV缓存复用策略，消除推理加速过程中的冗余键值计算，额外节省15%显存。"}],
    4: [{"title": "生产环境对比基准", "content": "首次在统一硬件（SSD配置）和负载条件下对Raft与Paxos进行公平对比，纠正了早期文献中因实验环境差异导致的性能结论偏差。"}, {"title": "批处理参数调优方法", "content": "提出共识算法批处理参数的自动调优方法，在etcd上验证：5ms批处理间隔相比默认50ms吞吐翻倍但延迟抖动增加可控。"}],
    5: [{"title": "跨引擎WASM基准", "content": "构建了涵盖V8、SpiderMonkey、Wasmer、Wasmtime四大引擎的统一WASM运行时性能基准测试框架，覆盖计算密集型和IO密集型场景。"}],
    6: [{"title": "HPA预测模型", "content": "首创基于负载历史模式的K8s HPA预测性弹性伸缩模型，将冷启动延迟从分钟级降至秒级，避免了响应式伸缩的滞后性问题。"}],
    7: [{"title": "HNSW参数自适应", "content": "提出基于数据分布特征自适应调整HNSW索引参数(M/efConstruction)的方法，在ANN-Benchmarks上SIFT数据集召回率提升6%而构建时间不变。"}],
    8: [{"title": "混合水合策略", "content": "首创Next.js App Router的混合水合策略——静态内容服务端渲染+动态内容客户端Suspense包裹，将FID从120ms降至45ms。"}],
    9: [{"title": "两阶段漂移检测", "content": "首创结合数据漂移检测和模型性能监控的两阶段MLOps漂移检测方法，在模型精度下降前提前预警，误报率<5%。"}],
    10: [{"title": "CRDTvsOT决策框架", "content": "构建了首个系统化的CRDTvsOT选型决策框架，基于协作规模、延迟要求和一致性需求三维度推荐合适方案。"}],
}

paper_structure_map = {}
for pid in range(1, 11):
    paper_structure_map[pid] = {
        "abstract_layers": "背景(2-3句) → 问题/研究空白(1-2句) → 方法/创新(1-2句) → 结果/贡献(1-2句) → 意义(1句)",
        "intro_logic": "大背景(why important) → 缩小到具体问题 → 现有方案及不足(gap) → 本文方案(contribution)",
        "innovation_extraction": "从实验/数据出发 → 提炼可迁移的规律(而非描述做了什么) → 用数字和统计支撑 → 指出适用范围和局限"
    }

reading_order_map = {1:1, 4:2, 6:3, 2:1, 5:2, 8:3, 10:4, 3:1, 7:2, 9:3}

# Enrich existing papers
for p in papers:
    pid = p["id"]
    p["direction"] = directions_map.get(pid, "未分类")
    p["student"] = students_map.get(pid, "")
    p["innovation_points"] = innovation_points_map.get(pid, [])
    p["paper_structure"] = paper_structure_map.get(pid, {})
    p["reading_order"] = reading_order_map.get(pid, 1)

# Add 5 new papers
new_papers = [
    {
        "id": 11, "title": "基于强化学习的微服务自动伸缩策略研究",
        "authors": "张明远, 李华, 陈志强",
        "journal": "IEEE Transactions on Cloud Computing, 2025, Vol.13(1), pp.89-104",
        "doi": "10.1109/TCC.2025.1234567",
        "abstract": "微服务架构的弹性伸缩面临多目标权衡——成本、延迟和可靠性。本文提出了一种基于深度强化学习的微服务自动伸缩策略RL-Scaler，将伸缩决策建模为马尔可夫决策过程，使用PPO算法在线学习最优伸缩策略。在Kubernetes集群上的实验表明，RL-Scaler相比HPA降低30%资源成本的同时保持相同的SLO达标率。",
        "tags": ["微服务", "强化学习", "弹性伸缩", "Kubernetes"],
        "direction": "分布式系统与微服务",
        "student": "李华, 2023级硕士, 在读",
        "innovation_points": [{"title":"RL-Scaler策略","content":"首次将强化学习(PPO)应用于微服务弹性伸缩决策，建模为MDP，在保证SLO前提下降低30%资源成本。"}],
        "paper_structure": {"abstract_layers":"背景→问题→方法→结果→意义","intro_logic":"大背景→缩小gap→本文方案","innovation_extraction":"从实验数据提炼可迁移规律"},
        "reading_order": 4,
        "sections": [["1. Introduction","Kubernetes HPA的响应式策略存在冷启动滞后。<span>强化学习可以从历史负载模式中学习最优伸缩策略</span>。"],["2. Method","将伸缩决策建模为MDP：状态=负载+资源利用率，动作=副本数增减，奖励=负成本的SLO达标率。<span>使用PPO算法在线学习策略网络</span>。"],["3. Evaluation","<span>RL-Scaler相比HPA降低30%资源成本</span>，SLO达标率相当(99.5% vs 99.3%)。"]]
    },
    {
        "id": 12, "title": "WebAssembly在边缘设备上的内存安全机制研究",
        "authors": "赵刚, 王芳, 陈志强",
        "journal": "USENIX Annual Technical Conference, 2025, pp.345-358",
        "doi": "10.5555/9876543",
        "abstract": "WebAssembly(WASM)在边缘计算中的应用受到内存安全机制的制约。本文系统分析了WASM沙箱在资源受限IoT设备上的性能开销，提出了一种轻量级内存保护方案WASM-Lite——将线性内存检查从软件层面下沉到硬件MPU(内存保护单元)，在ARM Cortex-M设备上将内存安全检查开销从35%降至8%。",
        "tags": ["WebAssembly", "边缘计算", "内存安全", "IoT"],
        "direction": "前端架构与性能优化",
        "student": "赵刚, 2022级硕士, 在读",
        "innovation_points": [{"title":"WASM-Lite方案","content":"首创将WASM线性内存检查从软件下沉到硬件MPU，在ARM Cortex-M上安全检查开销从35%降至8%。"}],
        "paper_structure": {"abstract_layers":"背景→问题→方法→结果→意义","intro_logic":"大背景→缩小gap→本文方案","innovation_extraction":"从实验数据提炼可迁移规律"},
        "reading_order": 5,
        "sections": [["1. Introduction","WASM在边缘IoT设备上的内存安全是一个关键挑战。<span>软件层面的线性内存检查在资源受限设备上的开销可高达35%</span>。"],["2. Method","<span>利用ARM Cortex-M的MPU硬件单元将线性内存边界检查下沉到硬件层</span>，避免每次内存访问的软件验证。"],["3. Results","WASM-Lite将内存安全检查开销降至8%，<span>同时保持完全的内存隔离安全保证</span>。"]]
    },
    {
        "id": 13, "title": "基于因果推断的微服务故障根因定位方法",
        "authors": "王磊, 张明远, 李华",
        "journal": "ACM Symposium on Cloud Computing, 2025, pp.234-247",
        "doi": "10.1145/9999999",
        "abstract": "微服务系统中故障根因定位面临服务依赖复杂、告警风暴等挑战。本文提出CausalRCA——基于因果推断的微服务故障根因定位方法，通过构建服务调用拓扑的因果图模型，结合PC算法和反事实推理，在告警风暴中准确识别根因服务。在阿里巴巴生产集群数据上的实验表明，CausalRCA的根因定位准确率达到92%，比最佳基线方法的78%提升了14个百分点。",
        "tags": ["微服务", "故障定位", "因果推断", "可观测性"],
        "direction": "分布式系统与微服务",
        "student": "王磊, 2020级硕士, 毕业去向: 华为分布式存储",
        "innovation_points": [{"title":"CausalRCA方法","content":"首次将因果推断(PC算法+反事实推理)引入微服务故障根因定位，在真实生产数据上达到92%准确率。"}],
        "paper_structure": {"abstract_layers":"背景→问题→方法→结果→意义","intro_logic":"大背景→缩小gap→本文方案","innovation_extraction":"从实验数据提炼可迁移规律"},
        "reading_order": 5,
        "sections": [["1. Introduction","微服务故障根因定位是运维的核心难题。<span>告警风暴中服务间依赖传播使得人工排查耗时数小时</span>。"],["2. Method","<span>通过PC算法从服务调用数据中学习因果图结构，再通过反事实推理计算每个服务的根因概率</span>。"],["3. Results","CausalRCA根因定位准确率92%，<span>平均定位时间从人工的3.2小时降至3分钟</span>。"]]
    },
    {
        "id": 14, "title": "大语言模型在代码审查中的自动化应用研究",
        "authors": "陈明, 张明远",
        "journal": "International Conference on Software Engineering, 2025, pp.567-579",
        "doi": "10.1145/8888888",
        "abstract": "代码审查是保障软件质量的关键环节，但人工审查耗时且质量波动大。本文提出LLM-CR——基于大语言模型的自动化代码审查助手，针对安全漏洞、性能隐患、代码规范三类问题进行专项微调，在5个开源项目的Pull Request上实现了83%的审查准确率和91%的召回率。与人工审查的对比实验表明，LLM-CR可将审查效率提升4倍。",
        "tags": ["LLM应用", "代码审查", "软件工程", "AI工具"],
        "direction": "AI/ML系统工程",
        "student": "陈明, 2021级硕士, 毕业去向: 腾讯AI Lab",
        "innovation_points": [{"title":"LLM-CR框架","content":"首次针对代码审查三大维度(安全/性能/规范)专项微调LLM，在真实PR数据上达到83%准确率、91%召回率。"}],
        "paper_structure": {"abstract_layers":"背景→问题→方法→结果→意义","intro_logic":"大背景→缩小gap→本文方案","innovation_extraction":"从实验数据提炼可迁移规律"},
        "reading_order": 4,
        "sections": [["1. Introduction","代码审查是软件工程中最有效的质量保障实践之一。<span>但人工审查占用开发者30%以上时间，且审查质量因经验差异波动大</span>。"],["2. Method","<span>基于CodeLlama-34B进行指令微调，针对安全漏洞检测、性能反模式识别、代码规范检查三类任务分别设计提示模板</span>。"],["3. Results","LLM-CR对安全漏洞检测准确率89%，<span>将单次PR审查平均时间从45分钟降至11分钟</span>。"]]
    },
    {
        "id": 15, "title": "面向低资源设备的联邦学习通信压缩方法",
        "authors": "李华, 陈明, 赵刚",
        "journal": "Conference on Machine Learning and Systems, 2025, pp.456-469",
        "doi": "10.5555/7777777",
        "abstract": "联邦学习在边缘设备上的部署受限于通信带宽约束。本文提出FedCompress——一种面向低资源环境的联邦学习通信压缩方法，结合梯度稀疏化(top-k)和残差量化，在模型精度损失<1%的条件下实现通信量降低94%。在CIFAR-10和Fashion-MNIST上的实验表明，FedCompress在Non-IID数据分布下仍保持稳定的收敛性能。",
        "tags": ["联邦学习", "模型压缩", "边缘计算", "通信优化"],
        "direction": "AI/ML系统工程",
        "student": "李华, 2023级硕士, 在读",
        "innovation_points": [{"title":"FedCompress方法","content":"首创结合梯度稀疏化和残差量化的双层压缩方案，通信量降低94%且精度损失<1%，在Non-IID下仍稳定收敛。"}],
        "paper_structure": {"abstract_layers":"背景→问题→方法→结果→意义","intro_logic":"大背景→缩小gap→本文方案","innovation_extraction":"从实验数据提炼可迁移规律"},
        "reading_order": 5,
        "sections": [["1. Introduction","联邦学习的通信开销是边缘部署的主要瓶颈。<span>每次全局迭代需要传输完整模型梯度，对于百万参数模型通信量可达数GB</span>。"],["2. Method","<span>第一阶段top-k稀疏化保留梯度幅值前1%的元素，第二阶段对残差进行4-bit量化传输</span>。"],["3. Results","FedCompress通信量降低94%，<span>在Non-IID(Non-IIDness=0.5)条件下的精度损失<1%</span>。"]]
    },
]
papers.extend(new_papers)

with open(os.path.join(BASE, "papers.json"), "w", encoding="utf-8") as f:
    json.dump(papers, f, ensure_ascii=False, indent=2)

print(f"Papers: {len(papers)} (10 original + 5 new)")

# --- research_paths.json ---
paths = [
    {
        "id": 1,
        "direction": "分布式系统与微服务",
        "description": "从微服务基础理论到故障定位前沿",
        "papers": [
            {"paper_id": 1, "order": 1, "note": "必读：建立微服务拆分粒度的理论基础，理解BCA评估框架", "source": "张明远(2020级)验证"},
            {"paper_id": 4, "order": 2, "note": "必读：掌握分布式共识算法的工程实践，注意对比实验的公平性原则", "source": "王磊(2020级)验证"},
            {"paper_id": 6, "order": 3, "note": "推荐：理解K8s弹性伸缩的滞后性问题，为RL-Scaler铺垫", "source": "AI基于引用关系推荐"},
            {"paper_id": 11, "order": 4, "note": "前沿：强化学习+弹性伸缩的最新进展", "source": "课题组最新成果"},
            {"paper_id": 13, "order": 5, "note": "前沿：因果推断在故障定位中的应用", "source": "课题组最新成果"},
        ],
        "verified_by": "张明远(2020级硕士, 已入职字节跳动)",
        "estimated_weeks": 6
    },
    {
        "id": 2,
        "direction": "前端架构与性能优化",
        "description": "从SSR基础到WASM边缘计算",
        "papers": [
            {"paper_id": 2, "order": 1, "note": "必读：理解RSC流式SSR的核心原理和自适应渲染策略", "source": "王芳(2021级)验证"},
            {"paper_id": 8, "order": 2, "note": "必读：掌握Next.js混合水合策略，理解FID优化", "source": "王芳(2021级)验证"},
            {"paper_id": 5, "order": 3, "note": "推荐：WASM性能基准，为边缘计算学习打基础", "source": "AI基于引用关系推荐"},
            {"paper_id": 10, "order": 4, "note": "推荐：实时协同编辑中的CRDTvsOT选型", "source": "赵刚(2022级)验证"},
            {"paper_id": 12, "order": 5, "note": "前沿：WASM在IoT设备上的内存安全", "source": "课题组最新成果"},
        ],
        "verified_by": "王芳(2021级硕士, 已入职蚂蚁集团)",
        "estimated_weeks": 5
    },
    {
        "id": 3,
        "direction": "AI/ML系统工程",
        "description": "从LLM推理优化到联邦学习",
        "papers": [
            {"paper_id": 3, "order": 1, "note": "必读：理解推测解码的核心范式，为后续推理优化学习打基础", "source": "陈明(2021级)验证"},
            {"paper_id": 7, "order": 2, "note": "必读：掌握向量索引参数调优方法", "source": "张明远(2020级)验证"},
            {"paper_id": 9, "order": 3, "note": "推荐：MLOps漂移检测的工程实践", "source": "AI基于引用关系推荐"},
            {"paper_id": 14, "order": 4, "note": "前沿：LLM在代码审查中的应用", "source": "课题组最新成果"},
            {"paper_id": 15, "order": 5, "note": "前沿：联邦学习通信压缩方法", "source": "课题组最新成果"},
        ],
        "verified_by": "陈明(2021级硕士, 已入职腾讯AI Lab)",
        "estimated_weeks": 6
    },
]
with open(os.path.join(BASE, "research_paths.json"), "w", encoding="utf-8") as f:
    json.dump(paths, f, ensure_ascii=False, indent=2)
print(f"Research paths: {len(paths)}")

# --- writing_templates.json ---
templates = [
    {
        "id": 1,
        "direction": "分布式系统与微服务",
        "sections": [
            {"name": "摘要", "tips": "背景2-3句→研究空白1-2句→方法创新1-2句→核心发现1-2句→意义1句。关键词：量化指标+对比基线+实证数据。", "example_from_paper_id": 1},
            {"name": "引言", "tips": "第一段:为什么这个方向重要(引用2-3篇高影响力论文)→第二段:现有方案及不足(指出gap)→第三段:本文方案与贡献(用'本文提出/首次/构建'等动词)。", "example_from_paper_id": 4},
            {"name": "相关工作", "tips": "按主题分类(如:理论基础/工程方法/评价指标)→每类综述2-3篇代表性工作→指出与本文的差异。", "example_from_paper_id": 1},
            {"name": "方法", "tips": "问题形式化定义→算法设计动机→算法步骤(可用伪代码)→关键参数说明→与baseline的差异。", "example_from_paper_id": 11},
            {"name": "实验", "tips": "实验环境(硬件/软件)→数据集(来源/规模/预处理)→Baseline方法(含引用)→评价指标(含公式)→结果表格→消融实验。", "example_from_paper_id": 4},
            {"name": "讨论", "tips": "核心发现总结→与假设对比→意外发现及解释→方法局限性(诚实很重要)→未来工作。", "example_from_paper_id": 1},
        ],
        "innovation_examples": [
            {"paper_id": 1, "innovation": "BCA评估框架", "how_to_write": "不要写'本文提出了BCA指标'——要写'BCA通过耦合度、内聚度、数据完整性三维度量化微服务拆分合理性，首次为这一经验性决策提供了可度量、可验证的工程工具'"},
            {"paper_id": 4, "innovation": "生产环境对比基准", "how_to_write": "不要写'我们对比了Raft和Paxos'——要写'本研究纠正了早期文献因忽略硬件配置差异而得出误导性结论的缺陷，建立了公平对比的3个必要条件'"},
        ]
    },
    {
        "id": 2,
        "direction": "AI/ML系统工程",
        "sections": [
            {"name": "摘要", "tips": "问题重要性→方法核心思路(非细节)→关键数字(加速比/准确率/提升幅度)→不要堆砌关键词。", "example_from_paper_id": 3},
            {"name": "引言", "tips": "第一段:AI系统部署的实际挑战→第二段:现有优化方案的局限→第三段:本文的核心洞察(insight)是什么。", "example_from_paper_id": 14},
            {"name": "方法", "tips": "先给出系统overview图→模块逐一展开→关键技术细节(足够复现)→公式推导放附录。", "example_from_paper_id": 3},
            {"name": "实验", "tips": "多模型/多数据集对比→统计显著性检验(p值)→消融实验→case study(选成功+失败各1例)。", "example_from_paper_id": 7},
            {"name": "讨论", "tips": "为什么work→什么情况下可能不work→对社区的建议→开源计划。", "example_from_paper_id": 9},
        ],
        "innovation_examples": [
            {"paper_id": 3, "innovation": "自适应推测解码", "how_to_write": "不要写'我们提出了ASD'——要写'ASD的核心洞察是:模型在低熵位置更确定→可以生成更长草稿→在高熵位置则应保守→草稿长度应随上下文动态调整而非固定'"},
        ]
    },
]
with open(os.path.join(BASE, "writing_templates.json"), "w", encoding="utf-8") as f:
    json.dump(templates, f, ensure_ascii=False, indent=2)
print(f"Writing templates: {len(templates)}")

print("\nDone! All data files generated.")
