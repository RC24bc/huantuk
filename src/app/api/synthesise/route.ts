import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CRITERIA, findCriteria, topReferences, flatCriterionList } from "@/lib/criteria";
import { tryPresetFallback } from "@/lib/diagnostics/preset-fallbacks";
import { detectUnclePhase, unclePhaseFallback } from "@/lib/diagnostics/uncle-phased-fallback";
import type {
  SynthesiseRequest,
  SynthesiseResponse,
  DifferentialReasoning,
  CriteriaScore,
  CitedReference,
} from "@/lib/diagnostics/types";

export const runtime = "nodejs";
export const maxDuration = 90;

const MODEL = "claude-opus-4-7";

const BASE_SYSTEM = `You are a senior internist + rheumatologist serving as the case-synthesis reasoner for Huantuk (clinical decision support, NOT a diagnostic device).

You receive (a) extracted findings from a folder of medical documents and clinical photos for one patient, and (b) the catalogue of classification criteria sets the case may be evaluated against. Your job:

1. Write a 3-sentence "narrative_summary" of the case.
2. Produce the top 5 ranked differential diagnoses from the criteria_index. Each differential MUST include:
   - posterior_probability: a calibrated estimate in [0,1]; the top 5 should sum to roughly 0.8–1.0 across them.
   - key_evidence: ONE sentence (max 220 chars) naming the discriminating findings that pull the case toward this differential.
   - supporting_findings: array of short bullets (≤7 words each) — concrete findings already in the case that support this differential.
   - contradicting_findings: array of short bullets (≤7 words each) — case findings that argue against this differential.
   - citations: 1–3 references chosen from the differential's reference list provided in the criteria_index. Cite by exact title/authors/journal/year/pages/doi/pmid as supplied — do NOT invent or paraphrase. Prefer the classification-criteria paper plus one landmark review.
3. For each of the same top differentials, score the corresponding classification criteria set. Mark each criterion as "met", "unmet", or "unknown" (use "unknown" liberally when the case data is silent — do not guess). Provide a one-clause "evidence" string for "met" criteria. Then state classification_status: "meets" | "does_not_meet" | "borderline" | "insufficient_data".
4. Generate "clarifying_questions": 3–6 specific questions the patient/clinician should answer to meaningfully narrow the differential. Each must reference a real gap in the case data and target a high-information-gain answer. Plain language. No multi-part questions.
5. Generate "recommended_additional_reports": 2–5 specific tests or imaging studies that, if obtained, would most efficiently shrink the differential. Name the test (e.g. "ANA panel with anti-dsDNA, anti-Sm, anti-SSA/SSB, anti-RNP, anti-Scl-70, anti-Jo-1") and one short clause on why.

Strict rules:
- Output JSON only, no markdown fences, no prose outside JSON.
- Never invent citations. Use only the references supplied in the criteria_index.
- Never include patient identifiers — refer to "the patient" only.
- "unknown" > guessing for criteria you cannot verify from the case.

Output shape:
{
  "narrative_summary": "string, 3 sentences",
  "differentials": [
    {
      "differential_id": "string (must match criteria_index.id)",
      "differential_label": "string",
      "posterior_probability": 0.0,
      "key_evidence": "string",
      "supporting_findings": ["..."],
      "contradicting_findings": ["..."],
      "citations": [
        { "title": "...", "authors": "...", "journal": "...", "year": 0, "volume": "...", "issue": "...", "pages": "...", "doi": "...", "pmid": "...", "why_it_matters": "..." }
      ]
    }
  ],
  "criteria_scores": [
    {
      "criteria_id": "string (must match criteria_index.id)",
      "classification_status": "meets|does_not_meet|borderline|insufficient_data",
      "criteria": [
        { "criterion_id": "string", "status": "met|unmet|unknown", "evidence": "string|null" }
      ]
    }
  ],
  "clarifying_questions": ["..."],
  "recommended_additional_reports": ["..."]
}`;

const REGISTER_DOCTOR = `

REGISTER: Doctor-facing. Use precise clinical language (eponyms, mechanism terms, antibody names). Concise, neutral register suitable for a referring rheumatologist. The questions you generate may use medical terms (the user is a clinician).`;

