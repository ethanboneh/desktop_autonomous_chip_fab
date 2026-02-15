import { NextResponse } from "next/server";
import { experiments, fitnessHistory } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    experiments,
    fitnessHistory,
    metadata: {
      totalExperiments: experiments.filter((e) => e.status === "completed").length,
      suggestedNext: experiments.filter((e) => e.status === "suggested").length,
      bestFitness: Math.max(...experiments.map((e) => e.fitness)),
      algorithm: "Evolutionary Search",
    },
  });
}
