"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loadError, setLoadError] = useState(false);

  const onDocLoad = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoadError(false);
    },
    []
  );

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-sm text-muted-foreground gap-2">
        <span className="text-4xl">📄</span>
        <p>此论文暂无PDF文件</p>
        <p className="text-xs">请使用「📝 结构化阅读」模式查看论文内容</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* 控制栏 */}
      <div className="flex items-center gap-3 mb-4 bg-muted rounded-lg px-4 py-2 text-sm flex-wrap justify-center">
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="px-2 py-1 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          ← 上一页
        </button>
        <span className="font-medium text-[#1a3a5c] min-w-[80px] text-center">
          第 {pageNumber} / {numPages || "?"} 页
        </span>
        <button
          onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
          disabled={pageNumber >= numPages && numPages > 0}
          className="px-2 py-1 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          下一页 →
        </button>
        <span className="text-xs text-muted-foreground mx-1">|</span>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="px-2 py-1 rounded hover:bg-white transition-colors"
        >
          −
        </button>
        <span className="text-xs tabular-nums">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          className="px-2 py-1 rounded hover:bg-white transition-colors"
        >
          +
        </button>
      </div>

      {/* PDF页面 */}
      <div className="border border-border rounded-xl overflow-auto bg-white shadow-sm">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocLoad}
          onLoadError={() => setLoadError(true)}
          loading={
            <div className="flex flex-col items-center justify-center h-96 text-sm text-muted-foreground gap-2">
              <div className="animate-spin w-8 h-8 border-2 border-[#1a3a5c] border-t-transparent rounded-full" />
              <p>正在加载论文PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-96 text-sm gap-2">
              <span className="text-4xl">⚠️</span>
              <p className="text-red-500">PDF加载失败</p>
              <p className="text-xs text-muted-foreground">
                {loadError ? "文件可能已损坏或格式不受支持" : "请检查文件是否有效"}
              </p>
              <button
                onClick={() => {
                  setLoadError(false);
                  setNumPages(0);
                }}
                className="mt-2 px-4 py-1.5 bg-[#1a3a5c] text-white rounded-md text-xs hover:bg-[#1a3a5c]/90 transition-colors"
              >
                重新加载
              </button>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
