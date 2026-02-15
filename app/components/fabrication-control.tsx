"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Play,
  ChevronDown,
  Loader2,
  CheckCircle2,
  FlaskConical,
  Dna,
  Plus,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Parameter range definitions (search space for evolution)           */
/* ------------------------------------------------------------------ */
interface ParamRange {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const defaultParamRanges: ParamRange[] = [
  { label: "Mask Angle", unit: "deg", min: 25, max: 115, step: 1 },
  { label: "Exposure Time", unit: "ms", min: 500, max: 10000, step: 100 },
];

const materials = [
  { value: "glass-uv", label: "Glass + UV Resin" },
  { value: "silicon-pcb", label: "Silicon + PCB Photoresist" },
  { value: "custom", label: "Custom Material" },
];

const advancedOptions = [
  { key: "multiExposure", label: "Multi-exposure Mode" },
  { key: "adaptiveStep", label: "Adaptive Step Size" },
];

/* ------------------------------------------------------------------ */
/*  Optimal result type (returned by evolution)                        */
/* ------------------------------------------------------------------ */
interface OptimalParams {
  maskAngle: number;
  exposureTime: number;
  fitness: number;
  generation: number;
}

type RunStatus = "idle" | "running" | "complete";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function FabricationControl() {
  const [material, setMaterial] = useState("glass-uv");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advToggles, setAdvToggles] = useState<Record<string, boolean>>({
    multiExposure: false,
    adaptiveStep: false,
  });
  const [status, setStatus] = useState<RunStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const [logSteps, setLogSteps] = useState<string[]>([]);
  const [optimalParams, setOptimalParams] = useState<OptimalParams | null>(null);

  // Custom parameters
  const [paramRanges, setParamRanges] = useState<ParamRange[]>(defaultParamRanges);
  const [showAddParam, setShowAddParam] = useState(false);
  const [newParam, setNewParam] = useState<ParamRange>({
    label: "",
    unit: "",
    min: 0,
    max: 100,
    step: 1,
  });

  const addParam = () => {
    if (!newParam.label.trim()) return;
    setParamRanges((prev) => [...prev, { ...newParam, label: newParam.label.trim(), unit: newParam.unit.trim() }]);
    setNewParam({ label: "", unit: "", min: 0, max: 100, step: 1 });
    setShowAddParam(false);
  };

  const removeParam = (index: number) => {
    setParamRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const running = status === "running";

  const runFabrication = useCallback(async () => {
    setStatus("running");
    setLogSteps([]);
    setOptimalParams(null);

    const materialLabel = materials.find((m) => m.value === material)?.label;

    const evolutionSteps = [
      "Initializing evolutionary search...",
      `Loading material profile: ${materialLabel}`,
      `Search space: ${paramRanges.length} parameters, ${paramRanges.map((p) => `${p.label} [${p.min}\u2013${p.max} ${p.unit}]`).join(", ")}`,
      "Generation 1: Sampling 8 random candidates...",
      "Generation 1: Running physical experiments...",
      "Generation 1: Best fitness = 0.34",
      "Generation 2: Mutating top 3 candidates...",
      "Generation 2: Best fitness = 0.52",
      "Generation 3: Crossover + mutation...",
      "Generation 3: Best fitness = 0.71",
      "Generation 4: Refining near optimum...",
      "Generation 4: Best fitness = 0.82",
      "Generation 5: Fine-tuning...",
      "Generation 5: Best fitness = 0.88",
      "Generation 6: Convergence detected.",
      "Generation 6: Best fitness = 0.91",
      "Optimal parameters found. Ready for hardware deployment.",
    ];

    for (let i = 0; i < evolutionSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setLogSteps((s) => [...s, evolutionSteps[i]]);
      setStatusText(evolutionSteps[i]);
    }

    // Call the stub API
    try {
      await fetch("/api/run-fabrication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material }),
      });
    } catch {
      // Stub endpoint — ignore errors
    }

    setOptimalParams({
      maskAngle: 30,
      exposureTime: 6500,
      fitness: 0.91,
      generation: 6,
    });

    setStatus("complete");
    setStatusText("Evolutionary search complete. Optimal parameters found.");
  }, [material]);

  return (
    <section id="fabrication-control" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Settings2 size={20} className="text-accent-blue" />
            <span className="text-xs font-mono text-accent-blue uppercase tracking-wider">
              Hardware Interface
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Fabrication Control Panel
          </h2>
          <p className="text-muted max-w-2xl mb-8 leading-relaxed">
            Define the material and parameter search space. The evolutionary
            optimizer explores these ranges to find the optimal process
            parameters that maximize pattern fidelity.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: search space definition */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Material Selection */}
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FlaskConical size={14} className="text-accent-purple" />
                Material Selection
              </h3>
              <div className="relative">
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  disabled={running}
                  className="w-full appearance-none bg-surface-2 border border-border rounded-lg px-4 py-3 text-sm font-mono text-foreground focus:outline-none focus:border-accent-blue/50 disabled:opacity-40 cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
              </div>
            </div>

            {/* Parameter Ranges (search space) */}
            <div className="bg-surface rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold">
                  Process Parameters — Search Space
                </h3>
                <span className="text-[10px] font-mono text-muted/40">
                  {paramRanges.length} param{paramRanges.length !== 1 && "s"}
                </span>
              </div>
              <p className="text-[10px] text-muted/60 font-mono mb-4">
                The evolutionary optimizer will search within these ranges
              </p>

