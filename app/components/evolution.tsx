"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
} from "recharts";
import { GitBranch, TrendingUp, X, Dna } from "lucide-react";
import {
  evolutionNodes as mockNodes,
  fitnessHistory as mockHistory,
  type EvolutionNode,
} from "@/lib/mock-data";

const POLL_INTERVAL_MS = 5000;

function fitnessToColor(fitness: number): string {
  const r = Math.round(255 * (1 - fitness));
  const g = Math.round(255 * fitness);
  return `rgb(${r}, ${g}, 60)`;
}

function EvolutionNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as { node: EvolutionNode; isBest: boolean; onSelect: (n: EvolutionNode) => void };
  const { node, isBest, onSelect } = nodeData;
  const color = fitnessToColor(node.fitness);

  return (
    <div
      onClick={() => onSelect(node)}
      className="cursor-pointer group"
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div
        className={`relative px-3 py-2 rounded-lg border transition-all hover:scale-105 ${
          isBest ? "ring-2 ring-accent-green/60" : ""
        }`}
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
        }}
      >
        <div className="text-[10px] font-mono font-bold" style={{ color }}>
          {node.label}
        </div>
        <div className="text-[9px] font-mono text-muted mt-0.5">
          f={node.fitness.toFixed(2)}
        </div>
        {isBest && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent-green border border-background" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
}

const nodeTypes = { evolution: EvolutionNodeComponent };

interface FitnessEntry {
  generation: number;
  bestFitness: number;
  avgFitness: number;
}

export default function Evolution() {
  const [selectedNode, setSelectedNode] = useState<EvolutionNode | null>(null);
  const [nodes, setNodes] = useState<EvolutionNode[]>(mockNodes);
  const [history, setHistory] = useState<FitnessEntry[]>(mockHistory);

  // Poll for live data
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/evolution-data");
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.nodes?.length) {
          setNodes(data.nodes);
          setHistory(data.fitnessHistory);
        }
      } catch {
        // polling errors are non-fatal
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const bestNode = useMemo(
    () => nodes.reduce((best, n) => (n.fitness > best.fitness ? n : best)),
    [nodes]
  );

  const handleSelect = useCallback((node: EvolutionNode) => {
    setSelectedNode(node);
  }, []);

  const { flowNodes, flowEdges } = useMemo(() => {
    const genGroups = new Map<number, EvolutionNode[]>();
    nodes.forEach((n) => {
      const arr = genGroups.get(n.generation) || [];
      arr.push(n);
      genGroups.set(n.generation, arr);
    });

    const fNodes: Node[] = nodes.map((n) => {
      const genNodes = genGroups.get(n.generation)!;
      const idx = genNodes.indexOf(n);
      const total = genNodes.length;
      const xSpacing = 160;
      const ySpacing = 100;
      const xOffset = (idx - (total - 1) / 2) * xSpacing;

      return {
        id: n.id,
        type: "evolution",
        position: { x: 400 + xOffset, y: n.generation * ySpacing + 50 },
        data: { node: n, isBest: n.id === bestNode.id, onSelect: handleSelect },
      };
    });

    const fEdges: Edge[] = nodes
      .filter((n) => n.parentId !== null)
      .map((n) => ({
        id: `${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        style: { stroke: fitnessToColor(n.fitness), strokeWidth: 1.5, opacity: 0.5 },
        animated: n.id === bestNode.id,
      }));

    return { flowNodes: fNodes, flowEdges: fEdges };
  }, [nodes, bestNode, handleSelect]);

  const renderParams = (node: EvolutionNode) => (
    <>
      <div className="flex justify-between">
        <span className="text-muted">Mask Angle</span>
        <span>{node.params.maskAngle}°</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Exposure Time</span>
        <span>{node.params.exposureTime} ms</span>
      </div>
    </>
  );

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
            Evolutionary Search Landscape
          </h2>
          <p className="text-muted max-w-2xl mb-8 leading-relaxed">
            Visualizing the evolutionary optimization process. Each node
            represents an experiment; edges show mutation lineage. Color
            intensity maps to reward score.
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
            <div className="bg-surface rounded-xl border border-border overflow-hidden" style={{ height: 550 }}>
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface-2">
                <GitBranch size={14} className="text-accent-purple" />
                <span className="text-xs font-mono text-muted">
                  Evolution Graph — {nodes.length} experiments
                </span>
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
                <Controls
                  className="!bg-surface-2 !border-border !rounded-lg [&>button]:!bg-surface-2 [&>button]:!border-border [&>button]:!text-muted [&>button:hover]:!bg-surface-3"
                />
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
            {/* Fitness chart */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent-green" />
                Fitness Over Generations
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.08)"
                    />
                    <XAxis
                      dataKey="generation"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      label={{
                        value: "Generation",
                        position: "bottom",
                        offset: -5,
                        style: { fontSize: 9, fill: "#71717a" },
                      }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, 1]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgFitness"
                      stroke="#3b82f6"
                      fill="#3b82f620"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestFitness"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 text-[10px] font-mono text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-accent-green inline-block" /> Best
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-accent-blue inline-block" /> Average
                </span>
              </div>
            </div>

            {/* Best node details */}
            <div className="bg-surface rounded-xl border border-accent-green/20 p-4 glow-green">
              <h3 className="text-sm font-semibold mb-3 text-accent-green">
                Best Experiment
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted">Node</span>
                  <span>{bestNode.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fitness</span>
                  <span className="text-accent-green font-bold">
                    {bestNode.fitness.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Generation</span>
                  <span>{bestNode.generation}</span>
                </div>
                <div className="h-px bg-border my-2" />
                {renderParams(bestNode)}
              </div>
            </div>

            {/* Expandable node details */}
            <AnimatePresence>
              {selectedNode && selectedNode.id !== bestNode.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface rounded-xl border border-border p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">
                      {selectedNode.label}
                    </h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-muted hover:text-foreground transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">Fitness</span>
                      <span style={{ color: fitnessToColor(selectedNode.fitness) }}>
                        {selectedNode.fitness.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Generation</span>
                      <span>{selectedNode.generation}</span>
                    </div>
                    {renderParams(selectedNode)}
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
