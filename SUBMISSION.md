# Huantuk — Hackathon Submission

> Built with Opus 4.7 — Cerebral Valley × Anthropic global Claude Code hackathon, April 2026.

---

**Huantuk — AI Diagnostic Finder and Cure Discovery for patients the medical system has failed.**

🔗 Live: [huantuk.vercel.app](https://huantuk.vercel.app)
🔗 Repo: [github.com/RC24bc/huantuk](https://github.com/RC24bc/huantuk)

## The problem

1 in 10 people suffer from autoimmune condition. It is rising 20% per year, lifelong, and largely uncurable. Patients spend an average of 4–5 years and see five specialists before a diagnosis. Each specialist works from a 30-minute consultation and only the reports from their own hospital. No human — including the patient — has time to read the whole file. When the published Clinical Practice Guideline (CPG) is exhausted, evidence-based medicine has nothing more to offer; the patient is told to live with it. Autoimmune people are undiagnosed, uncurable, and with lifelong suffering.

## What Huantuk does

Two uses, one continuous case file:

1. **Diagnostic Synthesizer.** Drop the folder — labs, imaging, clinic letters, clinical photos from any combination of hospitals — and Huantuk runs an extractor on each document, synthesizes a neutral-register clinical narrative, ranks the top 5 differentials with probability, **scores classification criteria against seven published sets** (Yamaguchi AOSD, 2017 EULAR/ACR IIM, 2019 ACR/EULAR SLE, 2010 ACR/EULAR RA, 2022 ACR/EULAR AAV, 2019 ACR/EULAR IgG4-RD, 2016 ACR/EULAR Sjögren's), runs an **explicit mimic-screen** for lymphoma / TB / DRESS / VEXAS / IgG4-RD masquerade, and ranks the next recommended tests with cost ranges and Malaysia/Singapore/international sendout availability. Final diagnosis and full workflow consulted with an accredited rheumatologist.

2. **Personalized Drug Discovery.** Triggered when current treatment has failed. Three PhD-grade Opus 4.7 agents reason in parallel over the leading differential: (a) **drug repurposing** — approved drugs whose mechanism plausibly addresses the condition; (b) **off-label discovery** — peer-reviewed evidence supporting off-label use, with the **regulatory pathway** spelled out (Malaysia DCA compassionate use, Singapore HSA Special Access, US Expanded Access, EU Compassionate Use, or simple physician off-label); (c) **trial matching** — currently enrolling trials in Asia, with inclusion/exclusion match reasoning the clinician can audit.

## How we used Claude (Opus 4.7)

Opus 4.7 is the entire reasoning engine. Seven typed agents, each with an auditable system-prompt file in `src/lib/agents/`, called from Next.js 16 API routes via the `@anthropic-ai/sdk`. Specifically:

- **Native PDF reading** — Claude's `document` content block ingests the patient's redacted PDFs directly. No OCR pipeline.
- **Multi-step long-context synthesis** — what 4.7 unlocked vs 4.6: a single `/api/synthesise` call holds the full case file and produces ranked DDx + criteria scoring + citations + reasoning, end-to-end, without losing the thread mid-output. We tried this on 4.6 in week one and the model lost coherence past three reports; on 4.7 it stays on the rails through eight.
- **Precision gain** — the 4.7 prompt rewrite was simpler than 4.6's: shorter system prompts, more explicit JSON schema, no chain-of-thought scaffolding. The model follows the schema.
- **Determinism by design** — every demo route has a typed mock fallback so a key outage / 401 / rate-limit never breaks the demo. The mock fixtures are clearly labelled.

Claude Managed Agents was evaluated and not used in v1 — the case-file workflow is interactive, not scheduled. We have a v2 idea (a watchdog routine that re-runs trial-matching weekly as new trials open at ClinicalTrials.gov) that maps cleanly onto Managed Agents.

## How creativity shaped the build

The name *huantuk* (撞鬼) is the Hokkien word for being possessed by a ghost — what traditional Chinese culture once called the unexplained illnesses that drove patients to exorcism. We reclaimed it as the framing: the patients medicine has failed. Huantuk is built around two clinical truths most doctors miss: (1) **autoimmune is among the most underdiagnosed and uncurable lifelong illnesses** — cancer dominates funding while autoimmune rises 20%/year; (2) **the value AI adds beyond evidence-based medicine is exactly drug discovery** — repurposed drugs, off-label evidence, and trial enrollment are categories most doctors cannot legally suggest in a 30-minute consult.

## How our thinking evolved

We started with "Patient Atlas" — a generic multi-record reader. Two iterations narrowed it. First, by interviewing EC's own uncle (a 62-year-old fruits wholesaler who had been bounced across three Malaysian hospitals for five months without a diagnosis — eventually anti-NXP2 / anti-HMGCR positive on Huantuk's recommended myositis panel), we realized the value was *between-hospital findings* — the patterns no single specialist could see. Second, we appended a Drug Discovery layer with regulatory pathway awareness. The demo includes a 3-phase real-case simulation built from EC's uncle's redacted records, published at [github.com/RC24bc/huantuk](https://github.com/RC24bc/huantuk).

## Built from what I know

Built from EC's lived experience: diagnosed with Henoch-Schönlein purpura at 35, a general practitioner watching his uncle bounce between hospitals while Huantuk found the answer in two passes.
