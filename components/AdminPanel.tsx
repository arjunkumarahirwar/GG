"use client";

import { useState, useEffect } from "react";
import { Plus, Folder, Lock, FileText, Trash2, Users } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  questionsUrl: string | null;
  solutionsUrl: string | null;
}

interface AdminPanelProps {
  initialFolders: Folder[];
  onFoldersChange: (folders: Folder[]) => void;
}

export default function AdminPanel({ initialFolders, onFoldersChange }: AdminPanelProps) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [qsFile, setQsFile] = useState<File | null>(null);
  const [solFile, setSolFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  const handleVerify = async () => {
    setVerifyError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setUnlocked(true);
        setPassword("");
      } else {
        setVerifyError("Incorrect admin password");
      }
    } catch {
      setVerifyError("Could not verify password");
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("name", newName || "Mock");
    form.append("tags", newTags);
    form.append("questionsFile", file);
    // We'll send both files together in handleAdd instead.
    throw new Error("not used");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qsFile || !solFile) {
      setStatus("Please attach both PDFs");
      return;
    }
    try {
      setStatus("Uploading…");
      const form = new FormData();
      form.append("name", newName || `Mock ${new Date().toISOString().slice(0, 10)}`);
      form.append("tags", newTags);
      form.append("questionsFile", qsFile);
      form.append("solutionsFile", solFile);

      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: form,
      });
      if (!res.ok) throw new Error("Upload rejected");

      const data = await res.json();
      const next = [...folders, data.folder];
      setFolders(next);
      onFoldersChange(next);
      setAdding(false);
      setNewName("");
      setNewTags("");
      setQsFile(null);
      setSolFile(null);
      setStatus("Folder created");
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("Upload failed");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this mock and its PDFs?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (!res.ok) throw new Error("Delete rejected");
      const next = folders.filter((f) => f.id !== id);
      setFolders(next);
      onFoldersChange(next);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const btn = (active = false) =>
    `flex h-7 w-7 items-center justify-center rounded shadow-lg border border-white/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition active:scale-95 ${
      active ? "bg-slate-200 dark:bg-slate-700" : "bg-transparent text-slate-600 dark:text-slate-300"
    }`;

  if (!unlocked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">Admin mode</span>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
          <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">
            Enter the admin password you set in Vercel. Only you know it.
          </p>
          <form onSubmit={handleVerify} className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent dark:focus:border-accent"
            />
            {verifyError && (
              <p className="text-xs text-red-600 dark:text-red-400">{verifyError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Unlock
            </button>
          </form>
          <p className="text-[10px] text-slate-400">
            The password is stored as a Vercel secret — never in the code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">Admin mode</span>
        </div>
        <button
          onClick={() => setUnlocked(false)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
        >
          Lock
        </button>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Folder name</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. 2026-10 JEE Mock"
            className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-accent dark:focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Tags</label>
          <input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="jee, maths"
            className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm outline-none focus:border-accent dark:focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Questions PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setQsFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent hover:file:bg-accent/90"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">Solutions PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSolFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent hover:file:bg-accent/90"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center justify-center gap-2 rounded bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="h-4 w-4" /> Add mock
        </button>
      </form>

      {status && <p className="text-[11px] text-slate-500 dark:text-slate-400">{status}</p>}

      <div className="space-y-1">
        {folders.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
          >
            <div className="flex items-center gap-2 flex-1">
              <Folder className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{f.name}</span>
              {f.tags?.length && (
                <span className="ml-1 text-[10px] rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-1.5 text-slate-500 dark:text-slate-400">
                  {f.tags.join(", ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDelete(f.id)}
                disabled={deletingId === f.id}
                className={`
                  h-7 w-7 rounded border text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition
                  ${deletingId === f.id ? "opacity-50" : ""
                }`}
                title="Delete mock"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400">
        PDFs go straight to Vercel Blob — large scans work fine.
      </p>
    </div>
  );
}
