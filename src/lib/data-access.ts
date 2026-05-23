import papers from "@/data/papers.json";
import { addPaper, getAllPapers, getReadingLog, addReadingEntry, saveProfile, loadProfile } from "./storage";

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

function generateContentPDF(title: string, authors: string, abstract: string, sections: string[][]): Uint8Array {
  const lines: string[] = [];
  lines.push(title);
  lines.push("");
  lines.push(authors);
  lines.push("");
  lines.push("摘要：" + abstract);
  lines.push("");

  for (const [heading, body] of sections) {
    lines.push(heading);
    lines.push(body.replace(/<[^>]+>/g, ""));
    lines.push("");
  }

  const fullText = lines.join("\n");
  const encoder = new TextEncoder();

  // Build a proper multi-page PDF
  const objects: string[] = [];
  const pageKids: string[] = [];
  const contentRefs: string[] = [];
  const CHARS_PER_LINE = 80;
  const LINES_PER_PAGE = 55;

  let offset = 0;
  let pageNum = 0;
  const textContent = fullText;

  while (offset < textContent.length) {
    pageNum++;
    const pageContent = textContent.slice(offset, offset + CHARS_PER_LINE * LINES_PER_PAGE);
    offset += CHARS_PER_LINE * LINES_PER_PAGE;

    const streamContent = `BT /F1 11 Tf 50 740 Td 12 TL (${pageContent.replace(/[()\\]/g, "\\$&").replace(/\n/g, ")' Tj T* (")}) Tj ET`;

    const contentObj = `${4 + pageNum * 2 - 1} 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj`;

    const pageObj = `${4 + pageNum * 2} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents ${4 + pageNum * 2 - 1} 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj`;

    objects.push(contentObj, pageObj);
    pageKids.push(`${4 + pageNum * 2} 0 R`);
    contentRefs.push(`${4 + pageNum * 2 - 1} 0 R`);
  }

  const pagesObj = `2 0 obj
<< /Type /Pages /Kids [${pageKids.join(" ")}] /Count ${pageNum} >>
endobj`;

  const catalogObj = `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`;

  const fontObj = `5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`;

  // Build xref table
  const allObjects = [catalogObj, pagesObj, ...objects, fontObj];
  let xrefOffset = 0;
  const xrefEntries: string[] = [];
  for (const obj of allObjects) {
    xrefEntries.push(`${String(xrefOffset).padStart(10, "0")} 00000 n`);
    xrefOffset += obj.length + 1; // +1 for \n
  }

  const xref = `xref
0 ${allObjects.length + 1}
0000000000 65535 f
${xrefEntries.join("\n")}`;

  const pdf = `%PDF-1.4
${allObjects.join("\n")}
${xref}
trailer
<< /Size ${allObjects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`;

  return encoder.encode(pdf);
}

export async function getPaperPDFUrl(paperId: number): Promise<string> {
  // Check IndexedDB for uploaded paper with real PDF
  try {
    const { getPaperPDF } = await import("./storage");
    const stored = await getPaperPDF(paperId);
    if (stored) {
      const blob = new Blob([stored], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    }
  } catch { /* fall through */ }

  // Fall back to generated PDF from static data
  const paper = papers.find((p) => p.id === paperId);
  if (!paper) return "";
  const uint8 = generateContentPDF(paper.title, paper.authors, paper.abstract, paper.sections as string[][]);
  const blob = new Blob([uint8.buffer as ArrayBuffer], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// --- 替代 /api/analytics/reading ---

interface TrackReadingData {
  paper_id: number;
  section_id: string;
  action: string;
  dwell_seconds?: number;
}

export function trackReading(data: TrackReadingData) {
  addReadingEntry({ ...data, timestamp: Date.now() }).catch(() => {});
}

export function getReadingLogSync(): { paper_id: number; section_id: string; action: string; dwell_seconds?: number; timestamp: number }[] {
  // Fallback synchronous access for components that can't use async
  try {
    const raw = localStorage.getItem("yanmai_reading_log_sync");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// --- User Profile ---

export { saveProfile, loadProfile, getReadingLog, addPaper, getAllPapers };
