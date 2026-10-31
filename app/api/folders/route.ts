import { NextResponse } from "next/server";
import { corsHeaders, readFoldersServer, writeFoldersServer, uploadPdfServer } from "@/lib/server-blob";

export async function GET() {
  const folders = await readFoldersServer();
  return NextResponse.json({ folders }, { headers: corsHeaders() });
}

export async function POST(req: Request) {
  const adminPassword = req.headers.get("x-admin-password");
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  const form = await req.formData();
  const name = form.get("name") as string;
  const tagsRaw = form.get("tags") as string;
  const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  const questionsFile = form.get("questionsFile") as File;
  const solutionsFile = form.get("solutionsFile") as File;

  if (!questionsFile || !solutionsFile) {
    return NextResponse.json({ error: "Both PDFs required" }, { status: 400, headers: corsHeaders() });
  }

  try {
    const qsBuf = Buffer.from(await questionsFile.arrayBuffer());
    const solBuf = Buffer.from(await solutionsFile.arrayBuffer());

    const [qsUrl, solUrl] = await Promise.all([
      uploadPdfServer(qsBuf, questionsFile.name),
      uploadPdfServer(solBuf, solutionsFile.name),
    ]);

    const folder = {
      id: crypto.randomUUID(),
      name: name || `Mock ${new Date().toISOString().slice(0, 10)}`,
      tags,
      createdAt: new Date().toISOString(),
      questionsUrl: qsUrl,
      solutionsUrl: solUrl,
    };

    const folders = await readFoldersServer();
    folders.push(folder);
    await writeFoldersServer(folders);

    return NextResponse.json({ folder }, { headers: corsHeaders() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
