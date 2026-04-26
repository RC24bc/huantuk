/**
 * The phased uncle-IIM demo — three rounds of file uploads + clinical-history
 * answers, mirroring how the real case unfolded over a 2-week admission +
 * outpatient follow-up.
 *
 * Each phase tells the AI a richer story than the last. The deterministic
 * fallback (preset-fallbacks.ts) returns a different synthesis per phase —
 * Phase 1 = broad differential, Phase 3 = confident IIM with double MSA.
 */

export type PhasedDocument = {
  filename: string;
  publicPath: string; // /demo-uncle-iim/phase1/...
  oneline: string;
};

export type PhaseSpec = {
  phase: 1 | 2 | 3;
  title: string;
  patient_history: string; // free-text the patient/relative would type
  documents: PhasedDocument[];
  /** Headline takeaway shown at the top of the phase card. */
  headline: string;
};

export const UNCLE_PHASES: PhaseSpec[] = [
  {
    phase: 1,
    title: "Phase 1 - Admission week",
    headline:
      "Admission CBC, bone marrow aspiration, cultures, TB / cardiac screen, dermatology photographs.",
    patient_history:
      "My uncle is mid-60s, Malaysian, generally well until 2 weeks ago. He developed persistent fevers, profound fatigue, muscle pain, joint aches and loss of appetite, and was admitted to a tertiary hospital. His doctors started a broad workup. He looks unwell and is on a drip. The first batch of results below is everything from the admission week.",
    documents: [
      {
        filename: "Pantai - Full Blood Count (admission, 07 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase1/01-pantai-fbc-admission-2026-04-07.pdf",
        oneline:
          "Hb 9.4, WBC 19.5 (neut 79%), Plt 657, ESR 118, eosinophilia 0.80; CK 34 NORMAL; LDH normal.",
      },
      {
        filename: "Pantai - Bone Marrow Aspiration (08 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase1/02-pantai-bone-marrow-aspiration-2026-04-08.pdf",
        oneline:
          "Reactive marrow, no malignancy, no MPN/MM, AFB negative on bone marrow.",
      },
      {
        filename: "Pantai - Urine + Blood Cultures (07 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase1/03-pantai-cultures-2026-04-07.pdf",
        oneline: "All cultures negative after 5 days.",
      },
      {
        filename: "Pantai - Troponin + Quantiferon TB (08 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase1/04-pantai-troponin-quantiferon-2026-04-08.pdf",
        oneline:
          "HS-Troponin 5.9 (normal). Quantiferon INDETERMINATE (low mitogen — anergy).",
      },
      {
        filename: "Dermatology photo summary (15 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase1/05-clinical-photo-summary-2026-04-15.pdf",
        oneline:
          "Periungual erythema, faint Gottron-like papules, possible shawl distribution.",
      },
    ],
  },
  {
    phase: 2,
    title: "Phase 2 - Mid-workup",
    headline:
      "Liver / renal chemistry, coagulation, tumour-marker screen, hepatitis / syphilis screen, ANA.",
    patient_history:
      "After the first week we asked the team for more answers. They added chemistry, urine tests, hepatitis and syphilis screens, tumour markers, and an ANA / dsDNA. He is improving on what we believe is steroid therapy, but the diagnosis is still unclear.",
    documents: [
      {
        filename: "Pantai - Liver & Renal Function (07 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase2/06-pantai-lft-rft-2026-04-07.pdf",
        oneline:
          "Albumin 23 LOW, Globulin 63 HIGH (A/G 0.37 reversed), AST 64 mild rise, ALT normal; eGFR 68; Glucose 5.8.",
      },
      {
        filename: "Pantai - Day 2 FBC + Coagulation (08 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase2/07-pantai-fbc-coag-day2-2026-04-08.pdf",
        oneline:
          "WBC 14.6 (neut 90%), Plt 694, INR 1.4, APTT normal, retics 1.3.",
      },
      {
        filename: "KPJ - Tumour Markers (10 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase2/08-kpj-tumour-markers-2026-04-10.pdf",
        oneline:
          "AFP / CEA / CA19-9 / PSA all NORMAL. Anti-NXP2 cancer link still requires age-appropriate imaging.",
      },
      {
        filename: "KPJ - Hepatitis + Syphilis + ANA / dsDNA (10 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase2/09-kpj-hepatitis-syphilis-ana-2026-04-10.pdf",
        oneline:
          "HBsAg / HCV / TPHA non-reactive. ANA NEGATIVE; anti-dsDNA <10 (negative).",
      },
      {
        filename: "Pantai - Urinalysis (08 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase2/10-pantai-urinalysis-2026-04-08.pdf",
        oneline:
          "Protein 1+, trace glucose; no casts, no haematuria, no leukocytes.",
      },
    ],
  },
  {
    phase: 3,
    title: "Phase 3 - Definitive workup",
    headline:
      "Inflammatory Myopathy 18-marker autoimmune panel, skin biopsy, 2-week outpatient follow-up labs.",
    patient_history:
      "The dermatology consult flagged dermatomyositis-spectrum changes on his hands, so the team requested the full myositis-specific antibody panel and a skin biopsy. He has now been discharged and is on tapering steroids. We came back for a follow-up clinic 2 weeks later and these are the latest results.",
    documents: [
      {
        filename: "Pathlab - Inflammatory Myopathy 18-Ag panel (15 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase3/11-pathlab-myositis-18ag-panel-2026-04-15.pdf",
        oneline:
          "Anti-NXP2 POSITIVE. Anti-HMGCR POSITIVE. All 16 other markers negative — DUAL MSA.",
      },
      {
        filename: "Pantai - 2-week Follow-up FBC + LFT + RFT (21 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase3/12-pantai-followup-fbc-lft-2026-04-21.pdf",
        oneline:
          "ESR 118 -> 28, Globulin 63 -> 37, Albumin 23 -> 30, AST 64 -> 18 - excellent treatment response. CK still 34.",
      },
      {
        filename: "Pathlab - Skin biopsy histopathology (18 Apr).pdf",
        publicPath: "/demo-uncle-iim/phase3/13-pathlab-skin-biopsy-2026-04-18.pdf",
        oneline:
          "Interface dermatitis, dermal mucin, granular DEJ IgG/IgM - dermatomyositis-spectrum.",
      },
    ],
  },
];

export function findPhase(n: number): PhaseSpec | undefined {
  return UNCLE_PHASES.find((p) => p.phase === n);
}

/** Concatenate everything up to and including phase N into a single case_text. */
export function buildCumulativeCaseText(uptoPhase: 1 | 2 | 3): string {
  const phases = UNCLE_PHASES.filter((p) => p.phase <= uptoPhase);
  const parts: string[] = [];
  for (const p of phases) {
    parts.push(`### ${p.title}`);
    parts.push(`Patient/family history: ${p.patient_history}`);
    parts.push("Reports uploaded in this phase:");
    for (const d of p.documents) {
      parts.push(`- ${d.filename}: ${d.oneline}`);
    }
    parts.push("");
  }
  return parts.join("\n");
}
