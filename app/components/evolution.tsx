"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { GitBranch, TrendingUp, X, Dna, Crosshair, Sparkles } from "lucide-react";
import { experiments, fitnessHistory, type Experiment } from "@/lib/mock-data";

function fitnessToColor(fitness: number): string {
  if (fitness === 0) return "#6b7280"; // suggested (no result yet)
  const r = Math.round(255 * (1 - fitness));
  const g = Math.round(255 * fitness);
  return `rgb(${r}, ${g}, 60)`;
}

/* ------------------------------------------------------------------ */
/*  Custom React Flow node with experiment photo                       */
/* ------------------------------------------------------------------ */
function ExperimentNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as {
    exp: Experiment;
    isBest: boolean;
    onSelect: (e: Experiment) => void;
  };
  const { exp, isBest, onSelect } = nodeData;
  const color = fitnessToColor(exp.fitness);
  const isSuggested = exp.status === "suggested";

  return (
    <div onClick={() => onSelect(exp)} className="cursor-pointer group">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <div
        className={`relative rounded-xl border-2 transition-all hover:scale-105 overflow-hidden ${
          isBest ? "ring-2 ring-accent-green/60" : ""
        } ${isSuggested ? "border-dashed" : ""}`}
        style={{
          borderColor: isSuggested ? "#6b728060" : `${color}60`,
          backgroundColor: isSuggested ? "#f3f4f680" : `${color}10`,
          width: 140,
        }}
      >
        {/* Experiment image or placeholder */}
        {exp.image ? (
          <div className="w-full h-24 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exp.image}
              alt={exp.label}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-24 bg-surface-2 flex items-center justify-center">
            <Sparkles size={20} className="text-muted/30" />
          </div>
        )}

        {/* Info bar */}
        <div className="px-2.5 py-2">
          <div className="text-[10px] font-mono font-bold" style={{ color }}>
            {exp.label}
          </div>
          <div className="text-[9px] font-mono text-muted mt-0.5">
            {exp.params.maskAngle}° / {exp.params.exposureTime}min
          </div>
          {!isSuggested && (
            <div className="text-[9px] font-mono mt-0.5" style={{ color }}>
              fitness = {exp.fitness.toFixed(2)}
            </div>
          )}
          {isSuggested && (
            <div className="text-[9px] font-mono text-muted/50 mt-0.5 italic">
              queued
            </div>
          )}
        </div>

        {isBest && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-green border-2 border-white flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">1</span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </div>
  );
}

