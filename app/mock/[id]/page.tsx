"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Clock, Tag, Lock, Download, Play, Pause } from "lucide-react";
import PDFViewer from "@/components/PDFViewer";
import FloatingTimerDot from "@/components/FloatingTimerDot";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  questionsUrl: string | null;
  solutionsUrl: string | null;
}

const PRESETS = [30, 60, 90, 120, 180]; // minutes

export default function MockPage({ params }: { params: { id: string } }) {
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState<number>(1800);
  const [timerEnded, setTimerEnded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [solutionsUnlocked, setSolutionsUnlocked] = useState(false);
  const [adminUnlocking, setAdminUnlocking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/folders", { cache: "no-store" });
      const data = await res.json();
      const list: Folder[] = data.folders ?? [];
      setFolder(list.find((f) => f.id === params.id) ?? null);
    } catch {
      setFolder(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const durationKey = `mock-duration-${params.id}`;
  const storageKey = `mock-elapsed-${params.id}`;
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(durationKey);
      if (saved) setDurationSeconds(parseInt(saved, 10) || 1800);
      const raw = localStorage.getItem(storageKey);
      if (raw) setElapsed(parseInt(raw, 10) || 0);
    } catch {
      // ignore
    }
  }, [durationKey, storageKey]);

  useEffect(() => {
    localStorage.setItem(durationKey, String(durationSeconds));
  }, [durationSeconds, durationKey]);

  const handleTimerEnd = () => setTimerEnded(true);
  const handleSubmit = () => setSubmitted(true);
  const handleUnlock = () => setSolutionsUnlocked(true);

  const handleAdminUnlock = async () => {
    setAdminUnlocking(true);
    // Client-side force unlock for admin (no server check needed since this UI is
    // only reachable by the app owner in v1; password gate is at the API level).
    setSolutionsUnlocked(true);
    setAdminUnlocking(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>
    );
  }
  if (!folder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mock not found</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">This mock doesn&rsquo;t exist.</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-1 text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>
      </div>
    );
  }

  const isNew = (() => {
    const days = (Date.now() - new Date(folder.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  })();

  const canViewSolutions = timerEnded || submitted || solutionsUnlocked;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Library
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate flex-1">
            {folder.name}
          </h1>
          {isNew && (
            <span className="flex h-6 items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-tight">
              New
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* meta */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Questions PDF
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {Math.floor(durationSeconds / 60)} min
          </span>
          {folder.tags.length && (
            <span className="ml-auto flex gap-1">
              {folder.tags.map((t) => (
                <span key={t} className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-1.5 text-slate-500 dark:text-slate-400">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* duration chooser */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Timer duration:</span>
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setDurationSeconds(m * 60)}
              className={`rounded border px-2 py-1 text-xs font-medium transition ${
                durationSeconds === m * 60
                  ? "bg-accent border-accent text-white"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {m} min
            </button>
          ))}
        </div>

        {/* timer dot */}
        <div className="flex justify-center">
          <FloatingTimerDot
            durationSeconds={durationSeconds}
            storageKey={storageKey}
            initialElapsed={elapsed}
            onEnd={handleTimerEnd}
          />
        </div>

        {/* viewers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Questions</h2>
            </div>
            <div className="flex-1 p-4">
              <PDFViewer url={folder.questionsUrl ?? null} pageKey={`qs-${params.id}`} />
            </div>
          </section>

          {/* Solutions */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Solutions</h2>
              <span
                className={cn(
                  "text-[10px] rounded border px-1.5 py-0.5",
                  canViewSolutions
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400"
                )}
              >
                {canViewSolutions ? "Unlocked" : "Locked"}
              </span>
            </div>
            <div className="flex-1 p-4">
              {canViewSolutions ? (
                <>
                  <PDFViewer
                    url={folder.solutionsUrl ?? null}
                    pageKey={`sol-${params.id}`}
                    disabled={!folder.solutionsUrl}
                  />
                  {!folder.solutionsUrl && <p className="text-xs text-slate-400 mt-2">No solutions PDF uploaded.</p>}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Lock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Solutions stay locked until the timer ends or you tap "Submit".
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!timerEnded}
                    className="rounded bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {timerEnded ? (
                      <>
                        <Play className="h-4 w-4 mr-2" /> Submit and unlock
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" /> Wait for timer
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* admin force unlock */}
        <div className="flex justify-end">
          <button
            onClick={handleAdminUnlock}
            disabled={adminUnlocking || solutionsUnlocked}
            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Force-unlock solutions (admin)
          </button>
        </div>
      </div>
    </div>
  );
}
