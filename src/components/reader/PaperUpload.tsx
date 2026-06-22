"use client";

import { useState, useRef, useCallback } from "react";
import { parsePDF, type ParsedPaper } from "@/lib/pdf-parser";
import { addPaper } from "@/lib/storage";
import type { StoredPaper } from "@/lib/storage";
import { addNotification } from "@/lib/notifications";
import failures from "@/data/failures.json";

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

        // Build notification + tag matching
        const paperTags = parsed.tags || [];
        const matchedFailures = (failures as any[]).filter((f: any) =>
          f.tags?.some((ft: string) =>
            paperTags.some((pt: string) => pt.toLowerCase().includes(ft.toLowerCase()) || ft.toLowerCase().includes(pt.toLowerCase()))
          )
        );

        addNotification({
          type: "annotation_new",
          title: "论文解析完成",
          body: `${parsed.title.slice(0, 30)}... 已解析，${parsed.sections.length}章节，建议开始阅读`,
          link: "/reader",
        });

        let extraMsg = "";
        if (matchedFailures.length > 0) {
          extraMsg = `  与 ${matchedFailures.length} 个失败案例标签重叠（${matchedFailures.slice(0, 2).map((f: any) => f.title?.slice(0, 15)).join("、")}...），建议查看避坑建议。`;
          addNotification({
            type: "failure_match",
            title: "标签重叠提醒",
            body: `你的论文与 ${matchedFailures.length} 个失败案例标签重叠，建议查看避坑建议`,
            link: "/advisor",
          });
        }

        setState("success");
        setMessage(`已解析：${parsed.title.slice(0, 40)}...（${parsed.sections.length} 章节，${parsed.tags.length} 标签）${extraMsg}`);
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
            ? "border-accent bg-accent/10"
            : state === "parsing"
              ? "border-primary/30 bg-primary/5"
              : state === "success"
                ? "border-green-400 bg-green-50"
                : state === "error"
                  ? "border-red-400 bg-red-50"
                  : "border-border hover:border-accent/50 hover:bg-muted/50"
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
            <span>拖拽 PDF 到此处上传，或点击选择文件</span>
          </div>
        )}

        {state === "dragging" && (
          <p className="text-sm text-accent font-medium">释放以上传论文</p>
        )}

        {state === "parsing" && (
          <div className="space-y-2">
            <p className="text-sm text-primary font-medium">
              正在解析：{fileName}
            </p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              提取文本中 · 检测章节结构 · 关键词标引
            </p>
          </div>
        )}

        {state === "success" && (
          <p className="text-sm text-green-700 font-medium">{message}</p>
        )}

        {state === "error" && (
          <div className="space-y-1">
            <p className="text-sm text-red-600 font-medium">{message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setState("idle");
              }}
              className="text-xs text-accent hover:underline"
            >
              重新上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