const REGISTER_PATIENT = `

REGISTER: Patient-facing. The reader has no medical training and is roughly at a 14-year-old reading level. Translate every medical term: never write "polyarthritis" without "(many joints inflamed)"; never write "ANA" without "(a blood test that looks for self-attacking antibodies)". The narrative_summary should read like you are explaining the case back to the patient. Citations stay in clinical form (clinicians need them). The clarifying_questions MUST be in plain language a 14-year-old could answer (e.g. "Have you noticed your fingers turning white or blue when it's cold?" not "Do you have Raynaud's phenomenon?"). The recommended_additional_reports must name the test in plain words AND in brackets the proper name (e.g. "A blood test for self-attacking antibodies (ANA panel)").`;

function buildSystem(register: "doctor" | "patient"): string {
  return BASE_SYSTEM + (register === "patient" ? REGISTER_PATIENT : REGISTER_DOCTOR);
}

function buildCriteriaIndex() {
  return CRITERIA.map((c) => ({
    id: c.id,
    name: c.name,
    citation: c.citation,
    classification_rule: c.classification_rule ?? null,
    criteria_list: flatCriterionList(c).map((x) => ({ id: x.id, label: x.label })),
    references: topReferences(c, 3),
  }));
}

export async function POST(req: NextRequest) {
  let body: SynthesiseRequest;
  try {
    body = (await req.json()) as SynthesiseRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const docs = Array.isArray(body.extracted_docs) ? body.extracted_docs : [];
  if (docs.length === 0 && !body.free_text_summary) {
    return NextResponse.json({ error: "extracted_docs or free_text_summary required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(buildDeterministicFallback(body));
  }

  const criteriaIndex = buildCriteriaIndex();
  const userPayload = {
    free_text_summary: body.free_text_summary ?? null,
    extracted_docs: docs.map((d) => ({ filename: d.filename, extracted: d.extracted })),
    criteria_index: criteriaIndex,
  };

  const register = body.register === "patient" ? "patient" : "doctor";

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: buildSystem(register),
      messages: [
        {
          role: "user",
          content: `Synthesise the case below and return the JSON described in the system prompt.\n\n${JSON.stringify(userPayload, null, 2)}`,
        },
      ],
    });

    const textBlock = res.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const parsed = safeParse(raw);

    if (!parsed) {
      return NextResponse.json(
        {
          narrative_summary: "Opus response was unparseable.",
          differentials: [],
          criteria_scores: [],
          source: "opus-4.7" as const,
          warnings: [
            `Failed to parse Opus JSON output. stop_reason=${res.stop_reason ?? "unknown"} raw_len=${raw.length} preview=${raw.slice(0, 400)}`,
          ],
        } satisfies SynthesiseResponse,
      );
    }

    const differentials = normaliseDifferentials(parsed.differentials);
    const criteria_scores = normaliseCriteriaScores(parsed.criteria_scores, differentials);
    const clarifying_questions = asStringArray(parsed.clarifying_questions).slice(0, 6);
    const recommended_additional_reports = asStringArray(parsed.recommended_additional_reports).slice(0, 5);

    const resp: SynthesiseResponse = {
      narrative_summary:
        typeof parsed.narrative_summary === "string"
          ? parsed.narrative_summary
          : "(narrative summary missing from Opus output)",
      differentials,
      criteria_scores,
      clarifying_questions,
      recommended_additional_reports,
      source: "opus-4.7",
    };
    return NextResponse.json(resp);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Fall back to the deterministic preset (if the case text matches a known
    // demo preset) so the demo still works when the API key is invalid /
    // rate-limited / network-failing. Better than a 502 dead-end.
    const fb = buildDeterministicFallback(body);
    if (fb.differentials.length > 0) {
      return NextResponse.json({
        ...fb,
        warnings: [
          ...(fb.warnings ?? []),
          `Opus unavailable — using deterministic preset. (${msg})`,
        ],
      } satisfies SynthesiseResponse);
    }
    return NextResponse.json(
      {
        narrative_summary: `Opus call failed: ${msg}`,
        differentials: [],
        criteria_scores: [],
        source: "opus-4.7" as const,
        warnings: [msg],
      } satisfies SynthesiseResponse,
      { status: 502 },
    );
  }
}

function safeParse(s: string): {
  narrative_summary?: unknown;
  differentials?: unknown;
  criteria_scores?: unknown;
  clarifying_questions?: unknown;
  recommended_additional_reports?: unknown;
} | null {
  try {
    return JSON.parse(s);
  } catch {
    const match = s.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function normaliseDifferentials(v: unknown): DifferentialReasoning[] {
  if (!Array.isArray(v)) return [];
  const out: DifferentialReasoning[] = [];
  for (const d of v) {
    if (!d || typeof d !== "object") continue;
    const raw = d as Record<string, unknown>;
    const id = asString(raw.differential_id);
    if (!id) continue;
    const c = findCriteria(id);
    out.push({
      differential_id: id,
      differential_label: asString(raw.differential_label, c?.name ?? id),
      posterior_probability: clamp01(asNumber(raw.posterior_probability)),
      key_evidence: asString(raw.key_evidence),
      supporting_findings: asStringArray(raw.supporting_findings),
      contradicting_findings: asStringArray(raw.contradicting_findings),
      citations: normaliseCitations(raw.citations),
    });
  }
  return out
    .sort((a, b) => b.posterior_probability - a.posterior_probability)
    .slice(0, 5);
}

function normaliseCitations(v: unknown): CitedReference[] {
  if (!Array.isArray(v)) return [];
  const out: CitedReference[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object") continue;
    const raw = c as Record<string, unknown>;
    out.push({
      title: asString(raw.title) || undefined,
      authors: asString(raw.authors) || undefined,
      journal: asString(raw.journal) || undefined,
      year: typeof raw.year === "number" ? raw.year : undefined,
      volume: asString(raw.volume) || undefined,
      issue: asString(raw.issue) || undefined,
      pages: asString(raw.pages) || undefined,
      doi: asString(raw.doi) || undefined,
      pmid: asString(raw.pmid) || undefined,
      why_it_matters: asString(raw.why_it_matters) || undefined,
    });
  }
  return out.slice(0, 4);
}

function normaliseCriteriaScores(v: unknown, differentials: DifferentialReasoning[]): CriteriaScore[] {
  const wantIds = new Set(differentials.map((d) => d.differential_id));
  if (!Array.isArray(v)) return [];
  const out: CriteriaScore[] = [];
  for (const cs of v) {
    if (!cs || typeof cs !== "object") continue;
    const raw = cs as Record<string, unknown>;
    const id = asString(raw.criteria_id);
    if (!id || !wantIds.has(id)) continue;
    const c = findCriteria(id);
    if (!c) continue;
    const flatCriteria = flatCriterionList(c);
    const labelById = new Map(flatCriteria.map((x) => [x.id ?? "", x.label ?? ""]));
    const rawCriteria = Array.isArray(raw.criteria) ? raw.criteria : [];
    const criteria = rawCriteria
      .map((r) => {
        if (!r || typeof r !== "object") return null;
        const cr = r as Record<string, unknown>;
        const cid = asString(cr.criterion_id);
        const status = asString(cr.status);
        if (!cid || (status !== "met" && status !== "unmet" && status !== "unknown")) return null;
        return {
          criterion_id: cid,
          label: labelById.get(cid) ?? cid,
          status: status as "met" | "unmet" | "unknown",
          evidence: asString(cr.evidence) || undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const met_count = criteria.filter((x) => x.status === "met").length;
    const total_count = flatCriteria.length;
    const classification_status = ((): CriteriaScore["classification_status"] => {
      const s = asString(raw.classification_status);
      if (s === "meets" || s === "does_not_meet" || s === "borderline" || s === "insufficient_data") return s;
      return "insufficient_data";
    })();
    out.push({
      criteria_id: id,
      criteria_name: c.name,
      citation: c.citation ?? "",
      met_count,
      total_count,
      classification_rule: c.classification_rule ?? "",
      classification_status,
      criteria,
      references: topReferences(c, 4),
    });
  }
  return out;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function buildDeterministicFallback(body: SynthesiseRequest): SynthesiseResponse {
  const text = body.free_text_summary ?? "";
  // Phased uncle-IIM demo takes precedence — its case_text contains
  // explicit "Phase N" markers that the regular preset detector misses.
  const phase = detectUnclePhase(text);
  if (phase) return unclePhaseFallback(phase);
  const preset = tryPresetFallback(text);
  if (preset) return preset;

  return {
    narrative_summary:
      "ANTHROPIC_API_KEY not configured. Add your key to .env.local and restart for Opus 4.7 synthesis. Click any of the demo presets (Adult-Onset Still's, Refractory SLE, IgG4-RD, Undifferentiated CTD) to see the full citation UX with no API call.",
    differentials: [],
    criteria_scores: [],
    source: "deterministic-fallback",
    warnings: ["No API key — Opus synthesis disabled. Try a demo preset to see the workflow."],
  };
}

