"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerPreset {
  label: string;
  minutes: number;
}

const PRESETS: TimerPreset[] = [
  { label: "30 min", minutes: 30 },
  { label: "60 min", minutes: 60 },
  { label: "90 min", minutes: 90 },
  { label: "120 min", minutes: 120 },
  { label: "180 min", minutes: 180 },
];

interface FloatingTimerDotProps {
  /** Seconds chosen by aspirant for this mock */
  durationSeconds: number;
  /** Called when the timer ends */
  onEnd?: () => void;
  /** Initial saved elapsed seconds (0 if starting fresh) */
  initialElapsed?: number;
  /** Storage key for persisting timer across refresh */
  storageKey: string;
}

export default function FloatingTimerDot({
  durationSeconds,
  onEnd,
  initialElapsed = 0,
  storageKey = "mock-timer",
}: FloatingTimerDotProps) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [alertShown, setAlertShown] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const softAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist elapsed + left across refresh (simple client persistence per plan).
  useEffect(() => {
    try {
      const payload = { elapsed, secondsLeft, running, durationSeconds };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [elapsed, secondsLeft, running, durationSeconds, storageKey]);

  // Restore from localStorage on mount if nothing was provided.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.durationSeconds === durationSeconds) {
          setSecondsLeft(parsed.secondsLeft ?? durationSeconds);
          setElapsed(parsed.elapsed ?? 0);
          setRunning(!!parsed.running);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const format = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
  }, []);

  const colorClass = useCallback(() => {
    const pct = durationSeconds > 0 ? secondsLeft / durationSeconds : 1;
    if (pct > 0.6) return "text-green-600 dark:text-green-400";
    if (pct > 0.3) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }, [secondsLeft, durationSeconds]);

  const start = useCallback(() => {
    if (secondsLeft <= 0) return;
    setRunning(true);
    startTimeRef.current = Date.now();
    softAlertTimeoutRef.current = setTimeout(() => {
      setAlertShown(true);
    }, 30000);
  }, [secondsLeft]);

  const pause = useCallback(() => {
    setRunning(false);
    const startedAt = startTimeRef.current;
    if (startedAt != null) {
      setElapsed((e) => e + Math.floor((Date.now() - startedAt) / 1000));
      startTimeRef.current = null;
    }
    softAlertTimeoutRef.current && clearTimeout(softAlertTimeoutRef.current);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(durationSeconds);
    setElapsed(0);
    setAlertShown(false);
    startTimeRef.current = null;
    softAlertTimeoutRef.current && clearTimeout(softAlertTimeoutRef.current);
    intervalRef.current && clearInterval(intervalRef.current);
  }, [durationSeconds]);

  const addMinutes = useCallback((delta: number) => {
    setSecondsLeft((s) => Math.max(0, s + delta * 60));
  }, []);

  const tick = useCallback(() => {
    if (!running || startTimeRef.current === null) return;
    const passed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSecondsLeft((s) => Math.max(0, s - passed));
    startTimeRef.current = Date.now();
  }, [running]);

  // Countdown loop (1s).
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  // End-of-time detection.
  useEffect(() => {
    if (secondsLeft <= 0 && running) {
      setRunning(false);
      onEnd?.();
    }
  }, [secondsLeft, running, onEnd]);

  const applyPreset = (m: number) => {
    reset();
    setSecondsLeft(m * 60);
  };

  const dotColor = colorClass();
  const badge = secondsLeft <= 60 ? "⚡" : "";

  return (
    <div className="relative inline-block">
      {/* Dot — always visible, draggable-ish affordance */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full",
          "shadow-lg border border-white/60 dark:border-slate-800/60",
          "bg-white dark:bg-slate-900 transition-transform active:scale-95",
          dotColor,
        )}
        aria-label="Timer"
        title={format(secondsLeft)}
      >
        <Clock className="h-5 w-5" />
        {secondsLeft <= 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{badge}</span>}
      </button>

      {/* Panel — auto-shrinks after 5s of no touch handled by CSS/JS via expanded state */}
      {expanded && (
        <div className="mt-2 z-20 flex w-64 flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-3 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Timer</span>
            <button
              onClick={reset}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
            >
              Reset
            </button>
          </div>

          {/* Presets */}
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.minutes)}
                disabled={running}
                className={cn(
                  "flex-shrink-0 px-2 py-1 rounded border text-xs font-medium transition",
                  running
                    ? "border-transparent text-slate-400 dark:text-slate-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Display */}
          <div className="text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
            {format(secondsLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={running ? pause : start}
              disabled={secondsLeft <= 0}
              className={cn(
                "flex-1 py-2 rounded border text-sm font-medium transition",
                running
                  ? "bg-red-600 border-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:border-red-700"
                  : "bg-slate-100 border-slate-200 dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600",
              )}
            >
              {running ? (
                <>
                  <Pause className="h-4 w-4 mr-1.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1.5" /> Start
                </>
              )}
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => addMinutes(-5)}
                disabled={running || secondsLeft <= 0}
                className={cn("px-2 py-1.5 rounded border text-xs", running ? "opacity-50" : "")}
                title="-5 min"
              >
                −5
              </button>
              <button
                onClick={() => addMinutes(5)}
                disabled={running}
                className={cn("px-2 py-1.5 rounded border text-xs", running ? "opacity-50" : "")}
                title="+5 min"
              >
                +5
              </button>
            </div>
          </div>

          {alertShown && (
            <div className="flex items-center gap-2 mt-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-700 dark:text-amber-300">Time’s up — submit to unlock solutions</span>
            </div>
          )}

          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 text-right">
            Elapsed: {format(elapsed)}
          </div>
        </div>
      )}
    </div>
  );
}
