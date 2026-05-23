import papers from "@/data/papers.json";

// --- 替代 /api/onboarding/assess ---

interface AssessmentInput {
  interests: string[];
  skills: string;
  selfRatings: Record<string, number>;
}

export function assessOnboarding(input: AssessmentInput) {
  const { interests, skills } = input;

  if (!interests?.length || !skills) {
    throw new Error("请至少选择1个兴趣和1个技能");
  }

  const scored = papers.map((p) => {
    const matchCount = interests.filter((interest) =>
      p.tags.some(
        (tag: string) =>
          tag.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(tag.toLowerCase())
      )
    ).length;
    return { ...p, matchCount };
  });

  const matched = scored
    .filter((p) => p.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 6);

  const weeks = [
    {
      week: 1,
      description: "建立知识框架 — 从课题组核心方向入手",
      paperIds: matched.slice(0, 2).map((p) => p.id),
    },
    {
      week: 2,
      description: "实验方法基础 — 学习关键制备与表征技术",
      paperIds: matched.slice(2, 4).map((p) => p.id),
    },
    {
      week: 3,
      description: "前沿探索 + 动手实践 — 跟进最新成果并参与实验",
      paperIds: matched.slice(4, 6).map((p) => p.id),
    },
  ];

  const pathDescription =
    skills === "DFT计算/理论推导"
      ? "侧重理论计算方向，建议多参与DFT和数据分析相关工作"
      : skills === "实验操作/仪器使用"
        ? "侧重实验方向，建议跟随师兄师姐学习CVD、表征等核心实验技能"
        : skills === "数据分析/编程处理"
          ? "侧重数据科学方向，建议参与ML+催化项目和XAFS数据分析"
          : "侧重文献调研方向，建议协助撰写综述并建立知识图谱";

  return { status: "ok", weeks, description: pathDescription, totalPapers: matched.length };
}

// --- 替代 /api/papers/[id]/pdf ---

function generateMinimalPDF(_title: string, _authors: string, _abstract: string): Uint8Array {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 50 700 Td (Demo PDF) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000266 00000 n
0000000360 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
440
%%EOF`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}

export function getPaperPDFUrl(paperId: number): string {
  const paper = papers.find((p) => p.id === paperId);
  if (!paper) return "";
  const uint8 = generateMinimalPDF(paper.title, paper.authors, paper.abstract);
  const blob = new Blob([uint8.buffer as ArrayBuffer], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// --- 替代 /api/analytics/reading ---

interface ReadingEntry {
  paper_id: number;
  section_id: string;
  action: string;
  dwell_seconds?: number;
  timestamp: number;
}

const STORAGE_KEY = "yanmai_reading_log";

export function trackReading(data: Omit<ReadingEntry, "timestamp">) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const log: ReadingEntry[] = raw ? JSON.parse(raw) : [];
    log.push({ ...data, timestamp: Date.now() });
    // 只保留最近200条
    if (log.length > 200) log.splice(0, log.length - 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // localStorage不可用时静默忽略
  }
}

export function getReadingLog(): ReadingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
