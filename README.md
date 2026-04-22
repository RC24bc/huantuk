# Patient Atlas — Huantuk

> *"Illnesses which in the past caused exorcism — or what traditional Chinese would say, huantuk (撞鬼) — that are difficult to diagnose but Claude can solve."*

**Patient Atlas** is a longitudinal diagnostic synthesiser for **doctors treating patients whose symptoms remain unexplained after standard investigations**. Built on Claude Opus 4.7 for the Cerebral Valley × Anthropic hackathon.

## What it does

Feed it the manila folder — lab panels, imaging reports, clinic letters, clinical photos — from any combination of hospitals and it will:

1. **Unify** the documents into one longitudinal timeline keyed by visit date and grouped by organ system.
2. **Score** the case against published classification criteria (Yamaguchi AOSD, 2017 EULAR/ACR IIM, 2019 ACR/EULAR SLE, 2010 ACR/EULAR RA, 2022 ACR/EULAR AAV, 2019 ACR/EULAR IgG4-RD, 2016 ACR/EULAR Sjögren's) — met / unmet / unknown per sub-criterion.
3. **Flag what's missing** — ranks the next tests/questions by expected information gain toward discriminating the top differentials.
4. **Show the differential re-weighting** as new information arrives — holding multiple hypotheses live, not committing early.
5. **Generate a handoff letter** in the receiving specialist's register.

## What it is not

- Not a diagnostic device. No regulatory claim.
- Not patient-facing. No "what should I do" output.
- Not a triage tool. Input is **post-workup** — results in hand, diagnosis still open.
- Not a general clinical-decision-support system. One job, done well.

## Stack

- Next.js 14 · TypeScript · Tailwind CSS
- `@anthropic-ai/sdk` → `claude-opus-4-7` (document + vision content blocks)
- Deploys on Vercel

## Dev

```bash
cp env.example .env.local
# paste your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), drop in a PDF or clinical photo, see the structured extraction.

## PII policy

The validation corpus behind this project is a **real clinical case**. Only **de-identified** derivatives are ever committed to this public repo. Raw records stay off-repo; dates are shifted; names, IC/MRN, DOB, addresses, and treating-clinician names are redacted before anything is stored here.

A pre-commit hook (`.githooks/pre-commit`) blocks commits that match identifier fingerprints. It is enabled automatically by `git config core.hooksPath .githooks` (run once after cloning).

See [memory policy](https://github.com/RC24bc/huantuk#pii-policy) above for the full set of rules.

## Structure

```
src/
├── app/
│   ├── page.tsx                 ← landing + drop zone
│   └── api/
│       └── ingest/route.ts      ← POST file → Claude extraction → JSON
├── components/
│   └── DropZone.tsx             ← multi-file drag+drop UI
└── lib/
    └── criteria/                ← classification criteria as JSON
        ├── yamaguchi-aosd.json
        └── eular-acr-iim-2017.json
scripts/
└── deidentify.mjs               ← runs against local vault, outputs to gitignored demo-data-staging/
```

## Status

Day 1 of a four-day hackathon sprint (22 → 26 Apr 2026). Scaffold + ingest pipeline + first two criteria sets live. Timeline builder, criteria scorer, re-weighting UI, and handoff letter generator land on days 2–3. Vercel deploy on day 3. Submission Saturday 18:00 EST.

## Licence

MIT.
