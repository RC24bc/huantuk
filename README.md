# Huantuk · Patient Atlas

> *"Illnesses which in the past caused exorcism — or what traditional Chinese would say, huantuk (撞鬼) — that are difficult to diagnose but Claude can solve."*

**Huantuk** is a clinical decision-support tool for autoimmune cases that don't fit the textbook. Built on **Claude Opus 4.7** for the Cerebral Valley × Anthropic hackathon. Live at [huantuk.tech](https://huantuk.tech).

## Two functions, one workflow

### 1 · Diagnostic Synthesizer

For patients with months of specialist visits and stacks of reports, but **no diagnosis**. Feed the folder — lab panels, imaging reports, clinic letters, clinical photos — from any combination of hospitals and Huantuk:

1. **Extracts + redacts** PII from each document, returns a structured case object.
2. **Synthesises** a 3-sentence narrative summary in neutral clinical register.
3. **Ranks the top 5 differentials** with posterior probability, supporting + contradicting findings, and citations to the source paper for every claim.
4. **Scores classification criteria** met / unmet / unknown against seven published sets — Yamaguchi AOSD, 2017 EULAR/ACR IIM, 2019 ACR/EULAR SLE, 2010 ACR/EULAR RA, 2022 ACR/EULAR AAV, 2019 ACR/EULAR IgG4-RD, 2016 ACR/EULAR Sjögren's.
5. **Screens for autoimmune mimics** — lymphoma, chronic infection, drug reaction, VEXAS, IgG4-RD masquerade — that get missed when each specialist sees only their own slice.
6. **Ranks the next tests** by expected information gain over a 24-test catalog, with MYR cost ranges and Malaysian / Singapore / international sendout availability.

### 2 · Personalized Drug Discovery

When standard care has been exhausted, three clinical-research PhD agents reason over the patient's leading differential:

1. **Drug Repurposing** — existing approved drugs whose mechanism plausibly addresses this patient's specific phenotype, regardless of the drug's currently approved indication. Each candidate carries evidence level, MY/SG/intl availability, est monthly cost, safety flags, citations, and 3–5 numbered reasoning steps the clinician can audit.
2. **Off-Label Indication Discovery** — approved drugs whose published case-report / case-series evidence supports trying them for similar phenotypes. Each carries a regulatory pathway (Malaysia DCA compassionate use, Singapore HSA Special Access, US Expanded Access, EU Compassionate Use, or simple physician off-label prescription), est access wait time, est cost per course, and citations.
3. **Trial Matching** — currently enrolling clinical trials globally, with priority on Asia-accessible from KL. Each trial carries phase, sponsor, sites with flight-cost-from-KL, match confidence, inclusion-criteria match reasoning, and exclusion concerns flagged for clinician review. (Watchdog re-run cron deferred to v2.)

Without an `ANTHROPIC_API_KEY`, Drug Discovery returns **labelled mock-up results** specific to the leading differential — useful for demos.

## What Huantuk is not

- Not a diagnostic device. No regulatory claim.
- Not auto-prescribing. The treating doctor remains the prescriber.
- Not patient-facing in v1. Designed for clinician-in-the-loop.
- Not a general decision-support system. Two jobs (diagnose + discover therapy when CPG runs out), done deeply.

## Agent roster

Each agent is a typed function with a baked-in system prompt, callable independently:

**Diagnostic Synthesizer**
- `phenotype-extractor` — `/api/ingest` — Opus 4.7 — parses one document → structured findings + PII redaction
- `differential-generator + criteria-scorer + citation-specialist` — `/api/synthesise` — Opus 4.7 — ranked DDx + criteria scoring + cited references end-to-end
- `discriminating-test-recommender` — `/api/suggest-tests` — Opus 4.7 — ranks next tests over the 24-test catalog
- `mimic-detector` — `/api/mimic-check` — Opus 4.7 — explicit screen for lymphoma / TB / DRESS / VEXAS / IgG4-RD masquerade

**Personalized Drug Discovery**
- `drug-repurposing-phd` — `/api/repurpose` — Opus 4.7
- `off-label-discovery-phd` — `/api/off-label` — Opus 4.7
- `trial-matching-phd` — `/api/trial-match` — Opus 4.7

System prompts in `src/lib/agents/`. Each agent's prompt is a small, auditable file — no chains of thought hidden in code.

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind 4
- `@anthropic-ai/sdk` → `claude-opus-4-7`
- No DB. Case state is in-memory only — privacy by absence.
- Deploy: Vercel + custom domain `huantuk.tech`. See [`DEPLOY.md`](./DEPLOY.md).

## Dev

```bash
cp .env.example .env.local
# paste your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), drop a PDF or click **Load demo case** for the AOSD / IIM / VEXAS pattern. Without a key, the Diagnostic Synthesizer falls back to a deterministic demo and Drug Discovery returns mock-ups clearly labelled as demo data.

## PII policy

The validation corpus behind this project is a **real clinical case**. Only **de-identified** derivatives are ever committed to this public repo. Raw records stay off-repo (`.gitignore` blocks `files/` and `raw-files/`); dates are shifted; names, IC/MRN, DOB, addresses, and treating-clinician names are redacted before anything is stored here.

A pre-commit hook (`.githooks/pre-commit`) blocks commits that match identifier fingerprints. Enable once after cloning: `git config core.hooksPath .githooks`.

## Structure

```
src/
├── app/
│   ├── page.tsx                          ← landing + dropzone
│   └── api/
│       ├── ingest/route.ts               ← per-document extraction + PII redaction
│       ├── synthesise/route.ts           ← DDx + criteria + citations
│       ├── suggest-tests/route.ts        ← next-test recommender
│       ├── mimic-check/route.ts          ← autoimmune-mimic screen
│       ├── repurpose/route.ts            ← drug-repurposing PhD
│       ├── off-label/route.ts            ← off-label PhD
│       └── trial-match/route.ts          ← trial-matching PhD
├── components/
│   ├── DropZone.tsx
│   ├── PatientAtlasShell.tsx
│   ├── DifferentialReasoning.tsx
│   ├── CriteriaScoring.tsx
│   ├── SuggestedTests.tsx
│   ├── MimicCheckPanel.tsx
│   └── DrugDiscoveryPanel.tsx
└── lib/
    ├── agents/
    │   ├── anthropic.ts                  ← shared client + JSON helpers
    │   ├── mimic-detector.ts             ← prompt + deterministic mocks
    │   └── drug-discovery/
    │       ├── types.ts
    │       ├── prompts.ts                ← 3 PhD-agent system prompts
    │       └── mocks.ts                  ← per-differential mock fixtures
    ├── criteria/                         ← 7 classification-criteria sets
    └── diagnostics/                      ← test catalog + types + ranker
```

## Status

Cerebral Valley × Anthropic hackathon submission, April 2026. Diagnostic Synthesizer live end-to-end. Personalized Drug Discovery shipped with mock-up fallback when API key absent — production reasoning kicks in automatically once `ANTHROPIC_API_KEY` is set.

## Licence

MIT.
