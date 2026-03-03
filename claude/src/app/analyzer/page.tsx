"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Send, X, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { type Chunk, simulateChunks, retrieveChunks } from "@/lib/vector-store"

// ─── Citation inline renderer ────────────────────────────────────────────────

function CitationText({ content, citations }: { content: string; citations: Chunk[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const parts = content.split(/(\[\d+\])/)

  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (match) {
          const idx = parseInt(match[1]) - 1
          const chunk = citations[idx]
          if (!chunk) return <span key={i} className="text-zinc-600">{part}</span>

          return (
            <span key={i} className="relative inline">
              <button
                onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded text-[9px] font-bold bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white mx-0.5 align-middle transition-colors"
              >
                {idx + 1}
              </button>
              <AnimatePresence>
                {activeIdx === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-7 left-0 z-30 w-80 p-4 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-400">{chunk.id}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-500">page {chunk.page}</span>
                      </div>
                      <button
                        onClick={() => setActiveIdx(null)}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <p className="text-zinc-300 text-[13px] leading-relaxed">{chunk.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant"
  content: string
  citations: Chunk[]
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyzerPage() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [trace, setTrace] = useState<Chunk[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") return
    setFileName(file.name)
    setChunks(simulateChunks(file.name))
    setMessages([])
    setTrace([])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleSubmit = async () => {
    if (!input.trim() || loading || !chunks.length) return

    const query = input.trim()
    setInput("")
    setLoading(true)

    const retrieved = retrieveChunks(query, chunks, 3)
    setTrace(retrieved)
    setMessages((prev) => [...prev, { role: "user", content: query, citations: [] }])

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, chunks: retrieved }),
    })
    const { answer } = await res.json()

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: answer, citations: retrieved },
    ])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80)
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-8 py-4 border-b border-zinc-800/60 flex-shrink-0">
          <h1 className="text-base font-semibold tracking-tight">Research RAG Assistant</h1>
          {fileName && (
            <div className="flex items-center gap-2 mt-0.5">
              <FileText size={11} className="text-zinc-600" />
              <span className="text-xs text-zinc-500 font-mono truncate max-w-xs">{fileName}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                {chunks.length} chunks
              </Badge>
            </div>
          )}
        </div>

        {/* Upload zone */}
        {!fileName ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full max-w-sm h-52 rounded-2xl border-2 border-dashed cursor-pointer",
                "flex flex-col items-center justify-center gap-3 transition-all duration-200",
                isDragging
                  ? "border-zinc-500 bg-zinc-800/30"
                  : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
              )}
            >
              <Upload size={28} className="text-zinc-600" />
              <div className="text-center">
                <p className="text-zinc-400 text-sm font-medium">Drop PDF here</p>
                <p className="text-zinc-600 text-xs mt-0.5">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </div>
        ) : (
          /* Chat area */
          <>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-8 py-6 max-w-2xl space-y-5">
                {messages.length === 0 && (
                  <p className="text-zinc-600 text-sm">
                    Ask anything about the uploaded document…
                  </p>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-3", msg.role === "user" && "justify-end")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-zinc-400">AI</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-lg rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-zinc-800/80 text-zinc-200"
                          : "text-zinc-300"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <CitationText content={msg.content} citations={msg.citations} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-zinc-400">AI</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Loader2 size={13} className="animate-spin" />
                      Retrieving and reasoning…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input bar */}
            <div className="px-8 py-4 border-t border-zinc-800/60 flex-shrink-0">
              <div className="max-w-2xl flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                  placeholder="Ask about the document…"
                  className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="rounded-xl w-10 h-10 flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30"
                >
                  <Send size={13} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Separator orientation="vertical" className="bg-zinc-800/60 flex-shrink-0" />

      {/* ── Retrieval Trace sidebar ── */}
      <div className="w-68 flex flex-col flex-shrink-0" style={{ width: "17rem" }}>
        <div className="px-5 py-4 border-b border-zinc-800/60 flex-shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Retrieval Trace
          </h2>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            {trace.length === 0 ? (
              <p className="text-zinc-700 text-xs text-center mt-10 leading-relaxed">
                Retrieved chunks will appear here after your first query.
              </p>
            ) : (
              <div className="space-y-3">
                {trace.map((chunk, i) => (
                  <motion.div
                    key={`${chunk.id}-${i}`}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.2 }}
                    className="rounded-lg border border-zinc-800/80 p-3 bg-zinc-900/40"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <ChevronRight size={9} className="text-zinc-600" />
                        <span className="font-mono text-[11px] text-zinc-400">{chunk.id}</span>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-[11px] font-semibold tabular-nums",
                          (chunk.score ?? 0) > 0.65
                            ? "text-emerald-400"
                            : (chunk.score ?? 0) > 0.35
                            ? "text-yellow-400"
                            : "text-zinc-500"
                        )}
                      >
                        {((chunk.score ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-zinc-600 text-[11px] leading-relaxed line-clamp-3">
                      {chunk.text}
                    </p>
                    <span className="text-zinc-700 text-[10px] mt-1.5 block font-mono">
                      p.{chunk.page}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
