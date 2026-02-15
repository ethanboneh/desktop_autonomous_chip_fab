"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Eye, ChevronRight, Sparkles, FlaskConical, Radio, Layers } from "lucide-react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Simulated LLM evaluation data                                     */
/* ------------------------------------------------------------------ */
const systemPrompt = `You are an expert fabrication quality evaluator. You will be shown a photo of a silicon wafer after spin coating with UV resin. Score the wafer on the following criteria (0.0–1.0):

- **uniformity**: How evenly is the resin distributed across the wafer surface?
- **coverage**: What fraction of the wafer has a thin, usable coating?
- **defects**: Inverse defect score (1.0 = no defects, 0.0 = severe defects)

Then compute an **overall_fitness** as a weighted average. Explain your reasoning step by step.`;

interface WaferEval {
  voltage: string;
  spinSpeed: string;
  image: string;
  reasoning: string[];
  scores: {
    uniformity: number;
    coverage: number;
    defects: number;
    overall_fitness: number;
  };
  verdict: string;
}

const evaluations: WaferEval[] = [
  {
    voltage: "6V",
    spinSpeed: "~1800 RPM",
    image: "/case-study/spin_6v.png",
    reasoning: [
      "Examining the wafer surface at 6V motor drive (~1800 RPM).",
      "The wafer appears very dark and opaque — indicating the UV resin layer is extremely thick.",
      "At this low spin speed, centrifugal force is insufficient to spread the resin outward from the center.",
      "I can see the mask pattern sitting on top, but the thick resin underneath will cause inconsistent UV exposure depth.",
      "Edge regions show slightly thinner coating due to gravity, creating a non-uniform thickness profile.",
      "Scoring: very poor uniformity due to thick, unevenly distributed resin. Coverage exists but is too thick to be functional.",
    ],
    scores: {
      uniformity: 0.15,
      coverage: 0.40,
      defects: 0.30,
      overall_fitness: 0.22,
    },
    verdict:
      "Spin speed far too low for UV resin. The high viscosity material pools instead of spreading. Recommend increasing to >3000 RPM.",
  },
  {
    voltage: "9V",
    spinSpeed: "~2700 RPM",
    image: "/case-study/spin_9v.png",
    reasoning: [
      "Examining the wafer surface at 9V motor drive (~2700 RPM).",
      "Markedly better than 6V. The thin-film iridescence (purple/blue gradient) is visible across most of the wafer surface.",
      "Central accumulation is minimal — only a small residual streak remains from the dispense point.",
      "The radial streak pattern is faint, suggesting centrifugal force successfully spread the resin into a relatively uniform thin film.",
      "Color uniformity across the surface indicates consistent film thickness — a good indicator for even UV exposure.",
      "Some minor streaking still visible near the center, but the overall coating quality is substantially improved over 6V.",
      "Scoring: good uniformity across most of the surface, high coverage, moderate defects from residual center streak.",
    ],
    scores: {
      uniformity: 0.68,
      coverage: 0.80,
      defects: 0.60,
      overall_fitness: 0.70,
    },
    verdict:
      "Best result in this series. This speed effectively overcomes UV resin viscosity for uniform thin-film formation. Recommend exploring the 9V–11V range to fine-tune.",
  },
  {
    voltage: "12V",
    spinSpeed: "~3600 RPM",
    image: "/case-study/spin_12v.png",
    reasoning: [
      "Examining the wafer surface at 12V motor drive (~3600 RPM).",
      "Significant improvement over 6V — iridescent color variations indicate a thin film, but uniformity has degraded compared to 9V.",
      "There is a large resin accumulation pattern in the center — a bright white/gray blob with radial streaks extending outward.",
      "At this speed, the resin is flung outward too aggressively, causing edge thinning and central pooling from rebound effects.",
      "The radial streak pattern suggests turbulent flow — the high RPM creates instability in the resin film before it cures.",
      "Peripheral regions are over-thinned while the center ~30% shows resin re-accumulation.",
      "Scoring: moderate uniformity degraded by center pooling and edge effects. Coverage is partial due to over-spinning.",
    ],
    scores: {
      uniformity: 0.35,
      coverage: 0.55,
      defects: 0.25,
      overall_fitness: 0.38,
    },
    verdict:
      "Speed is too high for this resin viscosity. Turbulent spreading causes non-uniform thickness. The 9V range is closer to optimal — back off RPM.",
  },
];

