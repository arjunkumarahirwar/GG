"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Folder, Moon, Sun, Shield } from "lucide-react";
import FolderCard from "@/components/FolderCard";
import AdminPanel from "@/components/AdminPanel";

interface Folder {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  questionsUrl: string | null;
  solutionsUrl: string | null;
}

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/folders", { cache: "no-store" });
      const data = await res.json();
      setFolders(data.folders ?? []);
    } catch {
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Apply theme class to document.
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const filtered = folders.filter((f) => {
    const q = search.toLowerCase();
    const matchesName = f.name.toLowerCase().includes(q);
    const matchesTag = tagFilter ? f.tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())) : true;
    return matchesName && matchesTag;
  });

  const allTags = Array.from(new Set(folders.flatMap((f) => f.tags))).sort();

  const handleFoldersChange = (next: Folder[]) => {
    setFolders(next);
  };

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-accent" />
          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">MockTest</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search folders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-accent dark:focus:border-accent"
            />
          </div>
          {tagFilter && (
            <button
              onClick={() => setTagFilter("")}
              className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300"
            >
              Clear tag
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs outline-none focus:border-accent"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="rounded p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Shield className="h-3.5 w-3.5" /> Admin
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Library</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} mock{folders.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
            <p>No mocks yet.</p>
            <p className="text-[11px] mt-1 text-slate-400">Add one from Admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => (
              <FolderCard key={f.id} {...f} />
            ))}
          </div>
        )}
      </main>

      {/* Admin panel dialog */}
      {adminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setAdminOpen(false)}>
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Admin</h2>
              <button onClick={() => setAdminOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="p-4">
              <AdminPanel
                initialFolders={folders}
                onFoldersChange={handleFoldersChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
