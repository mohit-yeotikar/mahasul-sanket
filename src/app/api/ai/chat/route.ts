import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { answerQuestion } from "@/lib/ai/rag";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  question: z.string().min(2).max(4000),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`chat:${user.id}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { question } = parsed.data;
  let { conversationId } = parsed.data;

  // Tailor the AI's tone: citizens get plain-language answers, staff get
  // step-by-step procedural answers.
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const audience = prof?.role === "citizen" ? "citizen" : "officer";

  // Create conversation if new (RLS ensures ownership)
  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: question.slice(0, 80) })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "Could not start conversation" }, { status: 500 });
    conversationId = conv.id;
  }

  // Last few messages as context
  const { data: prior } = await supabase
    .from("messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(6);
  const history = (prior ?? []).reverse() as { role: "user" | "assistant"; content: string }[];

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: question,
  });

  try {
    const result = await answerQuestion(question, history, audience);

    const { data: saved } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: result.answer,
        confidence: result.confidence,
        citations: result.citations,
        related_questions: result.related_questions,
      })
      .select("id")
      .single();

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({ conversationId, messageId: saved?.id, ...result });
  } catch (e) {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "ai.chat_error",
      entity: "messages",
      detail: { message: e instanceof Error ? e.message : String(e) },
    });
    return NextResponse.json(
      {
        error:
          "AI सेवा सध्या व्यस्त आहे — कृपया काही क्षणांनी पुन्हा प्रयत्न करा. / The AI service is busy right now — please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
