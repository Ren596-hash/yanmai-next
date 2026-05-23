"use client";

import { useState, useRef, useCallback } from "react";
import { parsePDF, type ParsedPaper } from "@/lib/pdf-parser";
import { addPaper } from "@/lib/storage";
import type { StoredPaper } from "@/lib/storage";

interface PaperUploadProps {
  onUploaded: (paper: StoredPaper) => void;
}

type UploadState = "idle" | "dragging" | "parsing" | "success" | "error";

export default function PaperUpload({ onUploaded }: PaperUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".pdf")) {
        setState("error");
        setMessage("请选择 PDF 文件");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setState("error");
        setMessage("文件太大，请控制在 50MB 以内");
        return;
      }

      setFileName(file.name);
      setState("parsing");
      setProgress(0);

      try {
        const progressTimer = setInterval(() => {
          setProgress((p) => Math.min(p + 10, 90));
        }, 300);

        const parsed: ParsedPaper = await parsePDF(file);

        clearInterval(progressTimer);
        setProgress(100);

        const pdfBlob = await file.arrayBuffer();
        const storedId = await addPaper({
          ...parsed,
          journal: "上传论文",
          doi: "",
          created_at: new Date().toISOString(),
          source: "uploaded",
          pdfBlob,
        });

        onUploaded({
          id: storedId,
          ...parsed,
          journal: "上传论文",
          doi: "",
          created_at: new Date().toISOString(),
          source: "uploaded",
          pdfBlob,
        });

        setState("success");
        setMessage(`已解析：${parsed.title.slice(0, 40)}...（${parsed.sections.length} 章节，${parsed.tags.length} 标签）`);
      } catch {
        setState("error");
        setMessage("PDF 解析失败，请检查文件是否有效");
      }
    },
    [onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState("dragging");
  };

  const handleDragLeave = () => {
    setState("idle");
  };

  const handleSelect = () => {
    const file = fileRef.current?.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mb-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => state === "idle" && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          state === "dragging"
            ? "border-[#c9a96e] bg-[#c9a96e]/10"
            : state === "parsing"
              ? "border-[#1a3a5c]/30 bg-[#1a3a5c]/5"
              : state === "success"
                ? "border-green-400 bg-green-50"
                : state === "error"
                  ? "border-red-400 bg-red-50"
                  : "border-border hover:border-[#c9a96e]/50 hover:bg-muted/50"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleSelect}
        />

        {state === "idle" && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">📄</span>
            <span>拖拽 PDF 到此处上传，或点击选择文件</span>
          </div>
        )}

        {state === "dragging" && (
          <p className="text-sm text-[#c9a96e] font-medium">释放以上传论文</p>
        )}

        {state === "parsing" && (
          <div className="space-y-2">
            <p className="text-sm text-[#1a3a5c] font-medium">
              正在解析：{fileName}
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#1a3a5c] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              提取文本中 · 检测章节结构 · 关键词标引
            </p>
          </div>
        )}

        {state === "success" && (
          <p className="text-sm text-green-700 font-medium">✅ {message}</p>
        )}

        {state === "error" && (
          <div className="space-y-1">
            <p className="text-sm text-red-600 font-medium">❌ {message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState("idle");
              }}
              className="text-xs text-[#c9a96e] hover:underline"
            >
              重新上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
