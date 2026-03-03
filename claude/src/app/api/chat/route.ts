import { NextRequest, NextResponse } from "next/server"

interface Chunk {
  id: string
  text: string
  page: number
  score?: number
}

// TODO: Replace with real Anthropic API call
// import Anthropic from "@anthropic-ai/sdk"
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function generateMockResponse(query: string, chunks: Chunk[]): string {
  if (!chunks.length) return "No relevant context found in the document."

  const [c1, c2, c3] = chunks
  const q = query.slice(0, 40)

  const templates = [
    `The document addresses "${q}..." by noting that ${c1.text.slice(0, 90).toLowerCase()} [1]${c2 ? ` This is reinforced by the observation that ${c2.text.slice(0, 75).toLowerCase()} [2]` : ""}${c3 ? ` Furthermore, ${c3.text.slice(0, 60).toLowerCase()} [3]` : ""}`,
    `Based on the retrieved context, ${c1.text.slice(0, 95).toLowerCase()} [1]${c2 ? ` Related work also shows that ${c2.text.slice(0, 70).toLowerCase()} [2]` : ""}${c3 ? ` The paper additionally highlights ${c3.text.slice(0, 60).toLowerCase()} [3]` : ""}`,
    `According to the document, ${c1.text.slice(0, 85).toLowerCase()} [1]${c2 ? ` Supporting evidence suggests ${c2.text.slice(0, 72).toLowerCase()} [2]` : ""}${c3 ? ` Finally, ${c3.text.slice(0, 58).toLowerCase()} [3]` : ""}`,
  ]

  return templates[query.length % templates.length]
}

export async function POST(req: NextRequest) {
  const { query, chunks } = (await req.json()) as { query: string; chunks: Chunk[] }

  // TODO: Anthropic API integration
  // const message = await anthropic.messages.create({
  //   model: "claude-opus-4-6",
  //   max_tokens: 1024,
  //   messages: [{
  //     role: "user",
  //     content: `Context:\n${chunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n")}\n\nQuestion: ${query}\n\nAnswer with inline citations like [1], [2].`,
  //   }],
  // })
  // const answer = message.content[0].type === "text" ? message.content[0].text : ""

  const answer = generateMockResponse(query, chunks)

  // Simulate network latency
  await new Promise((r) => setTimeout(r, 600))

  return NextResponse.json({ answer })
}
