import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const HISTORY_FILE = join(
  process.cwd(),
  "agent_experiment",
  "data",
  "experiment_history.json"
);

function loadHistory(): unknown[] {
  if (!existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export async function GET() {
  const history = loadHistory();
  return NextResponse.json({
    experiments: history,
    count: history.length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const dir = dirname(HISTORY_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const history = loadHistory();
  const record = {
    ...body,
    id: String(history.length),
    timestamp: new Date().toISOString(),
  };
  history.push(record);
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

  return NextResponse.json({ ok: true, experiment: record });
}
