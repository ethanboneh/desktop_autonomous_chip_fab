"use client";

import { motion } from "framer-motion";
import { Lightbulb, Cpu, Layers, RefreshCw } from "lucide-react";

const pillars = [
  {
    icon: Cpu,
    title: "AI Scaling Bottleneck",
    desc: "The semiconductor industry faces a fundamental challenge: the AI systems designing next-gen chips run on current-gen hardware. Breaking this circular dependency requires autonomous fabrication that can iterate faster than human-in-the-loop processes.",
    color: "#3b82f6",
  },
  {
    icon: Lightbulb,
    title: "Fabrication as Optimization",
    desc: "We reframe nanofabrication as a black-box optimization problem. Instead of manual recipe tuning, we let evolutionary algorithms and differentiable simulation jointly discover process parameters that maximize pattern fidelity.",
    color: "#06b6d4",
  },
  {
    icon: Layers,
    title: "Modular Materials",
    desc: "Our platform is material-agnostic. Swap substrate types, photoresists, and exposure sources through a pluggable material system. Each module encodes the physics of a specific material stack.",
    color: "#8b5cf6",
  },
  {
    icon: RefreshCw,
    title: "Virtuous Cycle",
    desc: "Better AI designs better chips. Better chips run better AI. Our platform accelerates this cycle by removing the human bottleneck in the fabrication-optimization loop, enabling rapid iteration from simulation to silicon.",
    color: "#10b981",
  },
];

export default function About() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Vision
          </h2>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed">
            Autonomous nanofabrication as infrastructure for the next generation
            of computing — where AI and hardware co-evolve.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-surface rounded-xl border border-border p-6 hover:border-border-bright transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${pillar.color}10`,
                  border: `1px solid ${pillar.color}25`,
                }}
              >
                <pillar.icon size={22} style={{ color: pillar.color }} />
              </div>
              <h3 className="text-sm font-bold mb-2">{pillar.title}</h3>
              <p className="text-xs text-muted leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24 pt-8 border-t border-border text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
            <span className="font-semibold">Autonomous Nanofabrication</span>
          </div>
          <p className="text-xs text-muted/50 font-mono">
            TreeHacks 2025 — Stanford University
          </p>
          <p className="text-xs text-muted/30 font-mono mt-1">
            AI-Driven Closed-Loop Fabrication and Process Discovery
          </p>
        </motion.div>
      </div>
    </section>
  );
}
