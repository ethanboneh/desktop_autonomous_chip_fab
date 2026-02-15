import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const REFERENCE_DIR = join(
  process.cwd(),
  "agent_experiment",
  "data",
  "reference"
);

export async function GET() {
  if (!existsSync(REFERENCE_DIR)) {
    return NextResponse.json({ hasReference: false });
  }

  const files = readdirSync(REFERENCE_DIR).filter((f) =>
    /\.(jpg|jpeg|png)$/i.test(f)
  );

  if (files.length === 0) {
    return NextResponse.json({ hasReference: false });
  }

  const filePath = join(REFERENCE_DIR, files[0]);
  const data = readFileSync(filePath);
  const base64 = data.toString("base64");

  return NextResponse.json({
    hasReference: true,
    filename: files[0],
    base64,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { base64, filename } = body as { base64: string; filename?: string };

  if (!base64) {
    return NextResponse.json({ error: "base64 image data required" }, { status: 400 });
  }

  if (!existsSync(REFERENCE_DIR)) {
    mkdirSync(REFERENCE_DIR, { recursive: true });
  }

  const name = filename || "reference.jpg";
  const filePath = join(REFERENCE_DIR, name);
  writeFileSync(filePath, Buffer.from(base64, "base64"));

  return NextResponse.json({ ok: true, path: filePath });
}
