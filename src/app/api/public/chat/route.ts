// PUBLIC citizen chat — no login required. Powers the homepage chatbox so any
// citizen can ask a question. IP rate-limited; answers use the citizen-audience
// RAG (grounded in approved GRs, with a helpful general fallback). Nothing is
// persisted for anonymous users.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/lib/ai/rag";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({ question: z.string().min(2).max(2000) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!rateLimit(`public-chat:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "बरेच प्रश्न विचारले — कृपया एक मिनिट थांबा. / Too many questions — please wait a minute." },
      { status: 429 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const result = await answerQuestion(parsed.data.question, [], "citizen");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "AI सेवा सध्या व्यस्त आहे — कृपया पुन्हा प्रयत्न करा. / The AI service is busy — please try again." },
      { status: 502 }
    );
  }
}
