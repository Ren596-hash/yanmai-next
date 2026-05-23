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
    keywords: ["MoS₂", "MoS2", "退火", "缺陷", "硫空位", "光催化"],
    response:
      "我注意到你对MoS₂光催化感兴趣。在展示课题组的前人经验之前，想先问你：<b>你觉得控制硫空位浓度最关键的参数是什么？如果退火温度太高，除了产生更多缺陷，还可能发生什么？</b>",
    sceneId: 1,
  },
  {
    keywords: ["Cu₂O", "Cu2O", "TiO₂", "异质结", "CO₂还原", "CO2还原", "界面"],
    response:
      "你想做Cu₂O/TiO₂异质结。这个体系有一个经典的实验陷阱。<b>你先想想——Cu₂O中的Cu是+1价，在什么条件下容易被氧化？沉积过程中哪些因素可能影响Cu的价态？</b>",
    sceneId: 2,
  },
  {
    keywords: ["XPS", "数据分析", "定标", "荷电校正", "C 1s", "峰位"],
    response:
      "XPS数据分析看起来标准，但样品制备方式不同，碳的来源也不同。<b>你用的是CVD法生长的样品吗？CVD样品的碳来源可能有几种？你准备用哪个碳峰作为284.8 eV的基准？</b>",
    sceneId: 3,
  },
  {
    keywords: ["文献综述", "综述", "TiO₂", "CO₂", "光催化"],
    response:
      "写光催化CO₂还原综述是个好主意。<b>但我先问你——TiO₂基催化剂还原CO₂的主要产物有哪些？选择性由什么决定？更重要的是，怎么确认产物中的碳确实来自CO₂而不是催化剂或溶剂？</b>",
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
      "欢迎加入课题组！在推荐入门路径之前想先了解你。<b>你本科阶段最感兴趣的化学/材料方向是什么？有没有做过相关实验？</b>",
    sceneId: 7,
  },
  {
    keywords: ["辩论", "挑战", "质疑", "反对"],
    response:
      "<b>🧠 思维挑战模式已激活</b><br>请先陈述你的观点或实验结论，我会扮演同行评审者进行建设性挑战。你准备好了吗？",
    sceneId: 6,
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
  if (length < 10) {
    return {
      response:
        "你似乎还没有充分思考这个问题。别着急，试着从以下几个方面想一想：<br><br>1. 这个问题的核心变量是什么？<br>2. 有哪些可能的机制或原因？<br>3. 你手头有什么数据或证据支持你的想法？<br><br>试着写2-3句话回答，然后再看看课题组的经验。",
      mode: "ask_deeper",
    };
  }

  return {
    response:
      "感谢你的思考。基于你的回答和课题组知识库，以下是一些相关的积累：<br><br><i>提示：当前为Demo预设回复模式。接入平台AI后将根据实际检索结果生成个性化回复，每条知识点将标注来源和置信度。</i><br><br>👉 你可以继续深入探讨，或者切换到其他模式试试。",
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
    response: `<b>🧠 思维挑战 · 第${roundCount}轮</b><br><br>我理解你的观点。但我想挑战你：<b>你确定你观察到的效应是单一变量导致的吗？有没有可能的混淆变量？</b><br><br>在催化研究中，一个常见的陷阱是将相关性误判为因果性。例如：<br>• 退火温度↑ → 缺陷浓度↑ → 活性↑<br>但温度↑ 同时也会改变：晶粒尺寸、表面重构、杂质扩散...<br><br>🔴 这是一个已确认的学术认知：单一变量实验在复杂催化体系中几乎不可能真正实现。<br><br>建议的改进方向：<b>做一组控制实验，固定缺陷浓度（改变其他合成参数），验证活性是否真的只由缺陷浓度决定。</b>`,
    mode: "show_experience",
  };
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