const modelInsight = {
  title: "Evolutionary Insight: Finding the Optimal Spin Window",
  text: `After evaluating three wafers across a range of spin speeds, the vision model reveals a non-monotonic relationship: too slow (6V) leaves thick, unusable resin, but too fast (12V) causes turbulent spreading and center re-accumulation.

The sweet spot sits around 9V (~2700 RPM), where centrifugal force is strong enough to overcome the resin's viscosity but not so aggressive that it creates flow instabilities. This is characteristic of UV resin — its higher viscosity compared to standard photoresist demands a narrower RPM window.

This fitness signal directly shapes the next generation of experiments: the evolutionary optimizer concentrates its search around the 9V–11V range, pruning both the low-speed and high-speed regions that produce defective coatings.`,
};

const futureWork = [
  {
    icon: "flask",
    title: "Multi-Step Recipes",
    text: "Extend the evolutionary search to optimize full fabrication recipes — multi-layer deposition, bake profiles, development times — not just single-parameter spin coating.",
  },
  {
    icon: "radio",
    title: "Advanced Sensors",
    text: "Integrate in-situ thickness sensors (ellipsometry, spectrometry) and real-time defect detection cameras for richer fitness signals beyond post-process imaging.",
  },
  {
    icon: "layers",
    title: "Multi-Objective Optimization",
    text: "Evolve across competing objectives simultaneously — throughput vs. uniformity vs. cost — using Pareto-front evolutionary strategies.",
  },
  {
    icon: "sparkles",
    title: "Foundation Model Scoring",
    text: "Replace prompt-engineered vision scoring with a fine-tuned multimodal model trained on thousands of labeled wafer images for more precise and consistent fitness evaluation.",
  },
];

