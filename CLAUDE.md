# Huantuk — Claude Code project instructions

> **READ FIRST:** [HUANTUK_BRIEF.md](./HUANTUK_BRIEF.md) is the canonical product spec. Every Huantuk task — feature build, bug fix, content, video — derives its scope and tone from this brief. If your reasoning conflicts with the brief, the brief wins.

## What this repo is

Huantuk is the **AI diagnostic and drug-discovery platform** built for the Cerebral Valley × Anthropic Opus 4.7 hackathon (deadline 2026-04-26 18:00 EST). See `HUANTUK_BRIEF.md` § 1 for the full definition; in one line:

> AI diagnostic synthesis and drug discovery for patients the medical system has lost.

Two workflows, both in production at `huantuk.vercel.app`:
1. **Diagnosis Synthesizer** — multi-PDF intake → criteria scoring → top differentials → "what's missing" test ranking
2. **Drug Discovery** — drug repurposing / off-label / clinical-trial matching (Opus 4.7 agents at `/api/repurpose`, `/api/off-label`, `/api/trial-match`)

## Stack

- Next.js 16 + TypeScript + Tailwind 4
- `@anthropic-ai/sdk` with Opus 4.7 (`claude-opus-4-7`)
- Deterministic fallbacks when `ANTHROPIC_API_KEY` is unset OR Opus call errors (401/network/rate-limit) — every demo case route survives a key outage.
- Deployed on Vercel · public repo `RC24bc/huantuk`
- Live demo URLs (no API key needed):
  - `?case=aosd` · `?case=lupus-refractory` · `?case=igg4rd` · `?case=undifferentiated-ctd` · `?case=iim-double-msa`
  - `?case=uncle-phased&phase=1` — 3-phase real-case upload simulation (admission → mid-workup → definitive). Each phase loads its own redacted PDFs from `public/demo-uncle-iim/phase{1,2,3}/`, presents 5 a/b/c/d clinical-history Qs, and routes to the matching phase fallback. URL `phase` param drives the active phase. PDFs are freshly typeset, name + IC blanked.

## Vercel deployment — environment + commands

- **`ANTHROPIC_API_KEY` is already configured in Vercel** for `Production`, `Preview`, `Development` (project `huantuk` under team `ecs-projects-e460d7b8`). Do NOT add it locally to `.env.local` and re-push as a workflow — Vercel already injects it at runtime. To verify: `cd ~/huantuk && npx vercel env ls`.
- Deploy production from local branch (no need to merge into main first): `cd ~/huantuk && npx vercel deploy --prod --yes`. Deploys whatever's on disk to `huantuk.vercel.app` regardless of git branch.
- If the live `/api/synthesise` returns Anthropic 401 ("invalid x-api-key"), the Vercel key has rotated/expired — surface to EC; do not silently overwrite the Vercel env without confirmation. Ask EC to run: `npx vercel env rm ANTHROPIC_API_KEY production && npx vercel env add ANTHROPIC_API_KEY production` then redeploy.

## Hackathon mode — what NOT to build

Per `HUANTUK_BRIEF.md` § 10:
- ❌ Auth / login
- ❌ HIPAA / compliance layers
- ❌ Doctor portal (cut for hackathon)
- ❌ Mobile app
- ❌ Payment
- ❌ Multi-tenant
- ❌ Genome/omics integration (future direction, not v1)

## Architecture map

Detailed architecture snapshot lives in the vault: `minda/knowledge/huantuk-app-architecture.md`. Module-by-module map of `src/app/api/*`, `src/lib/criteria/*`, `src/lib/diagnostics/*`, `src/components/*`. Update that file when you ship structural changes.

## Hackathon submission video

Reference scripts and assets live in the vault at `minda/projects/clinic/autoimmune/`:
- `HUANTUK_BRIEF.md` — canonical brief (mirror of this file)
- `hackathon-video-script-v2-EC-voice.md` — locked 7-beat script for the 3-min demo
- `outputs/2026-04-26-huantuk-hackathon-master-v3.mp4` — current master cut (silent + Lyria, awaiting EC VO)

## What to do when starting a Huantuk task

1. Open `HUANTUK_BRIEF.md` and read the relevant § (UI work → § 4 + § 5; AI work → § 6; demo → § 8).
2. If touching the criteria scoring engine, read `minda/knowledge/huantuk-app-architecture.md`.
3. Match scope to **demo-able**, not production.
4. PII guardrail: real patient files in `~/minda/projects/clinic/autoimmune/files/` are private. Never commit derivatives that contain PII to the public repo.
