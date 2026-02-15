import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  evolutionNodes as mockNodes,
  fitnessHistory as mockHistory,
  type EvolutionNode,
} from "@/lib/mock-data";

const HISTORY_FILE = join(
  process.cwd(),
  "agent_experiment",
  "data",
  "experiment_history.json"
);

interface ExperimentRecord {
  id: string;
  mask_angle: number;
  exposure_time_ms: number;
  scores?: {
    uniformity?: number;
    coverage?: number;
    defects?: number;
    overall_fitness?: number;
  };
  timestamp?: string;
}

function loadRealData(): {
  nodes: EvolutionNode[];
  fitnessHistory: { generation: number; bestFitness: number; avgFitness: number }[];
} | null {
  if (!existsSync(HISTORY_FILE)) return null;

  try {
    const raw = readFileSync(HISTORY_FILE, "utf-8");
    const experiments: ExperimentRecord[] = JSON.parse(raw);
    if (!experiments.length) return null;

    // Each experiment is a "node" — group into generations of 3
    const GENERATION_SIZE = 3;
    const nodes: EvolutionNode[] = experiments.map((exp, i) => {
      const generation = Math.floor(i / GENERATION_SIZE);
      const parentId =
        i === 0 ? null : String(Math.max(0, i - GENERATION_SIZE));
      return {
        id: String(exp.id ?? i),
        parentId,
        generation,
        fitness: exp.scores?.overall_fitness ?? 0,
        params: {
          maskAngle: exp.mask_angle,
          exposureTime: exp.exposure_time_ms,
        },
        label:
          i === 0
            ? "Seed"
            : `Gen ${generation}-${String.fromCharCode(65 + (i % GENERATION_SIZE))}`,
      };
    });

    // Build fitness history per generation
    const genMap = new Map<number, number[]>();
    for (const n of nodes) {
      const arr = genMap.get(n.generation) || [];
      arr.push(n.fitness);
      genMap.set(n.generation, arr);
    }

    const fitnessHistory = Array.from(genMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([generation, fitnesses]) => ({
        generation,
        bestFitness: Math.max(...fitnesses),
        avgFitness: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
      }));

    // Mark the best node
    const bestNode = nodes.reduce((best, n) =>
      n.fitness > best.fitness ? n : best
    );
    bestNode.label = "Best";

    return { nodes, fitnessHistory };
  } catch {
    return null;
  }
}

export async function GET() {
  const realData = loadRealData();
  const nodes = realData?.nodes ?? mockNodes;
  const fitnessHistory = realData?.fitnessHistory ?? mockHistory;

  return NextResponse.json({
    nodes,
    fitnessHistory,
    metadata: {
      totalExperiments: nodes.length,
      generations: Math.max(...nodes.map((n) => n.generation)),
      bestFitness: Math.max(...nodes.map((n) => n.fitness)),
      bestNodeId: nodes.reduce((best, n) =>
        n.fitness > best.fitness ? n : best
      ).id,
      algorithm: "MAP-Elites + Island Evolution",
      source: realData ? "experiment_history" : "mock",
    },
  });
}
