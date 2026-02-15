import { NextRequest, NextResponse } from "next/server";
import { setLatestFrame, getLatestFrame } from "@/lib/frame-store";
import OpenAI from "openai";

const SCORER_SYSTEM_PROMPT = `You are a quality control vision system for UV lithography fabrication.

CONTEXT:
A UV light exposes photosensitive resin through a photomask onto a substrate (wafer).
The goal is to transfer the mask pattern as faithfully as possible onto the wafer.
You will receive:
1. A REFERENCE image showing the desired target pattern (if provided)
2. A RESULT image showing what was actually fabricated

EVALUATION CRITERIA:
- uniformity: How uniform is the exposure across the entire wafer surface? 1.0 = perfectly uniform, 0.0 = highly uneven.
- coverage: What fraction of the intended pattern was successfully transferred? 1.0 = all features present, 0.0 = nothing transferred.
- defects: Look for bubbles, scratches, contamination, incomplete or over-curing. 1.0 = no visible defects, 0.0 = severely defective.
- overall_fitness: Your holistic quality assessment. Weight coverage highest, then uniformity, then defects.

Be rigorous but fair. A perfect score (1.0) should be rare. Most real results score 0.3-0.8.

Return ONLY a JSON object:
{"uniformity": <float>, "coverage": <float>, "defects": <float>, "overall_fitness": <float|}`;

async function scoreWithVision(
  resultB64: string,
  referenceB64?: string
): Promise<Record<string, number>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[capture] No OPENAI_API_KEY — returning mock scores");
    return { uniformity: 0.87, defects: 0.92, coverage: 0.94, overall_fitness: 0.85 };
  }

  const openai = new OpenAI({ apiKey });
  const content: OpenAI.ChatCompletionContentPart[] = [
    { type: "text", text: "Score this fabrication result." },
  ];

  if (referenceB64) {
    content.push({ type: "text", text: "REFERENCE image (target pattern):" });
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${referenceB64}` },
    });
  }

  content.push({ type: "text", text: "RESULT image (fabricated wafer):" });
  content.push({
    type: "image_url",
    image_url: { url: `data:image/jpeg;base64,${resultB64}` },
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SCORER_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      console.warn("[capture] Could not parse JSON from GPT-4o:", text);
      return { uniformity: 0.5, defects: 0.5, coverage: 0.5, overall_fitness: 0.5 };
    }
    const scores = JSON.parse(jsonMatch[0]);
    for (const key of ["uniformity", "coverage", "defects", "overall_fitness"]) {
      scores[key] = Math.max(0, Math.min(1, parseFloat(scores[key] ?? 0.5)));
    }
    return scores;
  } catch (err) {
    console.error("[capture] Vision scoring failed:", err);
    return { uniformity: 0.5, defects: 0.5, coverage: 0.5, overall_fitness: 0.5 };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Mode 1: Browser sends a captured frame (store it)
  if (body.frame && !body.score_latest) {
    const frame = body.frame as string;
    setLatestFrame(frame);

    // If reference provided, score immediately
    const reference = body.reference as string | undefined;
    const scores = await scoreWithVision(frame, reference);

    return NextResponse.json({
      ok: true,
      analysis: { ...scores, timestamp: Date.now() },
    });
  }

  // Mode 2: Python agent asks to score the latest stored frame
  if (body.score_latest) {
    const stored = getLatestFrame();
    if (!stored) {
      return NextResponse.json(
        { error: "No frame captured yet. Click 'Capture Frame' in the browser first." },
        { status: 404 }
      );
    }

    const reference = body.reference as string | undefined;
    const scores = await scoreWithVision(stored.frame, reference);

    return NextResponse.json({
      ok: true,
      analysis: { ...scores, timestamp: Date.now(), capturedAt: stored.capturedAt },
    });
  }

  return NextResponse.json({ error: "Provide either 'frame' or 'score_latest: true'" }, { status: 400 });
}
