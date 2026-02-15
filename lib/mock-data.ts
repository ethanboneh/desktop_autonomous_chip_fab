// Real experiment data from fabrication runs
export interface Experiment {
  id: string;
  parentId: string | null;
  generation: number;
  fitness: number;
  params: {
    maskAngle: number;
    exposureTime: number; // in minutes
  };
  label: string;
  image?: string; // path to wafer photo
  status: "completed" | "suggested";
}

export const experiments: Experiment[] = [
  // Gen 0: Initial random exploration
  {
    id: "exp-1",
    parentId: null,
    generation: 0,
    fitness: 0.15,
    params: { maskAngle: 40, exposureTime: 5 },
    label: "Exp #1",
    image: "/experiments/exp_40deg_5min.png",
    status: "completed",
  },
  {
    id: "exp-2",
    parentId: null,
    generation: 0,
    fitness: 0.25,
    params: { maskAngle: 115, exposureTime: 90 },
    label: "Exp #2",
    image: "/experiments/exp_115deg_90min.png",
    status: "completed",
  },
  // Gen 1: Optimizer narrows toward mid-range angle, shorter exposure
  {
    id: "exp-3",
    parentId: "exp-2",
    generation: 1,
    fitness: 0.72,
    params: { maskAngle: 92, exposureTime: 5 },
    label: "Exp #3 (Best)",
    image: "/experiments/exp_92deg_5min.png",
    status: "completed",
  },
  // Gen 2: Suggested next experiments (optimizer recommendations)
  {
    id: "exp-4",
    parentId: "exp-3",
    generation: 2,
    fitness: 0,
    params: { maskAngle: 88, exposureTime: 4 },
    label: "Next #1",
    status: "suggested",
  },
  {
    id: "exp-5",
    parentId: "exp-3",
    generation: 2,
    fitness: 0,
    params: { maskAngle: 95, exposureTime: 6 },
    label: "Next #2",
    status: "suggested",
  },
];

// Fitness over generations for line chart
export const fitnessHistory = [
  { generation: 0, bestFitness: 0.25, avgFitness: 0.20 },
  { generation: 1, bestFitness: 0.72, avgFitness: 0.72 },
];

// Fabrication status
export const fabricationStatus = {
  maskAngle: 92,
  exposureTime: 5,
  material: "Glass + UV Resin",
  currentExperiment: 3,
  status: "running" as const,
};
