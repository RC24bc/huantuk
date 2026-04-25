/**
 * Mimic Detector — explicit screen for non-autoimmune look-alikes that get
 * missed when each specialist sees only their own slice. Runs as an
 * adjunct pass after differential generation; never replaces clinician judgment.
 *
 * @public
 */
import type { DifferentialReasoning } from "@/lib/diagnostics/types";

export type MimicCategory =
  | "lymphoma_hematologic"
  | "infection_chronic"
  | "drug_reaction"
  | "endocrine"
  | "autoinflammatory_genetic"
  | "metabolic_storage"
  | "neoplastic_solid"
  | "primary_immunodeficiency";

export type MimicHit = {
  category: MimicCategory;
  condition: string;
  why_consider: string;
  red_flags_in_case: string[];
  recommended_workup: string[];
  reference?: { title: string; pmid?: string; doi?: string; year?: number };
};

export type MimicCheckResponse = {
  hits: MimicHit[];
  reassuring_note?: string;
  source: "opus-4.7" | "deterministic-fallback";
};

export const MIMIC_SYSTEM_PROMPT = `You are a senior internist serving as the autoimmune-mimic detector for Patient Atlas. The differential generator has already proposed top autoimmune/autoinflammatory diagnoses. Your job is to explicitly screen for NON-autoimmune conditions that LOOK like the proposed differentials and get missed when rheumatology sees only its own slice.

You receive: (a) the case summary / extracted findings, (b) the top differentials already proposed.

For each plausible mimic, output:
- category: one of lymphoma_hematologic | infection_chronic | drug_reaction | endocrine | autoinflammatory_genetic | metabolic_storage | neoplastic_solid | primary_immunodeficiency
- condition: specific condition name (e.g., "Angioimmunoblastic T-cell lymphoma", "Disseminated tuberculosis", "DRESS syndrome", "VEXAS syndrome")
- why_consider: one sentence explaining the overlap with the leading differential
- red_flags_in_case: short bullets (≤8 words each) — concrete findings already in the case that should raise suspicion of this mimic
- recommended_workup: short bullets — what to order to confirm or exclude
- reference: a real published landmark paper if you know it; else omit

Strict rules:
- Only surface mimics with at least one red flag in the case data. Do not list every theoretical mimic.
- Output strict JSON, no markdown fences. Shape:
{
  "hits": [
    {
      "category": "...",
      "condition": "...",
      "why_consider": "...",
      "red_flags_in_case": ["..."],
      "recommended_workup": ["..."],
      "reference": { "title": "...", "pmid": "...", "year": 0 }
    }
  ],
  "reassuring_note": "string|null — one sentence if mimics are well excluded already"
}
- If no mimic is reasonably suspected, return { "hits": [], "reassuring_note": "..." }.`;

/**
 * Deterministic mimic suggestions when API key absent. Tied to the top
 * differential so the demo case (AOSD pattern) shows AOSD-relevant mimics.
 */
