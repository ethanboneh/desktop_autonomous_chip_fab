import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const steps = body.steps ?? 150;
  const mode = body.mode ?? "both";

  const jobId = `sim-${Date.now()}`;

  // In production this spawns the TorchResist Python process.
  // On Vercel we return a mock job for demo purposes.
  return NextResponse.json({
    jobId,
    status: "complete",
    mode,
    message:
      "Simulation runs locally with TorchResist. This Vercel deployment shows pre-computed results.",
    steps,
  });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");

  if (jobId) {
    // Return a completed mock job with pre-computed frames
    return NextResponse.json({
      jobId,
      status: "complete",
      mode: "both",
      steps: 150,
      progress: [{ type: "done", step: 150, loss: 0.012 }],
      frames: [
        "optimized-mask-final.png",
        "comparison-final.png",
      ],
      elapsed: 0,
    });
  }

  return NextResponse.json({ jobs: [] });
}
