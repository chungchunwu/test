"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Activity, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Detection {
  label: string
  score: number
  box: { xmin: number; ymin: number; xmax: number; ymax: number }
}

interface DeviceInfo {
  webgpu: boolean
  gpuName: string | null
  threads: number
}

type ModelStatus = "idle" | "loading" | "ready" | "detecting"

// ─── Utils ───────────────────────────────────────────────────────────────────

const PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6",
]

function getLabelColor(label: string): string {
  let h = 0
  for (const c of label) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function drawDetections(
  canvas: HTMLCanvasElement,
  naturalW: number,
  naturalH: number,
  detections: Detection[],
  threshold: number
) {
  canvas.width = naturalW
  canvas.height = naturalH
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, naturalW, naturalH)

  const stroke = Math.max(2, naturalW / 300)
  const fontSize = Math.max(12, naturalW / 55)

  for (const det of detections) {
    if (det.score < threshold) continue

    const { xmin, ymin, xmax, ymax } = det.box
    const w = xmax - xmin
    const h = ymax - ymin
    const color = getLabelColor(det.label)
    const label = `${det.label} ${(det.score * 100).toFixed(0)}%`

    // Semi-transparent fill
    ctx.fillStyle = color + "22"
    ctx.fillRect(xmin, ymin, w, h)

    // Box stroke
    ctx.strokeStyle = color
    ctx.lineWidth = stroke
    ctx.strokeRect(xmin, ymin, w, h)

    // Label background + text
    ctx.font = `bold ${fontSize}px monospace`
    const tw = ctx.measureText(label).width + 10
    const th = fontSize + 8
    ctx.fillStyle = color
    ctx.fillRect(xmin, ymin - th, tw, th)
    ctx.fillStyle = "#fff"
    ctx.fillText(label, xmin + 5, ymin - 5)
  }
}

