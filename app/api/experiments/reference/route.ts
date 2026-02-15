import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Return reference mask info pointing to public asset
  return NextResponse.json({
    hasReference: true,
    filename: "reference_mask.png",
    url: "/experiments/reference_mask.png",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { base64 } = body as { base64: string };

  if (!base64) {
    return NextResponse.json(
      { error: "base64 image data required" },
      { status: 400 }
    );
  }

  // In production, this would save to cloud storage
  return NextResponse.json({ ok: true, message: "Reference uploaded (demo mode)" });
}
