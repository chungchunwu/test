"use client"

import { motion } from "framer-motion"
import { Github, Mail, ExternalLink, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

// ─── Animation variant ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    name: "Research RAG Assistant",
    desc: "為了解決大模型幻覺問題，實作具備引用來源檢索 (Citation) 的長文本分析工具。",
    tags: ["Next.js", "Anthropic API", "Vector Embeddings"],
    demo: "/analyzer",
    github: "https://github.com/chungchunwu",
  },
  {
    name: "Edge-CV Dashboard",
    desc: "利用 Transformers.js 在瀏覽器端實作即時物體偵測，不需後端 GPU 即可運行。",
    tags: ["WebAssembly", "YOLO", "ONNX Runtime"],
    demo: "/vision",
    github: "https://github.com/chungchunwu",
  },
]

const SKILLS = [
  {
    category: "Large Language Models",
    items: ["RAG Pipeline", "Prompt Optimization", "LangChain"],
  },
  {
    category: "Computer Vision",
    items: ["PyTorch", "Object Detection", "Image Segmentation"],
  },
  {
    category: "Software Engineering",
    items: ["Next.js", "TypeScript", "Docker", "Git"],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-white/10 bg-[#030303]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <span className="font-mono text-sm text-zinc-500 tracking-wider">
            CHUNG CHUN WU
          </span>
          <div className="flex items-center gap-7">
            <a
              href="#projects"
              className="text-xs text-zinc-600 hover:text-white transition-colors"
            >
              Projects
            </a>
            <a
              href="#skills"
              className="text-xs text-zinc-600 hover:text-white transition-colors"
            >
              Skills
            </a>
            <a
              href="https://github.com/chungchunwu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-36 pb-28">
        {/* ── Hero ── */}
        <section className="mb-32">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="font-mono text-xs uppercase tracking-widest text-zinc-600 mb-4"
          >
            AI Engineer &amp; Researcher
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-6xl font-semibold tracking-tight leading-none mb-2"
          >
            CHUNG CHUN WU
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-4xl font-semibold tracking-tight text-zinc-600 mb-8"
          >
            吳中群
          </motion.p>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="text-zinc-400 text-lg max-w-xl leading-relaxed mb-10"
          >
            專注於實作高效能的 AI 系統。我的研究興趣包含 LLM 的長文本處理 (RAG)
            與電腦視覺 (CV) 的邊緣運算優化。
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="flex items-center gap-5"
          >
            <a
              href="https://github.com/chungchunwu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <Github size={15} />
              GitHub
            </a>
            <a
              href="mailto:chungchun0903@gmail.com"
              className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <Mail size={15} />
              Email
            </a>
          </motion.div>
        </section>

        <Separator className="bg-white/5 mb-28" />

        {/* ── Projects ── */}
        <section id="projects" className="mb-28">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-mono text-xs uppercase tracking-widest text-zinc-600 mb-10"
          >
            Selected Projects
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTS.map((project, i) => (
              <motion.div
                key={project.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-white text-base">
                    {project.name}
                  </h3>
                  <ArrowUpRight
                    size={14}
                    className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5"
                  />
                </div>

                <p className="text-zinc-500 text-sm leading-relaxed mb-5">
                  {project.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={project.demo}
                    className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <ExternalLink size={10} />
                    Live Demo
                  </Link>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <Github size={11} />
                    GitHub
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <Separator className="bg-white/5 mb-28" />

        {/* ── Skills ── */}
        <section id="skills">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-mono text-xs uppercase tracking-widest text-zinc-600 mb-10"
          >
            Technical Skills
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {SKILLS.map((group, i) => (
              <motion.div
                key={group.category}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
              >
                <h3 className="text-sm font-medium text-white mb-4">
                  {group.category}
                </h3>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-sm text-zinc-500"
                    >
                      <span className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-700">
            © 2025 CHUNG CHUN WU
          </span>
          <span className="font-mono text-xs text-zinc-700">
            AI Engineer &amp; Researcher
          </span>
        </div>
      </footer>
    </div>
  )
}