const SAMPLES = [
  {
    label: "Street",
    url: "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg",
  },
  {
    label: "Animals",
    url: "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/cats.jpg",
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle")
  const [loadProgress, setLoadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [confidence, setConfidence] = useState(0.5)
  const [inferenceMs, setInferenceMs] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    webgpu: false,
    gpuName: null,
    threads: 4,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const detectorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect device capabilities once on mount
  useEffect(() => {
    const threads = navigator.hardwareConcurrency ?? 4
    let webgpu = false
    let gpuName: string | null = null

    const detect = async () => {
      if ("gpu" in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter()
          webgpu = !!adapter
          gpuName =
            adapter?.info?.description ??
            adapter?.info?.vendor ??
            "Available"
        } catch {}
      }
      setDeviceInfo({ webgpu, gpuName, threads })
    }
    detect()
  }, [])

  // Redraw canvas whenever confidence or detections change
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current?.naturalWidth) return
    drawDetections(
      canvasRef.current,
      imgRef.current.naturalWidth,
      imgRef.current.naturalHeight,
      detections,
      confidence
    )
  }, [detections, confidence])

  const runDetection = useCallback(async (url: string) => {
    setImageUrl(url)
    setDetections([])
    setInferenceMs(null)

    const { pipeline, env } = await import("@xenova/transformers")
    env.allowLocalModels = false

    if (!detectorRef.current) {
      setModelStatus("loading")
      setLoadProgress(0)
      detectorRef.current = await pipeline(
        "object-detection",
        "Xenova/detr-resnet-50",
        {
          progress_callback: (p: any) => {
            if (p.status === "progress") setLoadProgress(Math.round(p.progress))
          },
        }
      )
    }

    setModelStatus("detecting")
    const t0 = performance.now()
    const results: Detection[] = await detectorRef.current(url, {
      threshold: 0.1,
    })
    const latency = Math.round(performance.now() - t0)

    setDetections(results)
    setInferenceMs(latency)
    setModelStatus("ready")
  }, [])

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return
      runDetection(URL.createObjectURL(file))
    },
    [runDetection]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  // After image loads, redraw (needed when switching images)
  const handleImageLoad = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return
    drawDetections(
      canvasRef.current,
      imgRef.current.naturalWidth,
      imgRef.current.naturalHeight,
      detections,
      confidence
    )
  }, [detections, confidence])

  const filtered = detections
    .filter((d) => d.score >= confidence)
    .sort((a, b) => b.score - a.score)

  const isProcessing = modelStatus === "loading" || modelStatus === "detecting"

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Main panel ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-8 py-4 border-b border-zinc-800/60 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Edge-CV Dashboard
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Object Detection · DETR-ResNet-50 · Browser-local inference
            </p>
          </div>
          <div className="flex items-center gap-2">
            {modelStatus === "ready" && (
              <Badge
                variant="outline"
                className="text-emerald-400 border-emerald-400/30 text-[10px]"
              >
                Model Ready
              </Badge>
            )}
            {modelStatus === "loading" && (
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-400/30 text-[10px]"
              >
                Downloading {loadProgress}%
              </Badge>
            )}
            {modelStatus === "detecting" && (
              <Badge
                variant="outline"
                className="text-blue-400 border-blue-400/30 text-[10px]"
              >
                Inferencing…
              </Badge>
            )}
          </div>
        </div>

        {/* Image / upload area */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6">
          {!imageUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full max-w-lg h-60 rounded-2xl border-2 border-dashed cursor-pointer",
                "flex flex-col items-center justify-center gap-3 transition-all duration-200",
                isDragging
                  ? "border-zinc-500 bg-zinc-800/30"
                  : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40"
              )}
            >
              <Upload size={28} className="text-zinc-600" />
              <div className="text-center">
                <p className="text-zinc-400 text-sm font-medium">
                  Drop image or click to upload
                </p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  or try a sample below
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
            </div>
          ) : (
            <div className="relative max-w-2xl w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Detection input"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                className="w-full rounded-xl block"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full rounded-xl"
                style={{ pointerEvents: "none" }}
              />

              {/* Processing overlays */}
              <AnimatePresence>
                {modelStatus === "detecting" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />
                      <span className="text-sm text-zinc-300">
                        Running inference…
                      </span>
                    </div>
                  </motion.div>
                )}
                {modelStatus === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center"
                  >
                    <div className="flex flex-col items-center gap-3 w-52">
                      <span className="text-sm text-zinc-300">
                        Downloading model…
                      </span>
                      <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-zinc-300 rounded-full"
                          animate={{ width: `${loadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="font-mono text-xs text-zinc-500">
                        {loadProgress}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Sample buttons */}
          <div className="flex items-center gap-2 mt-4">
            {imageUrl && !isProcessing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Upload new
              </button>
            )}
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => runDetection(s.url)}
                disabled={isProcessing}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Sample: {s.label}
              </button>
            ))}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="px-8 py-4 border-t border-zinc-800/60 flex-shrink-0">
          <div className="max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-medium">
                Confidence Threshold
              </span>
              <span className="font-mono text-xs text-zinc-300 tabular-nums">
                {confidence.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className={cn(
                "w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800",
                "[&::-webkit-slider-thumb]:appearance-none",
                "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
                "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-300",
                "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform",
                "[&::-webkit-slider-thumb]:hover:scale-125"
              )}
            />
            <div className="flex justify-between text-[10px] text-zinc-700 mt-1 font-mono">
              <span>0.00</span>
              <span>0.50</span>
              <span>1.00</span>
            </div>
          </div>
        </div>
      </div>

      <Separator orientation="vertical" className="bg-zinc-800/60 flex-shrink-0" />

      {/* ── Right sidebar ── */}
      <div className="w-60 flex flex-col flex-shrink-0">
        {/* Performance Monitor */}
        <div className="p-4 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={11} className="text-zinc-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Performance
            </span>
          </div>
          <div className="space-y-2">
            <Row
              label="Latency"
              value={
                inferenceMs !== null ? (
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      inferenceMs < 1000
                        ? "text-emerald-400"
                        : inferenceMs < 3000
                        ? "text-yellow-400"
                        : "text-red-400"
                    )}
                  >
                    {inferenceMs} ms
                  </span>
                ) : (
                  <span className="font-mono text-xs text-zinc-700">—</span>
                )
              }
            />
            <Row
              label="Backend"
              value={
                <span className="font-mono text-xs text-zinc-400">
                  {deviceInfo.webgpu ? "WebGPU" : "WASM"}
                </span>
              }
            />
            <Row
              label="Threads"
              value={
                <span className="font-mono text-xs text-zinc-400">
                  {deviceInfo.threads}
                </span>
              }
            />
            <Row
              label="GPU"
              value={
                <span className="font-mono text-xs text-zinc-400 truncate max-w-[90px]">
                  {deviceInfo.webgpu
                    ? (deviceInfo.gpuName ?? "Available")
                    : "N/A"}
                </span>
              }
            />
            <Row
              label="Model"
              value={
                <span className="font-mono text-[10px] text-zinc-600">
                  detr-resnet-50
                </span>
              }
            />
          </div>
        </div>

        {/* Detections list */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye size={11} className="text-zinc-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Detections
            </span>
          </div>
          {filtered.length > 0 && (
            <span className="font-mono text-[10px] text-zinc-600">
              {filtered.length}
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
          {filtered.length === 0 ? (
            <p className="text-zinc-700 text-xs text-center mt-8 leading-relaxed">
              {detections.length === 0
                ? "Run inference to see detections."
                : "No objects above threshold."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((det, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getLabelColor(det.label) }}
                    />
                    <span className="text-xs text-zinc-300 capitalize">
                      {det.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    {(det.score * 100).toFixed(0)}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-600">{label}</span>
      {value}
    </div>
  )
}
