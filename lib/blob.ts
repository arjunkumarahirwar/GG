"use server";

import { put, del, list, get } from "@vercel/blob";

const FOLDERS_KEY = "folders.json";

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  tags: string[];
  questionsUrl: string | null;
  solutionsUrl: string | null;
}

export async function readFolders(): Promise<Folder[]> {
  try {
    const res = await fetch(`https://${process.env.BLOB_STORE_HOST ?? "blob"}/_api/folders`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as Folder[];
  } catch {
    return [];
  }
}

export async function writeFolders(folders: Folder[]): Promise<void> {
  await put(FOLDERS_KEY, JSON.stringify(folders, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function uploadPdf(file: File): Promise<string> {
  const blob = await put(`pdfs/${Date.now()}-${file.name.replace(/\s+/g, "_")}`, file, {
    access: "public",
    contentType: file.type || "application/pdf",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deletePdf(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // best effort
  }
}

/** List all blobs (used for cleanup diagnostics). */
export async function listBlobs() {
  return list();
}

/** Read a JSON blob by public url. */
export async function readJsonBlob(url: string): Promise<any> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export { FOLDERS_KEY };
