import { put, del } from "@vercel/blob";

const FOLDERS_KEY = "folders.json";

export interface Folder {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
  questionsUrl: string | null;
  solutionsUrl: string | null;
}

// In-memory fallback for dev when no Blob token is configured.
let memoryFolders: Folder[] = [];
let memoryInitialized = false;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
};

export function corsHeaders() {
  return headers;
}

export async function readFoldersServer(): Promise<Folder[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (!memoryInitialized) {
      memoryInitialized = true;
      // seed one demo folder so the app is usable immediately in dev
      memoryFolders = [
        {
          id: "demo-1",
          name: "Sample Mock",
          tags: ["jee", "maths"],
          createdAt: new Date().toISOString(),
          questionsUrl: null,
          solutionsUrl: null,
        },
      ];
    }
    return memoryFolders;
  }
  try {
    // folders.json is public; fetch it directly.
    const res = await fetch(
      `https://${process.env.BLOB_STORE_HOST ?? "blob"}/_api/folders`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return (await res.json()) as Folder[];
  } catch {
    return [];
  }
}

export async function writeFoldersServer(folders: Folder[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    memoryFolders = folders;
    return;
  }
  await put(FOLDERS_KEY, JSON.stringify(folders, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function uploadPdfServer(file: Buffer, fileName: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    const url = `/_dev/mock-${Date.now()}-${fileName}`;
    memoryFolders; // no-op
    return url;
  }
  const blob = await put(`pdfs/${Date.now()}-${fileName.replace(/\s+/g, "_")}`, file, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deletePdfServer(url: string | null): Promise<void> {
  if (!url) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await del(url);
  } catch {
    // best effort
  }
}