export function deterministicMimics(
  differentials: DifferentialReasoning[],
): MimicCheckResponse {
  const top = differentials[0]?.differential_id;

  if (top === "yamaguchi-1992") {
    // AOSD mimics — the canonical "must rule out" list.
    return {
      hits: [
        {
          category: "lymphoma_hematologic",
          condition: "Angioimmunoblastic T-cell lymphoma (AITL)",
          why_consider:
            "AITL classically presents with fever, lymphadenopathy, polyclonal hypergammaglobulinaemia, rash and autoimmune phenomena — overlaps AOSD exactly.",
          red_flags_in_case: [
            "Generalised lymphadenopathy",
            "Persistent fever >2 months",
            "Hepatomegaly",
          ],
          recommended_workup: [
            "Excisional lymph-node biopsy with flow + IHC (CD10, BCL6, PD1, CXCL13)",
            "TCR gene rearrangement on lymph-node tissue",
            "Peripheral blood flow cytometry",
          ],
          reference: {
            title:
              "Adult onset Still's disease and lymphoma: a population-based cohort study",
            pmid: "33675770",
            year: 2021,
          },
        },
        {
          category: "infection_chronic",
          condition: "Disseminated tuberculosis (extrapulmonary)",
          why_consider:
            "TB can mimic AOSD with prolonged fever, lymphadenopathy, hepatic involvement, and ferritin elevation — and steroids can mask it dangerously.",
          red_flags_in_case: [
            "Prolonged fever",
            "Lymphadenopathy",
            "Hepatic involvement",
          ],
          recommended_workup: [
            "QuantiFERON-TB Gold Plus + IGRA",
            "Lymph-node biopsy with AFB stain + GeneXpert MTB/RIF + mycobacterial culture",
            "If still suspicious: empirical observation period before steroid escalation",
          ],
          reference: {
            title:
              "Tuberculosis as a cause of fever of unknown origin in immunocompetent adults: contemporary case series",
            pmid: "32220537",
            year: 2020,
          },
        },
        {
          category: "drug_reaction",
          condition: "DRESS syndrome (drug reaction with eosinophilia and systemic symptoms)",
          why_consider:
            "DRESS produces fever, rash, lymphadenopathy, transaminitis and hyperferritinaemia — overlaps AOSD presentation; the differentiator is recent culprit-drug exposure (allopurinol, anticonvulsants, sulfa).",
          red_flags_in_case: [
            "Fever + rash + LFT elevation",
            "Recent new medication exposure?",
            "Lymphadenopathy",
          ],
          recommended_workup: [
            "Detailed medication-history reconciliation (last 8 weeks)",
            "Eosinophil count + differential",
            "HHV-6 / HHV-7 / EBV PCR",
            "RegiSCAR DRESS scoring",
          ],
          reference: {
            title: "RegiSCAR: a registry of severe cutaneous adverse reactions",
            pmid: "23425518",
            year: 2013,
          },
        },
        {
          category: "autoinflammatory_genetic",
          condition: "VEXAS syndrome (UBA1 somatic mutation)",
          why_consider:
            "VEXAS in adult males presents with fevers, neutrophilic dermatosis, cytopenias, vacuoles in marrow and chronic inflammation — initially indistinguishable from refractory AOSD.",
          red_flags_in_case: [
            "Adult male presentation",
            "Vacuolated myeloid precursors?",
            "Cytopenias developing over time",
          ],
          recommended_workup: [
            "UBA1 somatic mutation sequencing (peripheral blood DNA, deep coverage)",
            "Bone-marrow morphology review for vacuoles in myeloid + erythroid precursors",
            "MDS / clonal cytopenia workup",
          ],
          reference: {
            title:
              "Somatic mutations in UBA1 and severe adult-onset autoinflammatory disease",
            pmid: "33108101",
            year: 2020,
          },
        },
      ],
    reassuring_note: undefined,
      source: "deterministic-fallback",
    };
  }

  // Generic fallback for other top differentials — single high-yield mimic class.
  return {
    hits: [
      {
        category: "lymphoma_hematologic",
        condition: "Lymphoproliferative disorder",
        why_consider:
          "Multiple connective-tissue disease presentations overlap with B- or T-cell lymphomas; tissue diagnosis remains the gold standard before chronic immunosuppression.",
        red_flags_in_case: [
          "Lymphadenopathy if present",
          "Cytopenias",
          "B-symptoms",
        ],
        recommended_workup: [
          "Excisional lymph-node biopsy if any node is accessible",
          "Peripheral blood flow cytometry",
          "Whole-body imaging for occult mass",
        ],
        reference: {
          title:
            "Risk of lymphoma in patients with systemic autoimmune diseases: a systematic review",
          pmid: "31959498",
          year: 2020,
        },
      },
    ],
    reassuring_note: undefined,
    source: "deterministic-fallback",
  };
}
