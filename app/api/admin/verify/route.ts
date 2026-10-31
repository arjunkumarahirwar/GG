import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/server-blob";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }
  return NextResponse.json({ ok: false }, { status: 401, headers: corsHeaders() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