const nodeTypes = { experiment: ExperimentNodeComponent };

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Evolution() {
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  const completedExps = useMemo(
    () => experiments.filter((e) => e.status === "completed"),
    []
  );

  const bestExp = useMemo(
    () =>
      completedExps.reduce((best, e) =>
        e.fitness > best.fitness ? e : best
      ),
    [completedExps]
  );

  const suggestedExps = useMemo(
    () => experiments.filter((e) => e.status === "suggested"),
    []
  );

  const handleSelect = useCallback((exp: Experiment) => {
    setSelectedExp(exp);
  }, []);

  // Build React Flow graph
  const { flowNodes, flowEdges } = useMemo(() => {
    const genGroups = new Map<number, Experiment[]>();
    experiments.forEach((e) => {
      const arr = genGroups.get(e.generation) || [];
      arr.push(e);
      genGroups.set(e.generation, arr);
    });

    const nodes: Node[] = experiments.map((e) => {
      const genExps = genGroups.get(e.generation)!;
      const idx = genExps.indexOf(e);
      const total = genExps.length;
      const xSpacing = 200;
      const ySpacing = 180;
      const xOffset = (idx - (total - 1) / 2) * xSpacing;

      return {
        id: e.id,
        type: "experiment",
        position: { x: 300 + xOffset, y: e.generation * ySpacing + 30 },
        data: { exp: e, isBest: e.id === bestExp.id, onSelect: handleSelect },
      };
    });

    const edges: Edge[] = experiments
      .filter((e) => e.parentId !== null)
      .map((e) => ({
        id: `${e.parentId}-${e.id}`,
        source: e.parentId!,
        target: e.id,
        style: {
          stroke:
            e.status === "suggested"
              ? "#6b728040"
              : fitnessToColor(e.fitness),
          strokeWidth: e.id === bestExp.id ? 2.5 : 1.5,
          opacity: e.status === "suggested" ? 0.4 : 0.7,
          strokeDasharray: e.status === "suggested" ? "6 3" : undefined,
        },
        animated: e.id === bestExp.id,
      }));

    return { flowNodes: nodes, flowEdges: edges };
  }, [bestExp, handleSelect]);

  // Scatter data for parameter space (angle vs exposure)
  const scatterData = completedExps.map((e) => ({
    angle: e.params.maskAngle,
    exposure: e.params.exposureTime,
    fitness: e.fitness,
    label: e.label,
  }));

  const suggestedScatter = suggestedExps.map((e) => ({
    angle: e.params.maskAngle,
    exposure: e.params.exposureTime,
    fitness: 0,
    label: e.label,
  }));

  return (
    <section id="evolution" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Dna size={20} className="text-accent-purple" />
            <span className="text-xs font-mono text-accent-purple uppercase tracking-wider">
              Optimization Engine
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Evolutionary Search
          </h2>
          <p className="text-muted max-w-2xl mb-8 leading-relaxed">
            Real fabrication experiments with photos. Each node is a physical
            wafer produced with different parameters. The optimizer suggests
            the next experiments to run based on prior results.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* React Flow Graph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div
              className="bg-surface rounded-xl border border-border overflow-hidden"
              style={{ height: 600 }}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} className="text-accent-purple" />
                  <span className="text-xs font-mono text-muted">
                    Experiment Tree — {completedExps.length} completed,{" "}
                    {suggestedExps.length} suggested
                  </span>
                </div>
                {/* Reference mask */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted/60">
                    Reference:
                  </span>
                  <div className="w-8 h-8 rounded overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/experiments/reference_mask.png"
                      alt="Reference mask"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.3}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
                className="!bg-surface"
              >
                <Background color="rgba(59,130,246,0.05)" gap={30} />
                <Controls className="!bg-surface-2 !border-border !rounded-lg [&>button]:!bg-surface-2 [&>button]:!border-border [&>button]:!text-muted [&>button:hover]:!bg-surface-3" />
              </ReactFlow>
            </div>
          </motion.div>

          {/* Side panels */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Reference target */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Crosshair size={14} className="text-accent-blue" />
                Reference Mask
              </h3>
              <div className="rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/experiments/reference_mask.png"
                  alt="Reference mask design"
                  className="w-full aspect-square object-cover"
                />
              </div>
              <p className="text-[10px] text-muted/60 font-mono mt-2">
                Target pattern to reproduce on wafer
              </p>
            </div>

            {/* Parameter space scatter plot */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent-green" />
                Parameter Space
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.08)"
                    />
                    <XAxis
                      dataKey="angle"
                      type="number"
                      name="Angle"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      label={{
                        value: "Mask Angle (deg)",
                        position: "bottom",
                        offset: 0,
                        style: { fontSize: 9, fill: "#71717a" },
                      }}
                    />
                    <YAxis
                      dataKey="exposure"
                      type="number"
                      name="Exposure"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      label={{
                        value: "Exposure (min)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        style: { fontSize: 9, fill: "#71717a" },
                      }}
                    />
                    <ZAxis dataKey="fitness" range={[60, 200]} />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    {/* Completed experiments */}
                    <Scatter name="Completed" data={scatterData}>
                      {scatterData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={fitnessToColor(entry.fitness)}
                          stroke={fitnessToColor(entry.fitness)}
                        />
                      ))}
                    </Scatter>
                    {/* Suggested next */}
                    <Scatter
                      name="Suggested"
                      data={suggestedScatter}
                      shape="diamond"
                    >
                      {suggestedScatter.map((_, i) => (
                        <Cell
                          key={i}
                          fill="transparent"
                          stroke="#7c3aed"
                          strokeWidth={2}
                          strokeDasharray="3 2"
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 text-[10px] font-mono text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-green inline-block" />{" "}
                  Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm border border-accent-purple inline-block" />{" "}
                  Suggested
                </span>
              </div>
            </div>

            {/* Best experiment */}
            <div className="bg-surface rounded-xl border border-accent-green/20 p-4 glow-green">
              <h3 className="text-sm font-semibold mb-3 text-accent-green">
                Best Experiment
              </h3>
              {bestExp.image && (
                <div className="rounded-lg overflow-hidden border border-accent-green/20 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bestExp.image}
                    alt={bestExp.label}
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Experiment</span>
                  <span>{bestExp.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fitness</span>
                  <span className="text-accent-green font-bold">
                    {bestExp.fitness.toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between">
                  <span className="text-muted">Mask Angle</span>
                  <span>{bestExp.params.maskAngle}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Exposure</span>
                  <span>{bestExp.params.exposureTime} min</span>
                </div>
              </div>
            </div>

            {/* Suggested next experiments */}
            {suggestedExps.length > 0 && (
              <div className="bg-surface rounded-xl border border-accent-purple/20 p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent-purple">
                  <Sparkles size={14} />
                  Suggested Next
                </h3>
                <div className="space-y-3">
                  {suggestedExps.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2.5 bg-surface-2 rounded-lg border border-dashed border-accent-purple/20"
                    >
                      <div>
                        <div className="text-xs font-mono font-semibold">
                          {exp.label}
                        </div>
                        <div className="text-[10px] font-mono text-muted">
                          {exp.params.maskAngle}° / {exp.params.exposureTime}{" "}
                          min
                        </div>
                      </div>
                      <div className="text-[9px] font-mono text-accent-purple/60 italic">
                        queued
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-muted/50 font-mono mt-3">
                  Parameters selected by evolutionary optimizer based on
                  fitness gradient near best result
                </p>
              </div>
            )}

            {/* Selected experiment detail */}
            <AnimatePresence>
              {selectedExp && selectedExp.id !== bestExp.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">
                      {selectedExp.label}
                    </h3>
                    <button
                      onClick={() => setSelectedExp(null)}
                      className="text-muted hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {selectedExp.image && (
                    <div className="rounded-lg overflow-hidden border border-border mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedExp.image}
                        alt={selectedExp.label}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">Fitness</span>
                      <span
                        style={{ color: fitnessToColor(selectedExp.fitness) }}
                      >
                        {selectedExp.status === "suggested"
                          ? "pending"
                          : selectedExp.fitness.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Mask Angle</span>
                      <span>{selectedExp.params.maskAngle}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Exposure</span>
                      <span>{selectedExp.params.exposureTime} min</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
