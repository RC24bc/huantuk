# HUANTUK — Claude Hackathon Brief

> **Context for Claude Code:** This is a hackathon project. Deadline is tomorrow. Optimize for working demo, not production. Skip auth flows, skip enterprise compliance, skip heavy infra. Build the two AI workflows clearly and make them demoable.

---

## 1. WHAT HUANTUK IS

Huantuk is an AI diagnostic and drug-discovery platform for patients with **undiagnosed or uncurable autoimmune-style conditions** — people who have been to multiple hospitals, have stacks of health reports, and still have no clear answer.

The product has **two core workflows**:

### Workflow 1 — Diagnosis Synthesizer

Patient comes in with fragmented care across multiple hospitals.

- **Input (initial):** Health reports (PDFs, scans, lab results) + clinical history (symptoms, timeline, family history, prior diagnoses)
- **AI step 1:** First-pass synthesis. Identify gaps, ambiguities, and what's missing.
- **AI step 2:** Ask the patient targeted follow-up clinical history questions based on the gaps. Recommend specific additional health reports if needed (e.g., "an ANA panel would help rule in/out lupus").
- **Input (round 2):** Patient uploads new reports + answers follow-ups.
- **Output:**
  - **Probable diagnosis** with confidence reasoning
  - **Current Clinical Practice Guideline (CPG) management** — what evidence-based medicine prescribes for this diagnosis today
  - Differential diagnoses considered and ruled out

### Workflow 2 — Drug Discovery (only triggered if CPG management fails)

Patient followed CPG management. Still uncurable. This is where Huantuk goes beyond what a regulated doctor can offer.

- **Input:** Everything from Workflow 1 + patient's response to CPG management (what was tried, what failed)
- **AI step:** Read across all personalized health data, search medical publications (PubMed), clinical trial registries (ClinicalTrials.gov), and recent evidence-based articles
- **Output:**
  - **Repurposed drugs** — drugs approved for other conditions that show signal for this patient's condition
  - **Off-label indicated medications** — already-approved drugs being used off-label with evidence
  - **Applicable clinical trials** — trials this patient could enroll in, ranked by relevance and geography

---

## 2. THE TWO USERS

| User | What they want |
|---|---|
| **Patient** (primary) | Upload reports, answer questions, get a diagnosis and a plan. If still stuck, get hope through drug discovery. |
| **Doctor** (secondary, future) | Use Huantuk in-consult to read across reports faster than a 30-minute appointment allows. |

For the hackathon, **build for the patient**. Doctor view can be cut.

---

## 3. THE PROBLEM IT SOLVES (1 paragraph)

Autoimmune conditions are underdiagnosed, uncurable, and lifelong — and rising 20% per year. Patients see five specialists before a diagnosis, each working from a 30-minute consultation and only the reports from their own hospital. No human has time to read the full file. When current Clinical Practice Guidelines fail the patient, evidence-based medicine has nothing more to offer them. Huantuk synthesizes what no single specialist can read, and when CPG management fails, it surfaces drug discovery options most doctors cannot legally suggest.

---

## 4. CORE TECHNICAL FLOW (build this)

```
PATIENT INPUT
    ↓
[Upload Reports + Clinical History Form]
    ↓
WORKFLOW 1 — DIAGNOSIS SYNTHESIZER
    ↓
[Claude reads reports + history → identifies gaps]
    ↓
[Generates targeted follow-up questions + report recommendations]
    ↓
PATIENT ROUND 2 INPUT
    ↓
[Claude synthesizes everything → outputs diagnosis + CPG]
    ↓
[Patient tries CPG management]
    ↓
DID IT WORK?
    ├─ YES → Done. Diagnosis + management.
    └─ NO  → WORKFLOW 2 — DRUG DISCOVERY
                 ↓
              [Claude searches PubMed + ClinicalTrials.gov + literature]
                 ↓
              [Outputs repurposed drugs + off-label meds + trials]
```

---

## 5. RECOMMENDED STACK FOR HACKATHON SPEED

Use what's fastest. Suggested:

- **Frontend:** Next.js or simple React + Tailwind (single-page app is fine)
- **Backend:** Next.js API routes or FastAPI
- **AI:** Claude API (`claude-opus-4-7` or `claude-sonnet-4-6` — Sonnet is faster and cheaper for the demo)
- **PDF/Report parsing:** Use Claude's native PDF input (`document` content block, base64-encoded) — do NOT build a separate OCR pipeline. Claude reads PDFs directly.
- **Storage:** In-memory or local SQLite. No need for cloud DB.
- **External data for Workflow 2:**
  - PubMed E-utilities API (free, no auth)
  - ClinicalTrials.gov API v2 (free, no auth)
  - Or — use Claude's web search tool if available in your API setup, and let it search PubMed/ClinicalTrials directly

---

## 6. PROMPTS TO USE

### Workflow 1 — System Prompt (Diagnosis Synthesizer)

