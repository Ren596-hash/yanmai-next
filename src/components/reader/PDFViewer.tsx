"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);

  const onDocLoad = useCallback(
    ({ numPages }: { numPages: number }) => setNumPages(numPages),
    []
  );

  return (
    <div className="flex flex-col items-center">
      {/* 控制栏 */}
      <div className="flex items-center gap-3 mb-4 bg-muted rounded-lg px-4 py-2 text-sm">
        <button
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
          className="px-2 py-1 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          ← 上一页
        </button>
        <span className="font-medium text-[#1a3a5c] min-w-[80px] text-center">
          第 {pageNumber} / {numPages} 页
        </span>
        <button
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={pageNumber >= numPages}
          className="px-2 py-1 rounded hover:bg-white transition-colors disabled:opacity-30"
        >
          下一页 →
        </button>
        <div className="w-px h-4 bg-border mx-1" />
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
          loading={
            <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">
              加载PDF中...
            </div>
          }
          error={
            <div className="flex items-center justify-center h-96 text-sm text-red-500">
              PDF加载失败，请检查文件是否有效
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
