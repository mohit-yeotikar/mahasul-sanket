# महसूल संकेत (Mahasul Sanket)

AI Knowledge Assistant for the Maharashtra Revenue Department — Talathi, Nayab Tahsildar, DCO, and District Administration.

**How it works:** a Talathi asks a question → the AI answers from uploaded GRs/circulars with citations and a confidence score → if confidence is low, one click creates a ticket that goes to the Nayab Tahsildar (L2), escalatable to DCO (L3) and District Admin (L4) → a generic answer can be proposed as knowledge and, after Admin approval, the AI learns it.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the full design and locked decisions.

---

## Deploy in ~30 minutes (all free)

### Step 1 — Supabase (database + login + files)
1. Go to **supabase.com** → New Project (free). Choose region **Mumbai (ap-south-1)**.
2. In the dashboard, open **SQL Editor** and run each file in `supabase/migrations/` **in order** (0001 → 0006). Copy-paste the contents and click Run.
3. Open **Storage** → New bucket → name it exactly `knowledge` → keep it **Private**.
4. Open **Project Settings → API** and copy three values: `Project URL`, `anon public` key, `service_role` key.

### Step 2 — Gemini (free AI)
1. Go to **aistudio.google.com** → Get API key (free).

### Step 3 — Run locally
1. Open `.env.local` and replace the placeholder values with your real Supabase and Gemini keys.
2. In this folder run: `npm install` then `npm run dev`
3. Open http://localhost:3000

### Step 4 — Create the first admin
1. Register on the site with your mobile number (you'll land on the "pending" page).
2. In Supabase → **Table Editor → profiles**: set your row's `role` to `super_admin` and `status` to `active`.
3. Log in — you now see the Admin and DCO panels. All future Talathi accounts are verified in-app by DCOs.

### Step 5 — Deploy to Vercel (free)
1. Push this folder to a GitHub repository.
2. On **vercel.com** → New Project → import the repo.
3. Add the same environment variables from `.env.local` in Vercel's settings.
4. Deploy. Done — installable as an app (PWA) on any phone.

---

## First knowledge upload
Admin panel → Upload: PDF GRs work directly; scanned images are read with built-in Marathi OCR. Every upload waits for approval before the AI can use it.

## Moving to your own LLM later
All AI calls go through `src/lib/ai/provider.ts`. Host any OpenAI-compatible model (vLLM/Ollama + Llama/Gemma) and set in the environment:
```
AI_PROVIDER=selfhosted
AI_BASE_URL=https://your-llm-server/v1
AI_CHAT_MODEL=your-model
AI_EMBEDDING_MODEL=your-embedding-model
```
No code changes needed. (Note: a different embedding model requires re-ingesting documents once.)

## Tech
Next.js 16 · TypeScript · Tailwind 4 · Supabase (Postgres + pgvector + Auth + Storage + Realtime) · Gemini free API (swappable) · Web Speech API (Marathi voice) · Tesseract.js OCR · Vercel
