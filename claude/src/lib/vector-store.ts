export interface Chunk {
  id: string
  text: string
  page: number
  score?: number
}

const MOCK_TEXTS = [
  "Transformer architectures have revolutionized natural language processing through self-attention mechanisms that capture long-range dependencies in sequential data.",
  "The retrieval-augmented generation (RAG) framework combines parametric knowledge from language models with non-parametric retrieval from external document stores.",
  "Vector embeddings represent semantic meaning in high-dimensional space, enabling efficient similarity search through approximate nearest neighbor algorithms.",
  "Fine-tuning large language models on domain-specific corpora significantly improves task performance while reducing hallucination rates in generated outputs.",
  "Chunking strategies for document processing include fixed-size windows, semantic segmentation, and recursive character splitting with configurable overlap.",
  "Cross-encoder reranking models improve retrieval precision by scoring query-document pairs jointly rather than using independent bi-encoder representations.",
  "Prompt engineering techniques such as chain-of-thought reasoning and few-shot exemplars enhance multi-step reasoning capabilities in language models.",
  "Evaluation metrics for RAG systems include faithfulness, answer relevancy, and context precision, often measured through automated LLM-based pipelines.",
  "Knowledge graph integration with vector retrieval enables structured reasoning over entities and relationships extracted from unstructured text corpora.",
  "Quantization and pruning techniques reduce model inference latency while maintaining acceptable benchmark performance on downstream evaluation tasks.",
]

export function simulateChunks(filename: string): Chunk[] {
  // In production: parse PDF with pdf.js or similar and chunk the real text
  void filename
  return MOCK_TEXTS.map((text, i) => ({
    id: `chunk_${String(i + 1).padStart(2, "0")}`,
    text,
    page: i + 1,
  }))
}

export function retrieveChunks(query: string, chunks: Chunk[], topK = 3): Chunk[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "in", "on", "at", "to", "for",
    "of", "and", "or", "with", "how", "what", "does", "are", "was",
  ])

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))

  const scored = chunks.map((chunk) => {
    const chunkWords = chunk.text.toLowerCase().split(/\s+/)
    const matches = queryWords.reduce((acc, qw) => {
      const hit = chunkWords.some(
        (cw) => cw.includes(qw) || qw.includes(cw.replace(/[.,]/g, ""))
      )
      return acc + (hit ? 1 : 0)
    }, 0)

    const baseScore = queryWords.length > 0 ? matches / queryWords.length : 0
    // Deterministic noise per chunk to make scores feel realistic
    const noise = (Math.sin(chunk.id.charCodeAt(6) * 7 + query.length) + 1) * 0.1
    return { ...chunk, score: Math.min(0.98, baseScore * 0.82 + noise) }
  })

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, topK)
}
