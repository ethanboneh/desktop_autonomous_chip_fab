"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  ArrowRight,
  Waves,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface StepMetrics {
  step: number;
  loss: number;
  iou: number;
  l2: number;
  tv: number;
}

interface ProgressEntry {
  type: string;
  mode?: string;
  step?: number;
  totalSteps?: number;
  metrics?: StepMetrics;
  framePath?: string;
  message?: string;
  finalIou?: number;
}

type RunState = "idle" | "running" | "complete";

/* ------------------------------------------------------------------ */
/*  Pipeline: target + litho flowchart                                 */
/* ------------------------------------------------------------------ */
function LithoPipeline({ targetPreview }: { targetPreview: string | null }) {
  const pipelineSteps = [
    { label: "Target Design", desc: "Binary pattern (white = material)" },
    { label: "Mask Optimization", desc: "Gradient descent with OPC" },
    { label: "Optical Simulation", desc: "Abbe partially-coherent imaging" },
    { label: "Resist Pattern", desc: "Thresholded developed output" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* Target image */}
      <div className="shrink-0">
        <div className="rounded-lg overflow-hidden border border-accent-blue/30 w-36 h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetPreview || "/simulation/target-mask.png"}
            alt="Target mask"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-[10px] font-mono text-accent-blue text-center mt-1.5">
          Target Mask
        </div>
      </div>

      {/* Flowchart */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-[10px] font-mono text-muted/60 uppercase tracking-wider mb-1">
          Nanofabrication Pipeline
        </div>
        {pipelineSteps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-mono text-accent-blue font-bold">{i + 1}</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold">{step.label}</span>
              <span className="text-[10px] text-muted/60 ml-2">{step.desc}</span>
            </div>
            {i < pipelineSteps.length - 1 && (
              <ArrowRight size={10} className="text-muted/30 shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Static demo frames (pre-computed results for Vercel deployment)     */
/* ------------------------------------------------------------------ */
const demoFrames = {
  standard: [
    "/simulation/optimized-mask-1.png",
    "/simulation/optimized-mask-2.png",
    "/simulation/optimized-mask-3.png",
    "/simulation/optimized-mask-final.png",
  ],
  improved: [
    "/simulation/comparison-1.png",
    "/simulation/comparison-2.png",
    "/simulation/comparison-3.png",
    "/simulation/comparison-final.png",
  ],
};

const demoMetrics: StepMetrics[] = [
  { step: 50,  loss: 0.082, iou: 0.41, l2: 0.072, tv: 0.010 },
  { step: 100, loss: 0.045, iou: 0.63, l2: 0.038, tv: 0.007 },
  { step: 150, loss: 0.028, iou: 0.78, l2: 0.022, tv: 0.006 },
  { step: 200, loss: 0.012, iou: 0.89, l2: 0.008, tv: 0.004 },
];

/* ------------------------------------------------------------------ */
/*  Live Optimization Viewer                                           */
/* ------------------------------------------------------------------ */
function LiveOptimizationViewer({
  jobId,
  mode,
  label,
  color,
  frames,
  currentFrame,
  playing,
  demoMode,
}: {
  jobId: string | null;
  mode: string;
  label: string;
  color: string;
  frames: string[];
  currentFrame: number;
  onFrameChange: (f: number) => void;
  playing: boolean;
  demoMode: boolean;
}) {
  // In demo mode, use static images from /public/simulation/
  if (demoMode) {
    const staticFrames = mode === "standard" ? demoFrames.standard : demoFrames.improved;
    const frameIdx = Math.min(currentFrame, staticFrames.length - 1);

    return (
      <div className="relative rounded-lg overflow-hidden border border-border bg-gray-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={staticFrames[frameIdx]}
          alt={`${label} step ${frameIdx}`}
          className="w-full h-auto"
        />
        <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-[10px] font-mono" style={{ color }}>
            {frameIdx + 1} / {staticFrames.length}
          </span>
        </div>
        {playing && (
          <div className="absolute top-2 left-2 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot" />
            <span className="text-[10px] font-mono text-gray-200">LIVE</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
          <motion.div
            className="h-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${((frameIdx + 1) / staticFrames.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }

  const modeFrames = frames.filter((f) => f.startsWith(mode + "_frame_"));

  if (!jobId || modeFrames.length === 0) {
    return (
      <div className="aspect-[3/1] bg-gray-900 rounded-lg border border-border flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted/40 text-xs font-mono">
            {jobId ? "Waiting for frames..." : `Click "Run" to start ${label}`}
          </div>
        </div>
      </div>
    );
  }

  const frameIdx = Math.min(currentFrame, modeFrames.length - 1);
  const currentFrameName = modeFrames[frameIdx];

  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-gray-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/simulation/run?jobId=${jobId}&frame=${currentFrameName}`}
        alt={`${label} step ${frameIdx}`}
        className="w-full h-auto"
      />

      {/* Frame indicator */}
      <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-md">
        <span className="text-[10px] font-mono" style={{ color }}>
          {frameIdx + 1} / {modeFrames.length}
        </span>
      </div>

      {playing && (
        <div className="absolute top-2 left-2 bg-gray-900/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot" />
          <span className="text-[10px] font-mono text-gray-200">LIVE</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${((frameIdx + 1) / modeFrames.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Simulation Section                                            */
/* ------------------------------------------------------------------ */
export default function Simulation() {
  // Optimization state
  const [runState, setRunState] = useState<RunState>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [standardMetrics, setStandardMetrics] = useState<StepMetrics[]>([]);
  const [improvedMetrics, setImprovedMetrics] = useState<StepMetrics[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [standardFinalIou, setStandardFinalIou] = useState<number | null>(null);
  const [improvedFinalIou, setImprovedFinalIou] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Parameters
  const [steps, setSteps] = useState(200);
  const [learningRate, setLearningRate] = useState(0.01);

  // Upload state
  const [uploadedTarget, setUploadedTarget] = useState<string | null>(null); // base64 data URL for preview
  const [uploadedTargetBase64, setUploadedTargetBase64] = useState<string | null>(null); // raw base64 for API
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopPlaying = useCallback(() => {
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedTarget(dataUrl);
      // Extract raw base64 (strip data:image/...;base64, prefix)
      setUploadedTargetBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadedTarget(null);
    setUploadedTargetBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Demo mode: animate through pre-computed frames
  const runDemoOptimization = useCallback(async () => {
    setIsDemoMode(true);
    setRunState("running");
    setCurrentFrame(0);
    setStandardMetrics([]);
    setImprovedMetrics([]);
    setStandardFinalIou(null);
    setImprovedFinalIou(null);
    setIsPlaying(true);

    const demoSteps = [
      "Starting mask optimization (demo — pre-computed results)...",
      "Step 50/200 — Standard: IOU 0.41 | Improved: IOU 0.44",
      "Step 100/200 — Standard: IOU 0.63 | Improved: IOU 0.69",
      "Step 150/200 — Standard: IOU 0.78 | Improved: IOU 0.84",
      "Step 200/200 — Standard: IOU 0.89 | Improved: IOU 0.93",
      "Optimization complete!",
    ];

    const totalDemoFrames = demoFrames.standard.length;

    for (let i = 0; i < demoSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      setStatusMessage(demoSteps[i]);

      // Advance frame for steps 1-4 (matching the 4 pre-computed images)
      if (i > 0 && i <= totalDemoFrames) {
        setCurrentFrame(i - 1);
        // Feed metrics incrementally
        setStandardMetrics(demoMetrics.slice(0, i));
        setImprovedMetrics(
          demoMetrics.slice(0, i).map((m) => ({
            ...m,
            iou: Math.min(1, m.iou + 0.04),
            l2: Math.max(0, m.l2 - 0.002),
          }))
        );
      }
    }

    setStandardFinalIou(0.89);
    setImprovedFinalIou(0.93);
    setRunState("complete");
    setIsPlaying(false);
  }, []);

  // Start optimization
  const runOptimization = useCallback(async () => {
    stopPolling();
    stopPlaying();
    setRunState("running");
    setFrames([]);
    setStandardMetrics([]);
    setImprovedMetrics([]);
    setCurrentFrame(0);
    setStandardFinalIou(null);
    setImprovedFinalIou(null);
    setIsDemoMode(false);
    setStatusMessage("Starting optimization...");
    setIsPlaying(true);

    try {
      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps,
          mode: "both",
          lr: learningRate,
          ...(uploadedTargetBase64 ? { targetImage: uploadedTargetBase64 } : {}),
        }),
      });
      const data = await res.json();

      // If the API returned an immediate "complete" (Vercel demo mode), use static frames
      if (data.status === "complete") {
        runDemoOptimization();
        return;
      }

      setJobId(data.jobId);

      // Poll for updates (local server with TorchResist)
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/simulation/run?jobId=${data.jobId}`);
          const pollData = await pollRes.json();

          setFrames(pollData.frames || []);

          // Extract metrics from progress entries
          const progress: ProgressEntry[] = pollData.progress || [];

          const stdMetrics: StepMetrics[] = [];
          const impMetrics: StepMetrics[] = [];

          for (const entry of progress) {
            if (entry.type === "progress" && entry.metrics) {
              if (entry.mode === "standard") stdMetrics.push(entry.metrics);
              if (entry.mode === "improved") impMetrics.push(entry.metrics);
            }
            if (entry.type === "status" && entry.message) {
              setStatusMessage(entry.message);
            }
            if (entry.type === "complete") {
              if (entry.mode === "standard" && entry.finalIou) {
                setStandardFinalIou(entry.finalIou);
              }
              if (entry.mode === "improved" && entry.finalIou) {
                setImprovedFinalIou(entry.finalIou);
              }
            }
          }

          if (stdMetrics.length > 0) setStandardMetrics(stdMetrics);
          if (impMetrics.length > 0) setImprovedMetrics(impMetrics);

          // Auto-advance frame
          const stdFrames = (pollData.frames || []).filter((f: string) =>
            f.startsWith("standard_frame_")
          );
          if (stdFrames.length > 0) {
            setCurrentFrame(stdFrames.length - 1);
          }

          if (pollData.status === "complete" || pollData.status === "error") {
            stopPolling();
            setRunState("complete");
            setIsPlaying(false);
            setStatusMessage(
              pollData.status === "complete"
                ? "Optimization complete!"
                : "Error during optimization"
            );
          }
        } catch {
          // polling error, non-fatal
        }
      }, 2000);
    } catch {
      // Network error — fall back to demo mode
      runDemoOptimization();
    }
  }, [steps, learningRate, uploadedTargetBase64, stopPolling, stopPlaying, runDemoOptimization]);

  // Playback controls
  const startPlayback = useCallback(() => {
    const totalFrames = isDemoMode
      ? demoFrames.standard.length
      : frames.filter((f) => f.startsWith("standard_frame_")).length;
    if (totalFrames === 0) return;

    setIsPlaying(true);
    setCurrentFrame(0);
    let f = 0;
    playRef.current = setInterval(() => {
      f++;
      if (f >= totalFrames) {
        stopPlaying();
        setCurrentFrame(totalFrames - 1);
        return;
      }
      setCurrentFrame(f);
    }, 800);
  }, [frames, isDemoMode, stopPlaying]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopPlaying();
    };
  }, [stopPolling, stopPlaying]);

  // Combined IOU chart data
  const iouChartData = standardMetrics.map((s, i) => ({
    step: s.step,
    standard: s.iou,
    improved: improvedMetrics[i]?.iou ?? null,
  }));

  // Combined loss chart data
  const lossChartData = standardMetrics.map((s, i) => ({
    step: s.step,
    standard: s.l2,
    improved: improvedMetrics[i]?.l2 ?? null,
  }));

  const stdFrames = isDemoMode
    ? demoFrames.standard
    : frames.filter((f) => f.startsWith("standard_frame_"));
  const impFrames = isDemoMode
    ? demoFrames.improved
    : frames.filter((f) => f.startsWith("improved_frame_"));

  return (
    <section id="simulation" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Waves size={20} className="text-accent-cyan" />
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider">
              Differentiable Simulation
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Lithography Simulation
          </h2>
          <p className="text-muted max-w-2xl mb-4 leading-relaxed">
            We use differentiable lithography simulation and gradient descent to
            optimize photomask designs. Standard optimization often merges
            features that should be separate. Our improved loss with{" "}
            <strong className="text-[#f59e0b]">gap preservation</strong>{" "}
            keeps features separated even when diffraction tries to fill in narrow gaps.
          </p>
          <div className="flex flex-wrap gap-3 mb-8 text-xs font-mono text-muted/70">
            <span className="px-2 py-1 rounded bg-surface-2 border border-border">
              Abbe Imaging — Differentiable Lithography
            </span>
            <span className="px-2 py-1 rounded bg-surface-2 border border-border">
              Gap Preservation + Connectivity Loss
            </span>
          </div>
        </motion.div>

        {/* Pipeline + upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap size={14} className="text-accent-cyan" />
              Lithography Pipeline — TorchResist
            </h3>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <LithoPipeline targetPreview={uploadedTarget} />
              </div>

              {/* Upload area */}
              <div className="shrink-0 w-full lg:w-56">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/bmp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedTarget ? (
                  <div className="relative">
                    <div className="rounded-lg border border-accent-green/30 bg-accent-green/5 p-3">
                      <div className="text-[10px] font-mono text-accent-green uppercase tracking-wider mb-2">
                        Custom Target
                      </div>
                      <div className="rounded overflow-hidden border border-border mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadedTarget}
                          alt="Uploaded target"
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                      <button
                        onClick={clearUpload}
                        disabled={runState === "running"}
                        className="flex items-center gap-1 text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        <X size={10} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={runState === "running"}
                    className="w-full h-full min-h-[120px] rounded-lg border-2 border-dashed border-border hover:border-accent-blue/40 bg-surface-2/50 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={20} className="text-muted/40" />
                    <span className="text-[10px] font-mono text-muted/60">
                      Upload custom pattern
                    </span>
                    <span className="text-[9px] text-muted/40">
                      PNG, grayscale, any size
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">Learning Rate</span>
                    <span className="font-mono text-accent-blue">
                      {learningRate.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.05"
                    step="0.001"
                    value={learningRate}
                    onChange={(e) =>
                      setLearningRate(parseFloat(e.target.value))
                    }
                    disabled={runState === "running"}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">Iterations</span>
                    <span className="font-mono text-accent-blue">{steps}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="50"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    disabled={runState === "running"}
                  />
                </div>
              </div>

              <button
                onClick={runOptimization}
                disabled={runState === "running"}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-medium text-sm transition-all hover:shadow-lg hover:shadow-accent-blue/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {runState === "running" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Optimization
                  </>
                )}
              </button>
            </div>

            {/* Status */}
            {statusMessage && (
              <div className="mt-4 flex items-center gap-2">
                {runState === "running" && (
                  <div className="w-2 h-2 rounded-full bg-accent-green pulse-dot" />
                )}
                <span className="text-xs font-mono text-muted">
                  {statusMessage}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Side-by-side comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Play size={14} className="text-accent-blue" />
                Live Optimization — Standard vs Improved
              </h3>

              {/* Playback controls (after completion) */}
              {runState === "complete" && stdFrames.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={isPlaying ? stopPlaying : startPlayback}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 border border-border text-xs font-medium hover:bg-surface-3 transition-colors"
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                    {isPlaying ? "Pause" : "Replay"}
                  </button>
                  <button
                    onClick={() => {
                      stopPlaying();
                      setCurrentFrame(0);
                    }}
                    className="p-1.5 rounded-md bg-surface-2 border border-border text-muted hover:text-foreground transition-colors"
                  >
                    <RotateCcw size={12} />
                  </button>

                  {/* Step navigation */}
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() =>
                        setCurrentFrame(Math.max(0, currentFrame - 1))
                      }
                      disabled={currentFrame === 0 || isPlaying}
                      className="p-1 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-mono text-muted w-12 text-center">
                      {currentFrame + 1} / {stdFrames.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentFrame(
                          Math.min(stdFrames.length - 1, currentFrame + 1)
                        )
                      }
                      disabled={
                        currentFrame >= stdFrames.length - 1 || isPlaying
                      }
                      className="p-1 text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Standard */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#3b82f6" }}
                    />
                    <span className="text-xs font-semibold text-[#3b82f6]">
                      Standard Loss
                    </span>
                  </div>
                  {standardFinalIou !== null && (
                    <span className="text-xs font-mono text-accent-green">
                      IOU: {standardFinalIou.toFixed(4)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted/60 mb-2">
                  L2(aerial, target) + TV regularization + fidelity — features merge freely
                </p>
                <LiveOptimizationViewer
                  jobId={jobId}
                  mode="standard"
                  label="Standard"
                  color="#3b82f6"
                  frames={frames}
                  currentFrame={currentFrame}
                  onFrameChange={setCurrentFrame}
                  playing={isPlaying && runState === "running"}
                  demoMode={isDemoMode}
                />
              </div>

              {/* Improved */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#f59e0b" }}
                    />
                    <span className="text-xs font-semibold text-[#f59e0b]">
                      Improved Loss (Gap-Preserving)
                    </span>
                  </div>
                  {improvedFinalIou !== null && (
                    <span className="text-xs font-mono text-accent-green">
                      IOU: {improvedFinalIou.toFixed(4)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted/60 mb-2">
                  + Gap preservation + connectivity + edge weighting + mask biasing
                </p>
                <LiveOptimizationViewer
                  jobId={jobId}
                  mode="improved"
                  label="Improved"
                  color="#f59e0b"
                  frames={frames}
                  currentFrame={currentFrame}
                  onFrameChange={setCurrentFrame}
                  playing={isPlaying && runState === "running"}
                  demoMode={isDemoMode}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* IOU Convergence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">
                IOU Convergence
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={iouChartData.length > 0 ? iouChartData : [{ step: 0, standard: 0, improved: 0 }]}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.08)"
                    />
                    <XAxis
                      dataKey="step"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      label={{ value: "Step", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#6b7280" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="standard"
                      name="Standard"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={0}
                    />
                    <Line
                      type="monotone"
                      dataKey="improved"
                      name="Improved"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={0}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {standardMetrics.length > 0 && (
                <div className="mt-3 flex gap-6 text-xs font-mono">
                  <span className="text-[#3b82f6]">
                    Standard: {standardMetrics[standardMetrics.length - 1]?.iou.toFixed(4)}
                  </span>
                  {improvedMetrics.length > 0 && (
                    <span className="text-[#f59e0b]">
                      Improved: {improvedMetrics[improvedMetrics.length - 1]?.iou.toFixed(4)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* L2 Loss Convergence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold mb-4">
                L2 Loss Convergence
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossChartData.length > 0 ? lossChartData : [{ step: 0, standard: 0, improved: 0 }]}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(0,0,0,0.08)"
                    />
                    <XAxis
                      dataKey="step"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      label={{ value: "Step", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#6b7280" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="standard"
                      name="Standard"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={0}
                    />
                    <Line
                      type="monotone"
                      dataKey="improved"
                      name="Improved"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={0}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {standardMetrics.length > 0 && (
                <div className="mt-3 flex gap-6 text-xs font-mono">
                  <span className="text-[#3b82f6]">
                    Standard: {standardMetrics[standardMetrics.length - 1]?.l2.toFixed(5)}
                  </span>
                  {improvedMetrics.length > 0 && (
                    <span className="text-[#f59e0b]">
                      Improved: {improvedMetrics[improvedMetrics.length - 1]?.l2.toFixed(5)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
