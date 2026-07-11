# Mahasul Sanket (महसूल संकेत)
## AI Knowledge Assistant — Maharashtra Revenue Department

**Enterprise Knowledge Management Platform** — prototype on free tiers, architected for state-scale production.

---

## 1. Locked architectural decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Authentication** | Talathi registers with **mobile number + Government ID**. Account starts as *Pending* — the district **DCO verifies** the Government ID before the account is activated. Login = mobile + password (free tier; SMS OTP and Govt SSO are drop-in upgrades later). |
| 2 | **Languages** | **Marathi-first UI** with English toggle. AI answers in the language of the question. Hindi later. |
| 3 | **Data ownership** | **State-wide shared knowledge** (GRs, circulars — everyone can read). **District-scoped operations**: each district's DCO sees and controls only *their district's* tickets, users, and activity. |
| 4 | **AI provider** | **Gemini free API today** behind a swappable provider adapter (`src/lib/ai/provider.ts`). Own self-hosted LLM later by changing config only — no code rewrite. |
| 5 | **Escalation & learning** | 4 levels: **L1 Talathi → L2 Nayab Tahsildar → L3 DCO → L4 Admin**. Talathi can escalate an unsatisfying answer level by level. Any L2+ officer can set a **resolution time (in days)** on a ticket — the escalating party is notified of the promised timeline; if L4 sets it, *everyone in the escalation chain* is notified. Ticket answers are **private by default**; if generic, the DCO can *propose* it as knowledge, and it becomes AI knowledge **only after Admin approval**. |

## 2. Roles — power matrix

Design principle: **each level can only promise what it can deliver, and only see what it governs.** Every "✓" below is enforced in code/RLS, not just UI.

| Power | L1 Talathi | L2 Nayab Tahsildar | L3 DCO | L4 District Admin | L5 State Admin |
|---|---|---|---|---|---|
| Ask AI, raise & escalate own tickets | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reply to tickets / internal notes | own only | ✓ district | ✓ district | ✓ district | ✓ state |
| Set resolution time (SLA) | — | **1–14 days** | **1–30 days** | **1–90 days** (chain notified) | 1–90 days |
| Resolve / close tickets | reopen own | ✓ | ✓ | ✓ (final level) | ✓ |
| Verify new Talathi accounts | — | — | ✓ district | ✓ district | ✓ state |
| Propose ticket answer as knowledge | — | ✓ | ✓ | (approves instead) | (approves instead) |
| Approve knowledge / documents | — | — | docs only | ✓ | ✓ |
| Upload GR / circulars | — | — | ✓ | ✓ | ✓ |
| Change user roles | — | — | — | up to L2, own district | any |
| View analytics | own stats | own queue | district | district + audit | **state-wide + map** |
| AI settings, districts, system config | — | — | — | — | ✓ (super_admin) |

L1.5 Circle Officer = L1 powers + read-only view of circle activity. L6 Super Admin = L5 + system configuration.

## 3. System diagram

```
Browser / PWA (Next.js on Vercel — free)
 ├─ UI: Tailwind + shadcn-style components, Marathi-first, dark/light/high-contrast
 ├─ Voice: Web Speech API (STT + TTS, free, on-device)
 ├─ OCR: Tesseract.js (mar+eng, runs in browser — free)
 │
 ├── Next.js API routes (server) ──────────────┐
 │    ├─ /api/ai/*      → AI provider adapter → Gemini (today) / own LLM (later)
 │    ├─ /api/ingest/*  → chunk → embed → store vectors
 │    └─ rate limiting, input validation (Zod), audit logging
 │
 └── Supabase (free tier)
      ├─ Auth (JWT), Postgres + pgvector, Storage (documents), Realtime (notifications)
      └─ Row Level Security = the district/role security model lives IN the database
```

## 4. Folder structure (feature folders, clean architecture)

```
src/
  app/                  # Next.js routes (thin — no business logic)
    (auth)/             # login, register, pending-verification
    (dashboard)/        # all authenticated modules
    api/                # server endpoints (AI, ingestion)
  features/             # one folder per module: components + hooks + api + types
    auth/  chat/  voice/  knowledge/  tickets/  dco/  admin/
    users/  reports/  notifications/  settings/  audit/  profile/  feedback/
  components/ui/        # shared design-system components
  lib/
    ai/                 # provider adapter (Gemini / OpenRouter / own LLM)
    supabase/           # typed clients (browser / server / admin)
    i18n/               # Marathi + English dictionaries
    utils/
  types/                # shared TypeScript types (mirror of DB schema)
supabase/
  migrations/           # numbered SQL — the single source of truth for the DB
```

**Rule:** features never import from each other's internals — only via their public `index.ts`. This is what lets modules later become separate services without rewrites.

## 5. Security model (summary)

- **RBAC enforced in the database** via Postgres Row Level Security — even a bug in the app cannot leak another district's tickets.
- JWT (Supabase Auth) with role + district claims.
- Every privileged action → `audit_logs` (who, what, when, from where).
- File uploads: type + size validation server-side; stored in private buckets, served via signed URLs.
- Rate limiting on AI endpoints; Zod validation on every input; OWASP headers via Next.js middleware.

## 6. Free tier → enterprise upgrade map

| Concern | Prototype (free) | Enterprise later |
|---------|------------------|------------------|
| LLM | Gemini free API | Self-hosted Llama/Gemma on GPU (adapter swap) |
| Embeddings | Gemini text-embedding-004 | Own embedding model |
| STT/TTS | Browser Web Speech API | Google/Azure speech |
| OCR | Tesseract.js | Google Vision |
| SMS/Push | Browser notifications | FCM + SMS gateway |
| Auth | mobile+password, DCO verify | Govt SSO / Aadhaar-linked |
| Hosting | Vercel + Supabase free | NIC cloud / dedicated |

## 7. Phases

1. ✅ Architecture (this document)
2. Database schema + RLS
3. Authentication (register → DCO verify → login)
4. Dashboard shell
5. AI Chat (RAG with citations + confidence)
6. Voice
7. Knowledge Base + ingestion pipeline
8. Ticket system + 4-level escalation
9. Admin panels
10. Deployment (Vercel + Supabase)
