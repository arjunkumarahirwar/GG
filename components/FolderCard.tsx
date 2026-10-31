"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Clock, Tag, MoreHorizontal, Download, Lock } from "lucide-react";
import FloatingTimerDot from "@/components/FloatingTimerDot";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  questionsUrl: string | null;
  solutionsUrl: string | null;
  admin?: boolean;
}

export default function FolderCard({
  id,
  name,
  tags,
  createdAt,
  questionsUrl,
  solutionsUrl,
  admin = false,
}: FolderCardProps) {
  const durationKey = `mock-duration-${id}`;
  const [durationSeconds, setDurationSeconds] = useState<number>(1800); // default 30 min
  const [timerEnded, setTimerEnded] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [solutionsUnlocked, setSolutionsUnlocked] = useState(false);

  const storageKey = `mock-elapsed-${id}`;
  const [elapsed, setElapsed] = useState<number>(0);

  // Load chosen duration + elapsed on mount.
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

  const isNewBadge = (() => {
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  })();

  const handleTimerEnd = () => {
    setTimerEnded(true);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleUnlock = () => {
    setSolutionsUnlocked(true);
  };

  return (
    <article className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/mock/${id}`}
            className="text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-accent dark:hover:text-accent"
          >
            {name}
          </Link>
          {isNewBadge && (
            <span className="flex h-5 items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-2 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-tight">
              New
            </span>
          )}
        </div>
        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3">
        {/* meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            Questions PDF
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {durationSeconds} s
          </span>
          {tags.length && (
            <span className="ml-auto flex gap-1">
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-1.5 text-slate-500 dark:text-slate-400">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>

        {/* timer dot */}
        <div className="flex justify-center mb-3">
          <FloatingTimerDot
            durationSeconds={durationSeconds}
            storageKey={storageKey}
            initialElapsed={elapsed}
            onEnd={handleTimerEnd}
          />
        </div>

        {/* viewer row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Questions</span>
            </div>
            <iframe
              title="Questions PDF"
              src={questionsUrl ?? ""}
              className="w-full h-48 rounded border border-slate-200 dark:border-slate-700 bg-white"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Solutions</span>
              {admin && solutionsUnlocked && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">unlocked</span>
              )}
            </div>
            {timerEnded || submitted || solutionsUnlocked ? (
              <div className="flex-1 flex items-center justify-center">
                {solutionsUrl ? (
                  <iframe
                    title="Solutions PDF"
                    src={solutionsUrl ?? ""}
                    className="w-full h-48 rounded border border-slate-200 dark:border-slate-700 bg-white"
                    sandbox="allow-same-origin allow-scripts"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No solutions PDF</span>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <Lock className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Solutions locked until timer ends or you tap Submit
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!timerEnded}
                  className="mt-3 rounded bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Submit and unlock solutions
                </button>
              </div>
            )}
          </div>
        </div>

        {admin && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <button
              onClick={handleUnlock}
              disabled={solutionsUnlocked}
              className="flex items-center justify-center w-full gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Force-unlock solutions (admin)
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
