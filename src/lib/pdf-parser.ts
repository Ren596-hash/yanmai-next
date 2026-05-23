import * as pdfjsLib from "pdfjs-dist";

// Worker configured by PDFViewer — reuse same
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export interface ParsedPaper {
  title: string;
  authors: string;
  abstract: string;
  sections: string[][];
  tags: string[];
}

const SECTION_PATTERNS: [RegExp, string][] = [
  [/(?:^|\n)\s*(?:\d+\.?\s*)?(?:Introduction|引言|绪论|背景|Background)\s*$/im, "Introduction"],
  [/(?:^|\n)\s*(?:\d+\.?\s*)?(?:Experimental|Methods?|实验|方法|Materials?\s*(?:and|&)\s*Methods?|材料与?方法|材料)\s*$/im, "Experimental"],
  [/(?:^|\n)\s*(?:\d+\.?\s*)?(?:Results?\s*(?:and|&)\s*Discussion|Results?|结果与讨论|结果)\s*$/im, "Results"],
  [/(?:^|\n)\s*(?:\d+\.?\s*)?(?:Discussion|讨论)\s*$/im, "Discussion"],
  [/(?:^|\n)\s*(?:\d+\.?\s*)?(?:Conclusion|结论|总结|Summary|Conclusions?)\s*$/im, "Conclusion"],
];

const TAG_KEYWORDS: [string, string[]][] = [
  ["MoS₂", ["MoS₂", "MoS2", "二硫化钼"]],
  ["缺陷工程", ["缺陷", "空位", "vacancy", "defect"]],
  ["光催化", ["光催化", "photocataly", "可见光", "UV-vis"]],
  ["电催化", ["电催化", "electrocataly", "ORR", "OER", "HER", "CO₂RR"]],
  ["异质结", ["异质结", "heterojunction", "heterostructure"]],
  ["单原子催化", ["单原子", "single atom", "single-atom", "SAC"]],
  ["CO₂还原", ["CO₂", "CO2", "carbon dioxide", "二氧化碳"]],
  ["Cu₂O", ["Cu₂O", "Cu2O", "cuprous", "氧化亚铜"]],
  ["TiO₂", ["TiO₂", "TiO2", "titania", "二氧化钛"]],
  ["ZnO", ["ZnO", "zinc oxide", "氧化锌"]],
  ["DFT", ["DFT", "density functional", "密度泛函", "VASP", "第一性原理"]],
  ["机器学习", ["机器学习", "machine learning", "ML", "神经网络", "neural network"]],
  ["CVD", ["CVD", "chemical vapor", "化学气相"]],
  ["XPS", ["XPS", "X-ray photoelectron"]],
  ["XRD", ["XRD", "X-ray diffraction"]],
  ["TEM", ["TEM", "transmission electron"]],
  ["Raman", ["Raman", "拉曼"]],
  ["MXene", ["MXene", "MXenes"]],
  ["钙钛矿", ["钙钛矿", "perovskite"]],
];

export async function parsePDF(file: File): Promise<ParsedPaper> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const fullText: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText.push(pageText);
  }

  const combined = fullText.join("\n");

  // Extract title: longest line on first page (heuristic)
  const firstPageLines = fullText[0].split(/\n|\.\s{2,}/).filter((l) => l.trim().length > 10);
  const title = firstPageLines.length > 0
    ? firstPageLines.reduce((a, b) => (a.length > b.length ? a : b)).trim().slice(0, 200)
    : file.name.replace(/\.pdf$/i, "");

  // Extract authors: look for common patterns near top
  const authorMatch = combined.match(/(?:authors?|作者)[\s:：]*(.+?)(?:\n|Abstract|摘要)/i);
  const authors = authorMatch ? authorMatch[1].trim().slice(0, 100) : "未知作者";

  // Extract abstract
  const abstractMatch = combined.match(
    /(?:abstract|摘要|Abstract|ABSTRACT)\s*[\n\r]+([\s\S]+?)(?:\n\s*(?:\d+\.?\s*)?(?:Introduction|引言|绪论|Background|背景|Experimental|实验|Keywords?|关键词))/i
  );
  const abstract = abstractMatch
    ? abstractMatch[1].replace(/\n/g, " ").trim().slice(0, 1000)
    : "摘要未提取到";

  // Section detection
  const sections: string[][] = [];
  let remainingText = combined;

  // Find all section heading matches
  interface SectionMatch { index: number; heading: string; pattern: string; }

  const matches: SectionMatch[] = [];
  for (const [pattern, heading] of SECTION_PATTERNS) {
    const match = combined.match(pattern);
    if (match && match.index !== undefined) {
      const existingIdx = matches.findIndex((m) => m.index === match.index);
      if (existingIdx === -1) {
        matches.push({ index: match.index, heading, pattern: match[0] });
      }
    }
  }

  matches.sort((a, b) => a.index - b.index);

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : combined.length;
    const body = combined.slice(start + matches[i].pattern.length, end).trim().slice(0, 3000);
    if (body.length > 20) {
      sections.push([matches[i].heading, body]);
    }
  }

  // If no sections found, split into chunks
  if (sections.length === 0) {
    const chunkSize = 1500;
    let idx = 0;
    while (idx < combined.length) {
      const chunk = combined.slice(idx, idx + chunkSize);
      sections.push([`Section ${Math.floor(idx / chunkSize) + 1}`, chunk]);
      idx += chunkSize;
    }
  }

  // Tag extraction
  const tags: string[] = [];
  const lowerText = combined.toLowerCase();
  for (const [tag, keywords] of TAG_KEYWORDS) {
    if (keywords.some((kw) => lowerText.includes(kw.toLowerCase()))) {
      tags.push(tag);
    }
  }

  return { title, authors, abstract, sections, tags };
}
