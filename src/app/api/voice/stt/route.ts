// Marathi voice input via Groq's free hosted Whisper (large-v3).
// Runs on Vercel (serverless) — no Python server. The browser records a short
// audio clip, this route forwards it to Groq, and returns the transcript.
// If GROQ_API_KEY is missing or Groq errors, we return 503 and the client
// falls back to the browser's built-in recognition — so voice input never dies.

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
// large-v3 = best accuracy (incl. Marathi). Use whisper-large-v3-turbo for speed.
const GROQ_MODEL = process.env.GROQ_STT_MODEL || "whisper-large-v3";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return Response.json({ error: "STT not configured", fallback: "browser" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form-data." }, { status: 400 });
  }

  const audio = form.get("audio");
  const lang = (form.get("lang") as string) || "mr";
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Audio is required." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", audio, "speech.webm");
  upstream.append("model", GROQ_MODEL);
  if (lang && lang !== "auto") upstream.append("language", lang); // e.g. "mr"
  upstream.append("response_format", "json");
  upstream.append("temperature", "0");
  // Bias Whisper toward proper Marathi (not Hindi) + revenue-domain vocabulary
  // and natural phrasing, so words like केल्यानंतर / वेळात / सातबारावर are
  // transcribed correctly instead of garbled Hindi-ish forms. Whisper heeds the
  // last ~224 tokens of this prompt, so keep it dense and domain-specific.
  if (lang === "mr") {
    upstream.append(
      "prompt",
      [
        "महाराष्ट्र महसूल विभागातील तलाठी, मंडळ अधिकारी, नायब तहसीलदार व तहसीलदार यांच्यासाठी मराठी प्रश्नोत्तरे.",
        "शब्दसंग्रह: वारसदार, वारस नोंद, वारसाहक्क, फेरफार नोंद, सातबारा उतारा, गाव नमुना आठ-अ, पीक पाहणी, ई-पीक पाहणी, जमीन मोजणी, गट क्रमांक, सर्व्हे नंबर, हिस्सा, कब्जेदार, क्षेत्र, मृत्यू दाखला, वंशावळ, नोंदणी, अर्ज, प्रक्रिया, कागदपत्रे.",
        "उदाहरण प्रश्न: वारसदारांची नोंद केल्यानंतर किती वेळात सातबारावर येते? फेरफार नोंदणीची प्रक्रिया काय आहे? वारस नोंद कशी करावी? पीक पाहणी नोंद कधी करायची असते?",
      ].join(" ")
    );
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: upstream,
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      return Response.json(
        { error: "STT failed", detail: await res.text().catch(() => ""), fallback: "browser" },
        { status: 503 }
      );
    }
    const data = await res.json();
    return Response.json(
      { text: String(data?.text ?? "").trim() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "STT unavailable", fallback: "browser" }, { status: 503 });
  }
}
