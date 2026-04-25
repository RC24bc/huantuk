import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CRITERIA, findCriteria, topReferences, flatCriterionList } from "@/lib/criteria";
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

const SYSTEM = `You are a senior internist + rheumatologist serving as the case-synthesis reasoner for Patient Atlas (clinical decision support, NOT a diagnostic device).

You receive (a) extracted findings from a folder of medical documents and clinical photos for one patient, and (b) the catalogue of classification criteria sets the case may be evaluated against. Your job:

1. Write a 3-sentence "narrative_summary" of the case in neutral clinical register.
2. Produce the top 5 ranked differential diagnoses from the criteria_index. Each differential MUST include:
   - posterior_probability: a calibrated estimate in [0,1]; the top 5 should sum to roughly 0.8–1.0 across them.
   - key_evidence: ONE sentence (max 220 chars) naming the discriminating findings that pull the case toward this differential.
   - supporting_findings: array of short bullets (≤7 words each) — concrete findings already in the case that support this differential.
   - contradicting_findings: array of short bullets (≤7 words each) — case findings that argue against this differential.
   - citations: 1–3 references chosen from the differential's reference list provided in the criteria_index. Cite by exact title/authors/journal/year/pages/doi/pmid as supplied — do NOT invent or paraphrase. Prefer the classification-criteria paper plus one landmark review.
3. For each of the same top differentials, score the corresponding classification criteria set. Mark each criterion as "met", "unmet", or "unknown" (use "unknown" liberally when the case data is silent — do not guess). Provide a one-clause "evidence" string for "met" criteria. Then state classification_status: "meets" | "does_not_meet" | "borderline" | "insufficient_data".

Strict rules:
- Output JSON only, no markdown fences, no prose outside JSON.
- Never invent citations. Use only the references supplied in the criteria_index.
- Never include patient identifiers — refer to "the patient" only.
- Use plain neutral register suitable for a referring rheumatologist.
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
  ]
}`;

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

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
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
          warnings: ["Failed to parse Opus JSON output."],
        } satisfies SynthesiseResponse,
      );
    }

    const differentials = normaliseDifferentials(parsed.differentials);
    const criteria_scores = normaliseCriteriaScores(parsed.criteria_scores, differentials);

    const resp: SynthesiseResponse = {
      narrative_summary:
        typeof parsed.narrative_summary === "string"
          ? parsed.narrative_summary
          : "(narrative summary missing from Opus output)",
      differentials,
      criteria_scores,
      source: "opus-4.7",
    };
    return NextResponse.json(resp);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
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
  const text = (body.free_text_summary ?? "").toLowerCase();
  const isDemo =
    text.includes("ferritin") &&
    (text.includes("evanescent") || text.includes("salmon")) &&
    text.includes("rash");

  if (!isDemo) {
    return {
      narrative_summary:
        "ANTHROPIC_API_KEY not configured. Add your key to .env.local and restart for Opus 4.7 synthesis. The deterministic demo case (Adult-Onset Still's-pattern presentation) will still show the full citation UX.",
      differentials: [],
      criteria_scores: [],
      source: "deterministic-fallback",
      warnings: ["No API key — Opus synthesis disabled. Click 'Load demo case' to see the citation UX."],
    };
  }

  const yam = findCriteria("yamaguchi-1992")!;
  const sle = findCriteria("acr-eular-sle-2019")!;
  const aav = findCriteria("acr-eular-aav-2022")!;
  const igg4 = findCriteria("acr-eular-igg4rd-2019")!;
  const iim = findCriteria("eular-acr-iim-2017")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "yamaguchi-1992",
      differential_label: yam.name,
      posterior_probability: 0.62,
      key_evidence:
        "Quotidian fevers ≥39°C >2 months, evanescent salmon rash during spikes, neutrophilic leukocytosis, ferritin 8,420 with low glycosylated fraction, RF/ANA negative, malignancy and infection excluded — fits Yamaguchi.",
      supporting_findings: [
        "Fever ≥39°C >1 week",
        "Evanescent salmon trunk rash",
        "WBC 14.2k, 86% neutrophils",
        "Ferritin 8,420 (glycosylated <20%)",
        "RF and ANA negative",
        "Lymphadenopathy, sore throat",
        "Infection / malignancy excluded",
      ],
      contradicting_findings: ["No erosive arthritis on imaging (does not exclude AOSD)"],
      citations: topReferences(yam, 3),
    },
    {
      differential_id: "eular-acr-iim-2017",
      differential_label: iim.name,
      posterior_probability: 0.12,
      key_evidence:
        "Inflammatory pattern present but no proximal weakness, no CK elevation reported, and no characteristic skin findings — IIM less likely without further muscle data.",
      supporting_findings: ["Systemic inflammation", "Liver enzyme elevation"],
      contradicting_findings: [
        "No proximal muscle weakness",
        "No CK reported elevated",
        "No Gottron / heliotrope rash",
      ],
      citations: topReferences(iim, 2),
    },
    {
      differential_id: "acr-eular-aav-2022",
      differential_label: aav.name,
      posterior_probability: 0.08,
      key_evidence:
        "ANCA (PR3/MPO) negative on a quality assay and no organ-specific vasculitic features (no glomerulonephritis, no upper-airway destruction, no mononeuritis) — AAV unlikely.",
      supporting_findings: ["Systemic inflammation"],
      contradicting_findings: [
        "ANCA PR3 / MPO negative",
        "No renal involvement",
        "No ENT / pulmonary haemorrhage",
      ],
      citations: topReferences(aav, 2),
    },
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.06,
      key_evidence:
        "EULAR/ACR 2019 SLE classification requires ANA ≥1:80 as the entry criterion — patient is ANA-negative on validated immunofluorescence, which excludes formal classification despite multi-system features.",
      supporting_findings: ["Multi-system inflammation"],
      contradicting_findings: [
        "ANA negative — entry criterion fails",
        "Anti-dsDNA / anti-Sm negative",
        "Complement normal",
      ],
      citations: topReferences(sle, 2),
    },
    {
      differential_id: "acr-eular-igg4rd-2019",
      differential_label: igg4.name,
      posterior_probability: 0.05,
      key_evidence:
        "No characteristic IgG4-RD organ involvement (no salivary/lacrimal swelling, no autoimmune pancreatitis, no retroperitoneal fibrosis) and no tissue IgG4+ plasma-cell infiltrate documented.",
      supporting_findings: ["Lymphadenopathy"],
      contradicting_findings: [
        "No salivary/lacrimal involvement",
        "No autoimmune pancreatitis",
        "No fibrosing organ disease",
      ],
      citations: topReferences(igg4, 2),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: yam.id,
      criteria_name: yam.name,
      citation: yam.citation ?? "",
      classification_rule: yam.classification_rule ?? "",
      classification_status: "meets",
      met_count: 6,
      total_count: 11,
      criteria: [
        { criterion_id: "y_fever", label: "Fever ≥39°C lasting ≥1 week", status: "met", evidence: "Documented fevers ≥39.4°C for >2 months" },
        { criterion_id: "y_arthralgia", label: "Arthralgia / arthritis ≥2 weeks", status: "met", evidence: "Polyarthralgia involving wrists, knees, MCPs" },
        { criterion_id: "y_rash", label: "Typical evanescent salmon rash with fever", status: "met", evidence: "Truncal salmon rash appearing during fever spikes, clearing within hours" },
        { criterion_id: "y_leukocytosis", label: "WBC ≥10,000 with ≥80% neutrophils", status: "met", evidence: "WBC 14.2×10⁹/L, 86% neutrophils" },
        { criterion_id: "y_sore_throat", label: "Sore throat", status: "met", evidence: "Reported on history" },
        { criterion_id: "y_lymphadenopathy", label: "Lymphadenopathy / splenomegaly", status: "met", evidence: "Cervical and inguinal lymphadenopathy; mild hepatomegaly" },
        { criterion_id: "y_lft_abnormal", label: "Abnormal LFTs", status: "met", evidence: "AST 78, ALT 64, LDH 412 (>1× ULN)" },
        { criterion_id: "y_negative_serology", label: "Negative RF and ANA", status: "met", evidence: "Both negative on confirmatory testing" },
        { criterion_id: "y_excl_infection", label: "Infection excluded", status: "met", evidence: "Cultures, EBV/CMV/parvo, HIV, TB negative" },
        { criterion_id: "y_excl_malignancy", label: "Malignancy excluded", status: "met", evidence: "Bone marrow reactive; PET diffuse, no mass" },
        { criterion_id: "y_excl_other_rheum", label: "Other rheumatic disease excluded", status: "met", evidence: "ANCA, anti-CCP, anti-dsDNA all negative" },
      ],
      references: topReferences(yam, 4),
    },
    {
      criteria_id: sle.id,
      criteria_name: sle.name,
      citation: sle.citation ?? "",
      classification_rule: sle.classification_rule ?? "",
      classification_status: "does_not_meet",
      met_count: 0,
      total_count: flatCriterionList(sle).length,
      criteria: flatCriterionList(sle).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: "unmet" as const,
      })),
      references: topReferences(sle, 3),
    },
  ];

  return {
    narrative_summary:
      "Mid-50s adult male with two months of quotidian fevers, evanescent salmon-coloured truncal rash during spikes, polyarthralgia, lymphadenopathy, neutrophilic leukocytosis, hyper-ferritinaemia (8,420 ng/mL with low glycosylated fraction ~12%), and complete steroid response after a comprehensive negative workup for infection, malignancy, and connective-tissue disease. The clinical pattern fits an autoinflammatory rather than autoimmune phenotype. Adult-Onset Still's Disease meeting Yamaguchi criteria is the leading classification.",
    differentials,
    criteria_scores,
    source: "deterministic-fallback",
    warnings: [
      "ANTHROPIC_API_KEY not configured — showing pre-baked demo synthesis. Add your key to .env.local for live Opus 4.7 reasoning over your own cases.",
    ],
  };
}
