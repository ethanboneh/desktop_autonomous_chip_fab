"use client";

import { motion } from "framer-motion";
import { ArrowRight, Cpu, Eye, Dna, Cog, Layers, Repeat } from "lucide-react";

const pipelineSteps = [
  {
    icon: Cpu,
    label: "Simulation",
    desc: "Differentiable lithography simulation (TorchResist) models the physics of light-resist interaction",
    color: "#3b82f6",
  },
  {
    icon: Layers,
    label: "Mask Optimization",
    desc: "SGD-based inverse design optimizes mask geometry to achieve target resist patterns",
    color: "#06b6d4",
  },
  {
    icon: Cog,
    label: "Physical Fabrication",
    desc: "Autonomous hardware executes optimized recipes: spin coat, expose, develop",
    color: "#8b5cf6",
  },
  {
    icon: Eye,
    label: "Vision Feedback",
    desc: "Computer vision captures and analyzes fabricated patterns for quality metrics",
    color: "#10b981",
  },
  {
    icon: Dna,
    label: "Evolutionary Update",
    desc: "OpenEvolve mutates parameters based on fitness scores, improving each generation",
    color: "#f59e0b",
  },
];

const concepts = [
  {
    title: "RL Environment",
    desc: "The fabrication process is modeled as a Gymnasium-compatible RL environment. States encode current process parameters and observation images; actions adjust spin speed, exposure, and mask geometry; rewards measure pattern fidelity via EPE and CD metrics.",
  },
  {
    title: "Evolutionary Hill Climbing",
    desc: "Built on OpenEvolve's MAP-Elites framework with island-based parallel evolution. The system maintains a diverse population grid and uses LLM-guided mutations alongside standard evolutionary operators for efficient parameter search.",
  },
  {
    title: "Modular Material System",
    desc: "The platform supports pluggable material profiles — from standard UV resins on glass substrates to PCB photoresists on silicon. Each material module encodes spin curves, exposure response, and development kinetics.",
  },
  {
    title: "Sim-to-Real Transfer",
    desc: "TorchResist's calibrated resist model bridges the simulation-reality gap. Calibration data from physical experiments continuously improves the simulator, creating a virtuous feedback loop between digital and physical optimization.",
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Repeat size={20} className="text-accent-cyan" />
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider">
              System Design
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Technical Architecture
          </h2>
          <p className="text-muted max-w-2xl mb-12 leading-relaxed">
            A closed-loop system unifying differentiable simulation, autonomous
            hardware, and evolutionary optimization.
          </p>
        </motion.div>

        {/* Pipeline diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="bg-surface rounded-xl border border-border p-8 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px]">
              {pipelineSteps.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: `${step.color}12`,
                        border: `1px solid ${step.color}30`,
                        boxShadow: `0 0 20px ${step.color}10`,
                      }}
                    >
                      <step.icon size={24} style={{ color: step.color }} />
                    </div>
                    <span
                      className="text-xs font-semibold mb-1"
                      style={{ color: step.color }}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-muted max-w-[120px] leading-tight">
                      {step.desc.split(" ").slice(0, 6).join(" ")}...
                    </span>
                  </motion.div>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight
                      size={18}
                      className="text-muted/30 mx-3 shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Loop arrow indication */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 text-xs font-mono text-muted/50">
                <Repeat size={12} />
                Closed-loop iteration until convergence
              </div>
            </div>
          </div>
        </motion.div>

        {/* Concept cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {concepts.map((concept, i) => (
            <motion.div
              key={concept.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-surface rounded-xl border border-border p-6 hover:border-border-bright transition-colors"
            >
              <h3 className="text-sm font-bold mb-2 text-accent-blue inline-block">
                {concept.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {concept.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
