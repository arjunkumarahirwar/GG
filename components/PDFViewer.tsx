"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.4.299/legacy/build/pdf.worker.min.js`;
}

const btn = (active = false) =>
  cn(
    "flex h-7 w-7 items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-40 disabled:pointer-events-none",
    active ? "bg-slate-200 dark:bg-slate-700" : "bg-transparent",
  );

interface PDFViewerProps {
  url: string | null;
  pageKey: string; // localStorage key for resume
  disabled?: boolean;
}

export default function PDFViewer({ url, pageKey, disabled = false }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Resume last page for this mock.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(pageKey);
      if (saved) setPage(Math.max(1, parseInt(saved, 10) || 1));
    } catch {
      // ignore
    }
  }, [pageKey]);

  // Persist current page whenever it changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(pageKey, String(page));
  }, [page, pageKey]);

  const onDocumentLoad = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      if (page > numPages) setPage(numPages);
    },
    [page],
  );

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () =>
    setPage((p) => (numPages ? Math.min(numPages, p + 1) : p + 1));

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400">
        No PDF uploaded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button onClick={prevPage} disabled={page <= 1 || disabled || loading} className={btn()}>
            &lt;
          </button>
          <span className="mx-1 font-medium">
            {page}{numPages ? ` / ${numPages}` : ""}
          </span>
          <button
            onClick={nextPage}
            disabled={!numPages || page >= numPages || disabled || loading}
            className={btn()}
          >
            &gt;
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            title="Zoom out"
            className={btn()}
            aria-label="Zoom out"
          >
            <span className="text-[10px]">&#8722;</span>
          </button>
          <button
            onClick={() => setScale(1.2)}
            title="Reset zoom"
            className={btn(scale === 1.2)}
            aria-label="Reset zoom"
          >
            <span className="text-[10px]">&#8861;</span>
          </button>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            title="Zoom in"
            className={btn()}
            aria-label="Zoom in"
          >
            <span className="text-[10px]">+</span>
          </button>
        </div>
      </div>
      {/* canvas area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Rendering PDF…
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-red-500 dark:text-red-400">
            <p>Failed to load PDF.</p>
            <button onClick={() => setFailed(false)} className="mt-2 underline text-sm">
              Try again
            </button>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoad}
          onLoadError={() => setFailed(true)}
          loading={loading}
          onProgress={() => setLoading(true)}
          onError={() => setLoading(false)}
        >
          <Page pageNumber={page} scale={scale} className="mx-auto mb-4" />
        </Document>
      </div>
    </div>
  );
}
