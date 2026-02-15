// Evolution graph mock data (OpenEvolve-compatible format)
export interface EvolutionNode {
  id: string;
  parentId: string | null;
  generation: number;
  fitness: number;
  params: {
    maskAngle: number;
    exposureTime: number;
  };
  label: string;
}

export const evolutionNodes: EvolutionNode[] = [
  { id: "0", parentId: null, generation: 0, fitness: 0.12, params: { maskAngle: 70, exposureTime: 3000 }, label: "Seed" },
  { id: "1", parentId: "0", generation: 1, fitness: 0.24, params: { maskAngle: 55, exposureTime: 4000 }, label: "Gen 1-A" },
  { id: "2", parentId: "0", generation: 1, fitness: 0.18, params: { maskAngle: 85, exposureTime: 2500 }, label: "Gen 1-B" },
  { id: "3", parentId: "1", generation: 2, fitness: 0.41, params: { maskAngle: 45, exposureTime: 4500 }, label: "Gen 2-A" },
  { id: "4", parentId: "1", generation: 2, fitness: 0.35, params: { maskAngle: 50, exposureTime: 3800 }, label: "Gen 2-B" },
  { id: "5", parentId: "2", generation: 2, fitness: 0.29, params: { maskAngle: 80, exposureTime: 3200 }, label: "Gen 2-C" },
  { id: "6", parentId: "3", generation: 3, fitness: 0.58, params: { maskAngle: 40, exposureTime: 5000 }, label: "Gen 3-A" },
  { id: "7", parentId: "3", generation: 3, fitness: 0.52, params: { maskAngle: 42, exposureTime: 4800 }, label: "Gen 3-B" },
  { id: "8", parentId: "4", generation: 3, fitness: 0.44, params: { maskAngle: 48, exposureTime: 4200 }, label: "Gen 3-C" },
  { id: "9", parentId: "6", generation: 4, fitness: 0.71, params: { maskAngle: 35, exposureTime: 5500 }, label: "Gen 4-A" },
  { id: "10", parentId: "6", generation: 4, fitness: 0.65, params: { maskAngle: 38, exposureTime: 5200 }, label: "Gen 4-B" },
  { id: "11", parentId: "7", generation: 4, fitness: 0.61, params: { maskAngle: 40, exposureTime: 5000 }, label: "Gen 4-C" },
  { id: "12", parentId: "9", generation: 5, fitness: 0.82, params: { maskAngle: 32, exposureTime: 6000 }, label: "Gen 5-A" },
  { id: "13", parentId: "9", generation: 5, fitness: 0.76, params: { maskAngle: 34, exposureTime: 5800 }, label: "Gen 5-B" },
  { id: "14", parentId: "10", generation: 5, fitness: 0.69, params: { maskAngle: 36, exposureTime: 5400 }, label: "Gen 5-C" },
  { id: "15", parentId: "12", generation: 6, fitness: 0.91, params: { maskAngle: 30, exposureTime: 6500 }, label: "Best" },
  { id: "16", parentId: "12", generation: 6, fitness: 0.85, params: { maskAngle: 31, exposureTime: 6200 }, label: "Gen 6-B" },
  { id: "17", parentId: "13", generation: 6, fitness: 0.79, params: { maskAngle: 33, exposureTime: 6000 }, label: "Gen 6-C" },
];

// Fitness over generations for line chart
export const fitnessHistory = [
  { generation: 0, bestFitness: 0.12, avgFitness: 0.12 },
  { generation: 1, bestFitness: 0.24, avgFitness: 0.21 },
  { generation: 2, bestFitness: 0.41, avgFitness: 0.35 },
  { generation: 3, bestFitness: 0.58, avgFitness: 0.51 },
  { generation: 4, bestFitness: 0.71, avgFitness: 0.66 },
  { generation: 5, bestFitness: 0.82, avgFitness: 0.75 },
  { generation: 6, bestFitness: 0.91, avgFitness: 0.85 },
];

// Simulation loss data
export const simulationLossData = Array.from({ length: 100 }, (_, i) => ({
  iteration: i,
  loss: 2.5 * Math.exp(-0.03 * i) + 0.1 + Math.random() * 0.05 * Math.exp(-0.02 * i),
}));

// Fabrication status mock
export const fabricationStatus = {
  maskAngle: 30,
  exposureTime: 6500,
  material: "Glass + UV Resin",
  currentExperiment: 47,
  status: "running" as const,
};
