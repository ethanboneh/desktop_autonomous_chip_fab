import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// In-memory job tracker
interface SimJob {
  id: string;
  status: "running" | "complete" | "error";
  mode: string;
  steps: number;
  outputDir: string;
  logs: Array<Record<string, unknown>>;
  startedAt: number;
}

const jobs = new Map<string, SimJob>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const steps = body.steps ?? 150;
  const mode = body.mode ?? "both";
  const lr = body.lr ?? 0.01;
  const cropSize = body.cropSize ?? 512;
  const targetImage: string | undefined = body.targetImage; // base64 PNG

  const jobId = `sim-${Date.now()}`;
  const outputDir = `/tmp/sim_${jobId}`;

  const projectDir = process.cwd();

  // If user uploaded a custom target, save it to a temp file
  let customTargetPath: string | undefined;
  if (targetImage) {
    mkdirSync(outputDir, { recursive: true });
    customTargetPath = path.join(outputDir, "custom_target.png");
    writeFileSync(customTargetPath, Buffer.from(targetImage, "base64"));
  }

  const job: SimJob = {
    id: jobId,
    status: "running",
    mode,
    steps,
    outputDir,
    logs: [],
    startedAt: Date.now(),
  };
  jobs.set(jobId, job);

  // Spawn Python process using our clean TorchResistFixed module
  const args = [
    "-m", "TorchResistFixed.run",
    "--output-dir", outputDir,
    "--steps", String(steps),
    "--save-every", String(Math.max(1, Math.floor(steps / 20))),
    "--mode", mode,
    "--lr", String(lr),
    "--crop-size", String(cropSize),
  ];
  if (customTargetPath) {
    args.push("--target", customTargetPath);
  }

  const proc = spawn("python3", args, { cwd: projectDir });

  proc.stdout.on("data", (data: Buffer) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        job.logs.push(parsed);
        if (parsed.type === "done") {
          job.status = "complete";
        }
      } catch {
        // Non-JSON output, ignore
      }
    }
  });

  proc.stderr.on("data", (data: Buffer) => {
    job.logs.push({ type: "stderr", message: data.toString() });
  });

  proc.on("close", (code) => {
    if (code !== 0 && job.status !== "complete") {
      job.status = "error";
      job.logs.push({ type: "error", message: `Process exited with code ${code}` });
    } else if (job.status === "running") {
      job.status = "complete";
    }
  });

  return NextResponse.json({ jobId, outputDir, status: "running" });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  const frameFile = req.nextUrl.searchParams.get("frame");

  // Serve a specific frame image
  if (jobId && frameFile) {
    const job = jobs.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const framePath = path.join(job.outputDir, frameFile);
    if (!existsSync(framePath)) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }
    const buf = readFileSync(framePath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Return job status + available frames
  if (jobId) {
    const job = jobs.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // List available frame files
    let frames: string[] = [];
    if (existsSync(job.outputDir)) {
      frames = readdirSync(job.outputDir)
        .filter((f: string) => f.endsWith(".png"))
        .sort();
    }

    // Extract progress logs
    const progress = job.logs.filter(
      (l) => l.type === "progress" || l.type === "complete" || l.type === "status" || l.type === "done"
    );

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      mode: job.mode,
      steps: job.steps,
      progress,
      frames,
      elapsed: Date.now() - job.startedAt,
    });
  }

  // List all jobs
  const allJobs = Array.from(jobs.values()).map((j) => ({
    jobId: j.id,
    status: j.status,
    mode: j.mode,
    steps: j.steps,
    elapsed: Date.now() - j.startedAt,
  }));

  return NextResponse.json({ jobs: allJobs });
}