```
You are a clinical diagnostic synthesis assistant for autoimmune and 
undiagnosed conditions. You read across multi-hospital health reports 
and clinical histories to identify what no single specialist had time 
to see in a 30-minute consultation.

Your output is structured in three parts:

1. SYNTHESIS — What the reports + history collectively suggest. Name 
   the patterns. Connect findings across reports.

2. GAPS — What is missing or ambiguous. Specific follow-up questions 
   for the patient. Specific additional reports that would meaningfully 
   narrow the differential.

3. PROBABLE DIAGNOSIS (only after round 2 input) — Most likely 
   diagnosis with reasoning. Differentials considered and why ruled out. 
   Current Clinical Practice Guideline (CPG) management for the 
   probable diagnosis.

Rules:
- Cite specific report findings by name.
- Use plain language. Patient is the reader.
- Never give treatment advice outside CPG.
- Flag any red-flag symptoms requiring urgent in-person care.
- If confidence is low, say so.
```

### Workflow 2 — System Prompt (Drug Discovery)

```
You are a drug-discovery research assistant for patients whose 
autoimmune or chronic conditions have failed standard Clinical 
Practice Guideline management.

Given a patient's full medical synthesis (from Workflow 1) and 
their CPG response, search and surface:

1. REPURPOSED DRUGS — Drugs approved for OTHER conditions that show 
   mechanistic or clinical evidence for this patient's condition. 
   Cite the publication.

2. OFF-LABEL INDICATIONS — Already-approved drugs being used off-label 
   for this condition with peer-reviewed evidence. Cite the publication.

3. APPLICABLE CLINICAL TRIALS — Active trials matching this patient's 
   condition. Include NCT ID, phase, location, and eligibility highlights.

Rules:
- Always cite primary sources (PubMed PMID, NCT ID, journal name).
- Rank by evidence strength and patient applicability.
- Flag mechanism of action in plain language.
- This is research output, not a prescription. State this clearly.
- If evidence is weak or anecdotal, say so explicitly.
```

---

## 7. MINIMUM DEMO-ABLE BUILD (priority order)

If time runs out, build in this order:

1. **Patient intake form** (clinical history + report upload) — basic UI
2. **Workflow 1 round 1** — Claude reads → returns synthesis + follow-up questions
3. **Workflow 1 round 2** — Claude returns diagnosis + CPG
4. **A "didn't work" button** that triggers Workflow 2
5. **Workflow 2** — Claude returns repurposed drugs + off-label + trials
6. **Polish:** Loading states, clear output formatting, one demo case study pre-loaded

**Cut if needed:** User accounts, persistent storage beyond the session, doctor view, multi-language.

---

## 8. DEMO SCRIPT (have this ready for judges)

Pre-load **one example patient case** so the demo doesn't depend on live typing:

> **Demo case:** 42-year-old female. 18 months of joint pain, low-grade fever, fatigue, recurrent rashes on lower legs. Seen at 3 hospitals. ANA borderline positive once, normal another. Negative anti-dsDNA. Mildly elevated CRP. Normal kidney function. Multiple specialists. No diagnosis. Currently on NSAIDs only.

This case is ambiguous enough to make Workflow 1's follow-up questions feel valuable, and the CPG path is clear enough that Workflow 2 can demonstrate drug discovery (e.g., hydroxychloroquine off-label, low-dose naltrexone literature, or a trial for seronegative autoimmune conditions).

---

## 9. WHAT TO SAY ABOUT THE PRODUCT IN 30 SECONDS

> "Autoimmune is underdiagnosed, uncurable, and lifelong. Patients see five specialists before getting a diagnosis. Huantuk reads across all their reports and history with Claude, finds what no single 30-minute consultation could, and outputs both a diagnosis and current treatment guidelines. When standard treatment fails, Huantuk goes one step further — it searches the literature for repurposed drugs, off-label medications, and clinical trials. Hope, when medicine has run out of answers."

---

## 10. WHAT NOT TO BUILD (for the hackathon)

- ❌ User authentication / login
- ❌ HIPAA / regulatory compliance layers
- ❌ Doctor portal
- ❌ Mobile app (web responsive is enough)
- ❌ Payment / subscription
- ❌ Multi-tenant architecture
- ❌ Genome/omics integration (this is a future direction, not v1)
- ❌ Local data storage / encryption (can demo on cloud)

---

## 11. JUDGING ANGLES TO EMPHASIZE

- **Real medical rigor** — Workflow 1 mirrors actual clinical reasoning (synthesize → identify gaps → ask targeted questions → diagnose).
- **Goes where doctors legally cannot** — Workflow 2's drug discovery is exactly the value AI adds beyond evidence-based medicine.
- **Underserved category** — Cancer dominates AI healthcare funding. Autoimmune is rising 20%/year and ignored.
- **Patient-owned synthesis** — One file. One picture. Across all hospitals.
- **Claude-native** — Uses Claude's PDF reading, long context, and reasoning as the core engine. Not a wrapper over a generic LLM.

---

## 12. ONE-LINER FOR README

> **Huantuk** — AI diagnostic synthesis and drug discovery for patients the medical system has lost.
