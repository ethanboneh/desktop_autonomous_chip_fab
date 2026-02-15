import { NextRequest, NextResponse } from "next/server";
import { experiments } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    experiments,
    count: experiments.length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const record = {
    ...body,
    id: `exp-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, experiment: record });
}
