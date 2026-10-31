import { NextResponse } from "next/server";
import { corsHeaders, readFoldersServer, writeFoldersServer, deletePdfServer } from "@/lib/server-blob";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const adminPassword = _req.headers.get("x-admin-password");
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  try {
    const folders = await readFoldersServer();
    const folder = folders.find((f) => f.id === id);
    if (!folder) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders() });
    }

    await Promise.all([
      deletePdfServer(folder.questionsUrl),
      deletePdfServer(folder.solutionsUrl),
    ]);

    const next = folders.filter((f) => f.id !== id);
    await writeFoldersServer(next);

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500, headers: corsHeaders() });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