/* ------------------------------------------------------------------ */
/*  Typing animation for reasoning steps                               */
/* ------------------------------------------------------------------ */
function ReasoningTrace({
  steps,
  scores,
  verdict,
  active,
}: {
  steps: string[];
  scores: WaferEval["scores"];
  verdict: string;
  active: boolean;
}) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisibleSteps(steps.length);
      setShowScores(true);
      return;
    }
    setVisibleSteps(0);
    setShowScores(false);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step > steps.length) {
        setShowScores(true);
        clearInterval(interval);
        return;
      }
      setVisibleSteps(step);
    }, 600);

    return () => clearInterval(interval);
  }, [active, steps.length]);

  return (
    <div className="font-mono text-xs space-y-2">
      {steps.slice(0, visibleSteps).map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-2"
        >
          <ChevronRight size={12} className="text-accent-cyan shrink-0 mt-0.5" />
          <span className="text-muted leading-relaxed">{s}</span>
        </motion.div>
      ))}

      {visibleSteps < steps.length && active && (
        <div className="flex gap-2 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-muted/40 italic">thinking...</span>
        </div>
      )}

      {showScores && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div className="h-px bg-border" />
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(scores).map(([key, val]) => (
              <div
                key={key}
                className={`flex justify-between p-2 rounded-md border ${
                  key === "overall_fitness"
                    ? "bg-accent-green/5 border-accent-green/20"
                    : "bg-surface-2 border-border"
                }`}
              >
                <span className="text-muted/60 text-[10px]">
                  {key === "overall_fitness" ? "overall" : key}
                </span>
                <span
                  className={`font-bold ${
                    key === "overall_fitness"
                      ? "text-accent-green"
                      : "text-foreground"
                  }`}
                >
                  {val.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-surface-2 rounded-lg border border-border">
            <span className="text-[10px] text-muted/60 uppercase tracking-wider">
              Verdict
            </span>
            <p className="text-xs text-foreground mt-1 leading-relaxed">
              {verdict}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CaseStudyPage() {
  const [activeEval, setActiveEval] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Eye size={20} className="text-accent-cyan" />
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider">
              Case Study — Vision Model Scoring
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Vision-Guided Evolution
          </h1>
          <p className="text-muted max-w-2xl text-lg leading-relaxed mb-4">
            A vision model scores each wafer on uniformity, coverage, and
            defects — producing the fitness signal that drives our evolutionary
            optimizer. Here we show how it evaluates spin-coated wafers and
            discovers the optimal spin speed window for UV resin.
          </p>
        </motion.div>

        {/* System prompt */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 mb-12"
        >
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} className="text-accent-cyan" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                System Prompt
              </span>
            </div>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {systemPrompt}
            </pre>
          </div>
        </motion.div>

        {/* Evaluations */}
        <div className="space-y-12">
          {evaluations.map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        ev.scores.overall_fitness > 0.5
                          ? "bg-accent-green"
                          : ev.scores.overall_fitness > 0.3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm font-semibold">
                      {ev.voltage} — {ev.spinSpeed}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-mono font-bold ${
                      ev.scores.overall_fitness > 0.5
                        ? "text-accent-green"
                        : ev.scores.overall_fitness > 0.3
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {ev.scores.overall_fitness.toFixed(2)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-0">
                  {/* Wafer image */}
                  <div className="aspect-square relative bg-gray-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.image}
                      alt={`Wafer at ${ev.voltage}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 bg-gray-900/70 backdrop-blur-sm px-3 py-1.5 rounded-md">
                      <span className="text-[10px] font-mono text-white/80">
                        Spin: {ev.voltage} ({ev.spinSpeed})
                      </span>
                    </div>
                  </div>

                  {/* Reasoning trace */}
                  <div className="p-5 border-t md:border-t-0 md:border-l border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Bot size={14} className="text-accent-cyan" />
                        <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                          Model Reasoning
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setActiveEval(activeEval === i ? null : i)
                        }
                        className="text-[10px] font-mono text-accent-blue hover:text-accent-cyan transition-colors"
                      >
                        {activeEval === i ? "skip" : "replay"}
                      </button>
                    </div>
                    <ReasoningTrace
                      steps={ev.reasoning}
                      scores={ev.scores}
                      verdict={ev.verdict}
                      active={activeEval === i}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Model insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <div className="h-px bg-border mb-8" />
          <div className="bg-surface rounded-xl border border-accent-green/20 p-8">
            <h2 className="text-xl font-bold mb-4 text-accent-green">
              {modelInsight.title}
            </h2>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {modelInsight.text}
            </p>
          </div>
        </motion.div>

        {/* Score progression */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8"
        >
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold mb-4">
              Fitness Progression by Spin Speed
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {evaluations.map((ev, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs font-mono text-muted mb-2">
                    {ev.voltage}
                  </div>
                  <div className="relative h-32 bg-surface-2 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{
                        height: `${ev.scores.overall_fitness * 100}%`,
                      }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.2 }}
                      className="absolute bottom-0 left-0 right-0 rounded-t-md"
                      style={{
                        backgroundColor:
                          ev.scores.overall_fitness > 0.5
                            ? "#059669"
                            : ev.scores.overall_fitness > 0.3
                            ? "#eab308"
                            : "#ef4444",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-mono font-bold text-white drop-shadow-md">
                        {ev.scores.overall_fitness.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted mt-2">
                    {ev.spinSpeed}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Future Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <div className="h-px bg-border mb-8" />
          <h2 className="text-2xl font-bold mb-2">Future Work</h2>
          <p className="text-muted text-sm mb-8 max-w-xl">
            Directions we&apos;re exploring to extend autonomous fabrication
            beyond single-parameter spin coating.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {futureWork.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-surface rounded-xl border border-border p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-surface-2 rounded-lg border border-border shrink-0 mt-0.5">
                    {item.icon === "flask" && (
                      <FlaskConical size={16} className="text-accent-cyan" />
                    )}
                    {item.icon === "radio" && (
                      <Radio size={16} className="text-accent-blue" />
                    )}
                    {item.icon === "layers" && (
                      <Layers size={16} className="text-accent-green" />
                    )}
                    {item.icon === "sparkles" && (
                      <Sparkles size={16} className="text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