              <div className="space-y-2">
                {paramRanges.map((p, i) => (
                  <div
                    key={`${p.label}-${i}`}
                    className="group flex items-center gap-3 p-2.5 bg-surface-2 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {p.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                      <span className="text-muted/60">{p.min}</span>
                      <div className="w-16 h-1 rounded-full bg-gradient-to-r from-accent-blue/30 to-accent-cyan/30 relative">
                        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-accent-blue to-accent-cyan opacity-60" />
                      </div>
                      <span className="text-muted/60">{p.max}</span>
                      <span className="text-muted/40 text-[10px] w-8">
                        {p.unit}
                      </span>
                    </div>
                    <button
                      onClick={() => removeParam(i)}
                      disabled={running}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted/40 hover:text-red-400 disabled:pointer-events-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add parameter */}
              <AnimatePresence>
                {showAddParam && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-surface-2 rounded-lg border border-accent-blue/30 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Parameter name"
                          value={newParam.label}
                          onChange={(e) =>
                            setNewParam((p) => ({ ...p, label: e.target.value }))
                          }
                          className="bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent-blue/50"
                        />
                        <input
                          type="text"
                          placeholder="Unit (e.g. rpm)"
                          value={newParam.unit}
                          onChange={(e) =>
                            setNewParam((p) => ({ ...p, unit: e.target.value }))
                          }
                          className="bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-muted/50 mb-1 block">
                            Min
                          </label>
                          <input
                            type="number"
                            value={newParam.min}
                            onChange={(e) =>
                              setNewParam((p) => ({
                                ...p,
                                min: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted/50 mb-1 block">
                            Max
                          </label>
                          <input
                            type="number"
                            value={newParam.max}
                            onChange={(e) =>
                              setNewParam((p) => ({
                                ...p,
                                max: parseFloat(e.target.value) || 100,
                              }))
                            }
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent-blue/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted/50 mb-1 block">
                            Step
                          </label>
                          <input
                            type="number"
                            value={newParam.step}
                            onChange={(e) =>
                              setNewParam((p) => ({
                                ...p,
                                step: parseFloat(e.target.value) || 1,
                              }))
                            }
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-accent-blue/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addParam}
                          disabled={!newParam.label.trim()}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-accent-blue text-white hover:bg-accent-blue/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} />
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddParam(false)}
                          className="px-3 py-2 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showAddParam && (
                <button
                  onClick={() => setShowAddParam(true)}
                  disabled={running}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border hover:border-accent-blue/50 text-xs text-muted hover:text-accent-blue transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Plus size={14} />
                  Add Process Parameter
                </button>
              )}
            </div>

            {/* Advanced Toggle */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold hover:bg-surface-2 transition-colors"
              >
                Advanced Options
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3 border-t border-border">
                      {advancedOptions.map((opt) => (
                        <div
                          key={opt.key}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-xs text-muted">{opt.label}</span>
                          <button
                            onClick={() =>
                              setAdvToggles((t) => ({
                                ...t,
                                [opt.key]: !t[opt.key],
                              }))
                            }
                            disabled={running}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              advToggles[opt.key]
                                ? "bg-accent-blue"
                                : "bg-border-bright"
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                advToggles[opt.key]
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: run + results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Run button */}
            <div className="bg-surface rounded-xl border border-border p-6">
              <button
                onClick={runFabrication}
                disabled={running}
                className="w-full group relative flex items-center justify-center gap-3 px-8 py-5 rounded-xl bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-green text-white font-bold text-lg transition-all hover:shadow-xl hover:shadow-accent-blue/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {status === "idle" && (
                  <>
                    <Play size={22} /> Run Evolutionary Search
                  </>
                )}
                {status === "running" && (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    Searching Parameter Space...
                  </>
                )}
                {status === "complete" && (
                  <>
                    <CheckCircle2 size={22} />
                    Complete — Run Again
                  </>
                )}
              </button>

              {status !== "idle" && (
                <div className="mt-4 text-xs font-mono text-muted">
                  {statusText}
                </div>
              )}
            </div>

            {/* Optimal Parameters (shown after completion) */}
            <AnimatePresence>
              {optimalParams && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface rounded-xl border border-accent-green/30 p-6 glow-green"
                >
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-accent-green">
                    <Dna size={14} />
                    Optimal Parameters Found
                  </h3>
                  <p className="text-[10px] font-mono text-muted/60 mb-4">
                    Generation {optimalParams.generation} — Fitness{" "}
                    <span className="text-accent-green font-bold">
                      {optimalParams.fitness.toFixed(2)}
                    </span>
                  </p>

                  <div className="grid grid-cols-1 gap-3 text-xs font-mono">
                    {[
                      ["Mask Angle", `${optimalParams.maskAngle} deg`],
                      ["Exposure Time", `${optimalParams.exposureTime} ms`],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between p-2 bg-surface-2 rounded-md border border-border"
                      >
                        <span className="text-muted/60">{k}</span>
                        <span className="font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Evolution Log */}
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">Execution Log</h3>
              <div className="h-72 overflow-y-auto space-y-1 font-mono text-xs">
                {logSteps.length === 0 ? (
                  <div className="text-muted/50 text-center py-12">
                    Awaiting evolutionary search...
                  </div>
                ) : (
                  logSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 py-1 border-b border-border/50"
                    >
                      <span className="text-muted/40 shrink-0">
                        [{String(i).padStart(2, "0")}]
                      </span>
                      <span
                        className={
                          i === logSteps.length - 1
                            ? "text-accent-green"
                            : "text-muted"
                        }
                      >
                        {step}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
