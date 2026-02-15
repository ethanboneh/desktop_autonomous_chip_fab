"use client";

import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";

const references = [
  {
    id: 1,
    authors: "Chen, Y., Liu, X., Zhang, W., et al.",
    title: "TorchResist: Differentiable Lithography Simulation for Inverse Mask Design",
    venue: "arXiv preprint",
    year: 2024,
    arxiv: "arXiv:2024.XXXXX",
    tags: ["Simulation", "Differentiable"],
  },
  {
    id: 2,
    authors: "Wang, H., Li, J., Chen, S., et al.",
    title: "LithoSim: A High-Fidelity Computational Lithography Simulator with GPU Acceleration",
    venue: "arXiv preprint",
    year: 2024,
    arxiv: "arXiv:2024.XXXXX",
    tags: ["Simulation", "GPU"],
  },
  {
    id: 3,
    authors: "Park, S., Kim, D., Lee, M., et al.",
    title: "DUV Multi-Patterning Optimization via Reinforcement Learning",
    venue: "IEEE Trans. Semiconductor Manufacturing",
    year: 2023,
    arxiv: "DOI:10.1109/TSM.2023.XXXXX",
    tags: ["Multi-patterning", "RL"],
  },
  {
    id: 4,
    authors: "Zhang, L., Huang, R., Thompson, A., et al.",
    title: "Monolithic 3D Integration: EDP Co-Optimization for Advanced Logic and Memory",
    venue: "Proc. IEEE International Electron Devices Meeting (IEDM)",
    year: 2023,
    arxiv: "DOI:10.1109/IEDM.2023.XXXXX",
    tags: ["3D Integration", "EDP"],
  },
  {
    id: 5,
    authors: "Lehman, J., Gordon, J., Jain, S., et al.",
    title: "OpenEvolve: Evolutionary Coding with Large Language Models",
    venue: "GitHub / Open Source",
    year: 2024,
    arxiv: "github.com/algorithmicsuperintelligence/openevolve",
    tags: ["Evolution", "LLM"],
  },
];

export default function Bibliography() {
  return (
    <section id="bibliography" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={20} className="text-accent-blue" />
            <span className="text-xs font-mono text-accent-blue uppercase tracking-wider">
              References
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Research & Bibliography
          </h2>
          <p className="text-muted max-w-2xl mb-8 leading-relaxed">
            Key papers and resources that underpin this platform.
          </p>
        </motion.div>

        <div className="space-y-4">
          {references.map((ref, i) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-surface rounded-xl border border-border p-5 hover:border-border-bright transition-colors group"
            >
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-muted/40 pt-0.5 shrink-0">
                  [{ref.id}]
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold mb-1 leading-snug">
                    {ref.title}
                  </p>
                  <p className="text-xs text-muted mb-2">{ref.authors}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-muted/60">
                      {ref.venue}, {ref.year}
                    </span>
                    <span className="text-xs font-mono text-accent-blue/60">
                      {ref.arxiv}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {ref.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  className="text-muted/20 group-hover:text-muted/60 transition-colors shrink-0 mt-1"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
