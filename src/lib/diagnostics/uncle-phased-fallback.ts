/**
 * Phase-aware deterministic fallback for the uncle-IIM phased demo.
 *
 * Phase 1 = broad differential (admission CBC + BMA + cultures + skin photos)
 * Phase 2 = narrowed (chemistry + ANA negative + tumour markers normal)
 * Phase 3 = confident (18-Ag panel: anti-NXP2 + anti-HMGCR positive + biopsy)
 */

import type { SynthesiseResponse, DifferentialReasoning, CriteriaScore } from "./types";
import { findCriteria, flatCriterionList, topReferences } from "@/lib/criteria";

/**
 * Detect which phase of the uncle-IIM demo the request represents,
 * by markers we baked into the cumulative case_text.
 */
export function detectUnclePhase(text: string): 1 | 2 | 3 | null {
  const t = text.toLowerCase();
  // Phase 3 markers — definitive panel result
  if (
    (t.includes("anti-nxp2 positive") || /anti[- ]nxp2[^a-z]+positive/i.test(t)) &&
    (t.includes("anti-hmgcr positive") || /anti[- ]hmgcr[^a-z]+positive/i.test(t))
  ) return 3;
  if (t.includes("phase 3 - definitive") || t.includes("18-ag panel")) return 3;
  // Phase 2 markers
  if (
    t.includes("phase 2 - mid-workup") ||
    (t.includes("ana negative") && t.includes("tumour markers")) ||
    (t.includes("globulin 63") && t.includes("ana"))
  ) return 2;
  // Phase 1 marker
  if (
    t.includes("phase 1 - admission") ||
    (t.includes("bone marrow aspiration") && t.includes("cultures")) ||
    (t.includes("hb 9.4") && t.includes("plt 657"))
  ) return 1;
  return null;
}

export function unclePhaseFallback(phase: 1 | 2 | 3): SynthesiseResponse {
  switch (phase) {
    case 1: return phase1();
    case 2: return phase2();
    case 3: return phase3();
  }
}

// =============================================================================
// PHASE 1 — broad differential, IIM not yet leading
// =============================================================================

function phase1(): SynthesiseResponse {
  const yam = findCriteria("yamaguchi-1992")!;
  const iim = findCriteria("eular-acr-iim-2017")!;
  const aav = findCriteria("acr-eular-aav-2022")!;
  const sle = findCriteria("acr-eular-sle-2019")!;
  const igg4 = findCriteria("acr-eular-igg4rd-2019")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "yamaguchi-1992",
      differential_label: yam.name,
      posterior_probability: 0.30,
      key_evidence:
        "Adult-onset systemic inflammation with fevers, neutrophilic leukocytosis, reactive thrombocytosis, markedly raised ESR, hyper-globulinaemia, reactive marrow — fits the classical autoinflammatory pattern.",
      supporting_findings: [
        "Persistent fevers",
        "Neutrophilia 79%, WBC 19.5",
        "ESR 118, polyclonal gammopathy",
        "Reactive marrow",
        "Cultures negative",
      ],
      contradicting_findings: [
        "No salmon-coloured rash described",
        "Ferritin not yet measured",
        "No clear arthritis pattern documented",
      ],
      citations: topReferences(yam, 2),
    },
    {
      differential_id: "eular-acr-iim-2017",
      differential_label: iim.name,
      posterior_probability: 0.22,
      key_evidence:
        "Dermatology photos suggest dermatomyositis-spectrum cutaneous changes (Gottron-like papules, periungual erythema, possible shawl distribution) — IIM is on the table even though CK is currently normal.",
      supporting_findings: [
        "Periungual / Gottron-like changes on photos",
        "Mild AST rise without ALT (muscle source possible)",
        "Hyperglobulinaemia",
      ],
      contradicting_findings: [
        "CK normal (34 U/L)",
        "No documented proximal weakness yet",
        "MSA panel not yet ordered",
      ],
      citations: topReferences(iim, 2),
    },
    {
      differential_id: "acr-eular-aav-2022",
      differential_label: aav.name,
      posterior_probability: 0.18,
      key_evidence:
        "Systemic inflammation with peripheral eosinophilia (0.80) and renal mild dysfunction raises EGPA / vasculitis concern — ANCA not yet measured.",
      supporting_findings: ["Peripheral eosinophilia", "Mild renal dysfunction"],
      contradicting_findings: ["No ENT, lung haemorrhage or mononeuritis described", "ANCA pending"],
      citations: topReferences(aav, 2),
    },
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.16,
      key_evidence:
        "Multi-system inflammation in an adult — SLE remains differential until ANA returns; entry criterion still pending.",
      supporting_findings: ["Anaemia", "Mild proteinuria possible"],
      contradicting_findings: ["ANA pending", "No malar / photosensitive rash described"],
      citations: topReferences(sle, 2),
    },
    {
      differential_id: "acr-eular-igg4rd-2019",
      differential_label: igg4.name,
      posterior_probability: 0.14,
      key_evidence:
        "Polyclonal hyperglobulinaemia (63 g/L) raises IgG4-RD as a possibility, but no classical glandular / fibrosing organ involvement seen yet.",
      supporting_findings: ["Polyclonal hyperglobulinaemia"],
      contradicting_findings: ["No salivary, lacrimal or pancreatic findings", "Serum IgG4 not measured"],
      citations: topReferences(igg4, 1),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: iim.id,
      criteria_name: iim.name,
      citation: iim.citation ?? "",
      classification_rule: iim.classification_rule ?? "",
      classification_status: "insufficient_data",
      met_count: 1,
      total_count: flatCriterionList(iim).length,
      criteria: flatCriterionList(iim).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: "unknown" as const,
      })),
      references: topReferences(iim, 3),
    },
  ];

  return {
    narrative_summary:
      "Adult Malaysian male admitted with subacute systemic inflammation: persistent fevers, marked neutrophilic leucocytosis, reactive thrombocytosis, polyclonal hyperglobulinaemia (A/G 0.37 reversed), and ESR 118 mm/hr. Bone marrow shows reactive change (no malignancy, no MPN/MM); cultures and AFB are negative; troponin is normal; Quantiferon is indeterminate (consistent with anergy from severe inflammation). Dermatology photographs of the hands raise a dermatomyositis-spectrum suspicion (Gottron-like papules, periungual erythema, possible shawl distribution) but the autoimmune workup has not yet been done.",
    differentials,
    criteria_scores,
    clarifying_questions: [
      "Has anyone documented proximal muscle weakness on examination?",
      "Has serum ferritin been measured (relevant to AOSD differential)?",
      "Are there any photos of the trunk / chest distribution of the rash?",
    ],
    recommended_additional_reports: [
      "Liver / renal chemistry profile, coagulation, urinalysis",
      "Antinuclear antibody (ANA, Hep-2) + anti-dsDNA",
      "Inflammatory Myopathy Autoimmune Profile (18-marker panel) — anti-NXP2, anti-HMGCR, anti-Jo-1, anti-MDA5, anti-TIF1g, anti-SAE1, anti-SRP, anti-Mi-2, anti-PL-7/12, anti-EJ, anti-OJ, anti-Ku, anti-cN-1A",
      "Tumour-marker screen (AFP, CEA, CA19-9, PSA) and consider HRCT chest / abdomen / pelvis CT",
      "Hepatitis B / C / syphilis serology",
    ],
    source: "deterministic-fallback",
    warnings: [
      "Phase 1 of 3 - broad differential, leading suspicion not yet locked. Answer the 5 history questions and add the next batch of reports to advance.",
    ],
  };
}

// =============================================================================
// PHASE 2 — narrowed: ANA neg + tumour markers neg shifts toward IIM
// =============================================================================

function phase2(): SynthesiseResponse {
  const iim = findCriteria("eular-acr-iim-2017")!;
  const yam = findCriteria("yamaguchi-1992")!;
  const aav = findCriteria("acr-eular-aav-2022")!;
  const sle = findCriteria("acr-eular-sle-2019")!;
  const igg4 = findCriteria("acr-eular-igg4rd-2019")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "eular-acr-iim-2017",
      differential_label: iim.name,
      posterior_probability: 0.55,
      key_evidence:
        "ANA negative removes classical CTD entry criteria yet does NOT exclude myositis (myositis-specific antibodies are missed by routine ANA). Combined with the dermatomyositis-spectrum skin findings, IIM moves to the front of the differential pending MSA panel.",
      supporting_findings: [
        "Dermatomyositis-spectrum skin photos",
        "Mild AST rise without ALT (muscle source plausible)",
        "Polyclonal hyperglobulinaemia",
        "Tumour markers normal but cancer screen still required (anti-NXP2 risk)",
      ],
      contradicting_findings: [
        "CK still normal (atypical for classical IMNM)",
        "MSA panel not yet returned",
        "No documented proximal weakness yet",
      ],
      citations: topReferences(iim, 2),
    },
    {
      differential_id: "yamaguchi-1992",
      differential_label: yam.name,
      posterior_probability: 0.18,
      key_evidence:
        "Reactive marrow + neutrophilia + hyperferritinaemia profile would still be compatible, but the lack of classical evanescent salmon rash and absent very-high ferritin keeps Yamaguchi behind IIM.",
      supporting_findings: ["Inflammatory phenotype", "Reactive marrow"],
      contradicting_findings: [
        "No salmon evanescent rash",
        "No clear quotidian fever pattern documented",
      ],
      citations: topReferences(yam, 2),
    },
    {
      differential_id: "acr-eular-aav-2022",
      differential_label: aav.name,
      posterior_probability: 0.10,
      key_evidence:
        "Eosinophilia normalising on treatment, no end-organ vasculitic features, no ENT or pulmonary haemorrhage — AAV less likely.",
      supporting_findings: ["Initial eosinophilia"],
      contradicting_findings: ["No vasculitic end-organ damage", "ANCA not yet, but no clinical picture"],
      citations: topReferences(aav, 1),
    },
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.09,
      key_evidence:
        "ANA negative on Hep-2 immunofluorescence — fails the EULAR/ACR 2019 entry criterion. Classical SLE excluded.",
      supporting_findings: [],
      contradicting_findings: ["ANA negative - entry criterion fails", "Anti-dsDNA negative"],
      citations: topReferences(sle, 1),
    },
    {
      differential_id: "acr-eular-igg4rd-2019",
      differential_label: igg4.name,
      posterior_probability: 0.08,
      key_evidence:
        "Polyclonal (not IgG4-skewed) gammopathy and no glandular / fibrosing organ involvement — IgG4-RD unlikely.",
      supporting_findings: ["Polyclonal gammopathy"],
      contradicting_findings: ["Polyclonal not IgG4-skewed", "No glandular involvement"],
      citations: topReferences(igg4, 1),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: iim.id,
      criteria_name: iim.name,
      citation: iim.citation ?? "",
      classification_rule: iim.classification_rule ?? "",
      classification_status: "borderline",
      met_count: 2,
      total_count: flatCriterionList(iim).length,
      criteria: flatCriterionList(iim).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: "unknown" as const,
      })),
      references: topReferences(iim, 3),
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
        evidence: "ANA negative — entry criterion fails",
      })),
      references: topReferences(sle, 2),
    },
  ];

  return {
    narrative_summary:
      "Phase 2 results clarify the picture. Antinuclear antibody is NEGATIVE and anti-dsDNA is negative — formally excluding 2019 EULAR/ACR SLE classification. Tumour markers (AFP, CEA, CA 19-9, PSA) are within normal limits, hepatitis B/C and syphilis are non-reactive. The combination of dermatomyositis-spectrum skin findings, mild AST elevation without ALT (consistent with muscle source), polyclonal hyperglobulinaemia, and ANA-negative status sharpens the suspicion toward an IDIOPATHIC INFLAMMATORY MYOPATHY — particularly the seronegative-on-ANA but MSA-positive subset. The myositis-specific antibody panel is the next decisive test.",
    differentials,
    criteria_scores,
    clarifying_questions: [
      "Has the patient had any new shortness of breath or dysphagia in the last 2 weeks?",
      "Was creatine kinase elevated on any earlier test, or has it always been normal?",
      "Is there a personal or family history of cancer, statins, or significant weight loss?",
    ],
    recommended_additional_reports: [
      "Inflammatory Myopathy Autoimmune Profile (18-marker MSA panel) - DECISIVE next test",
      "Skin biopsy of one of the photographed lesions (interface dermatitis vs vasculitis)",
      "HRCT chest with pulmonary function tests + DLCO (myositis-ILD screen)",
      "Whole-body PET-CT or staged CT chest/abdomen/pelvis (anti-NXP2 paraneoplastic risk if MSA positive)",
      "Repeat CK and aldolase 2 weeks off steroids if clinically safe",
    ],
    source: "deterministic-fallback",
    warnings: [
      "Phase 2 of 3 - leading differential is now an Idiopathic Inflammatory Myopathy. Add the myositis panel + biopsy + follow-up labs to advance.",
    ],
  };
}

// =============================================================================
// PHASE 3 — definitive: anti-NXP2 + anti-HMGCR overlap myopathy
// =============================================================================

function phase3(): SynthesiseResponse {
  const iim = findCriteria("eular-acr-iim-2017")!;
  const yam = findCriteria("yamaguchi-1992")!;
  const sle = findCriteria("acr-eular-sle-2019")!;
  const igg4 = findCriteria("acr-eular-igg4rd-2019")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "eular-acr-iim-2017",
      differential_label: iim.name + " - Anti-NXP2 + Anti-HMGCR overlap",
      posterior_probability: 0.92,
      key_evidence:
        "Dual myositis-specific antibody positivity (Anti-NXP2 AND Anti-HMGCR) on a validated 18-marker panel, supported by dermatomyositis-spectrum skin biopsy (interface dermatitis with dermal mucin and granular DEJ deposits) and an excellent treatment response (ESR 118 -> 28, globulin normalising) — 2017 EULAR/ACR criteria threshold met.",
      supporting_findings: [
        "Anti-NXP2 POSITIVE (DM, calcinosis, paraneoplastic risk)",
        "Anti-HMGCR POSITIVE (IMNM, often statin-triggered)",
        "Dermatomyositis-spectrum skin biopsy",
        "Excellent corticosteroid response across all inflammatory markers",
        "Hyperglobulinaemia normalising on treatment",
      ],
      contradicting_findings: [
        "CK remains normal (atypical but recognised when treatment is early)",
        "No documented proximal muscle weakness yet (sub-clinical myositis)",
      ],
      citations: topReferences(iim, 3),
    },
    {
      differential_id: "yamaguchi-1992",
      differential_label: yam.name,
      posterior_probability: 0.04,
      key_evidence:
        "Demoted - dual MSA positivity and DM-spectrum biopsy reframe the systemic inflammation as IIM rather than autoinflammatory.",
      supporting_findings: [],
      contradicting_findings: ["MSA-positive picture inconsistent with primary AOSD", "No salmon evanescent rash"],
      citations: topReferences(yam, 1),
    },
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.02,
      key_evidence:
        "ANA negative - 2019 EULAR/ACR entry criterion fails. Excluded.",
      supporting_findings: [],
      contradicting_findings: ["ANA negative", "Anti-dsDNA negative", "No malar / discoid / oral ulcers"],
      citations: topReferences(sle, 1),
    },
    {
      differential_id: "acr-eular-igg4rd-2019",
      differential_label: igg4.name,
      posterior_probability: 0.02,
      key_evidence:
        "No glandular or fibrosing organ involvement; polyclonal gammopathy not IgG4-skewed. Excluded.",
      supporting_findings: [],
      contradicting_findings: ["Polyclonal not IgG4-skewed", "No fibrosing organ disease"],
      citations: topReferences(igg4, 1),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: iim.id,
      criteria_name: iim.name,
      citation: iim.citation ?? "",
      classification_rule: iim.classification_rule ?? "",
      classification_status: "meets",
      met_count: Math.max(4, Math.floor(flatCriterionList(iim).length * 0.45)),
      total_count: flatCriterionList(iim).length,
      criteria: flatCriterionList(iim).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: x.id?.includes("autoantibody") || x.id?.includes("skin") ? ("met" as const) : ("unknown" as const),
      })),
      references: topReferences(iim, 4),
    },
  ];

  return {
    narrative_summary:
      "Phase 3 returns the definitive diagnosis: an OVERLAP IDIOPATHIC INFLAMMATORY MYOPATHY with DUAL myositis-specific antibody positivity (Anti-NXP2 AND Anti-HMGCR) on a validated 18-marker panel, supported by dermatomyositis-spectrum skin biopsy (interface dermatitis, dermal mucin, granular DEJ immunoreactant deposition) and excellent treatment response (ESR 118 -> 28, globulin and AST normalising on steroids). Two safety priorities follow: (1) age-appropriate cancer screening including whole-body CT or PET-CT, given the 15-30% adult paraneoplastic association of Anti-NXP2 dermatomyositis; and (2) HRCT chest with PFT + DLCO to exclude myositis-associated interstitial lung disease before the steroid taper. CK has remained normal throughout — atypical but recognised in HMGCR-IMNM treated early.",
    differentials,
    criteria_scores,
    clarifying_questions: [
      "Has whole-body imaging (PET-CT or staged CT) been done given the Anti-NXP2 paraneoplastic risk?",
      "Has interstitial lung disease been screened with HRCT chest + PFT/DLCO before steroid taper?",
      "Was statin exposure ever documented (Anti-HMGCR is most often statin-associated)?",
    ],
    recommended_additional_reports: [
      "Whole-body PET-CT (if not done) - cancer screen mandatory in Anti-NXP2 dermatomyositis",
      "HRCT chest + pulmonary function tests + DLCO - myositis-ILD screen before steroid taper",
      "Skeletal-muscle MRI (whole-body STIR) to map subclinical myositis activity",
      "Repeat MSA panel in 3 months to confirm seroconversion / persistence",
      "Rheumatology + Oncology multidisciplinary review",
    ],
    source: "deterministic-fallback",
    warnings: [
      "Phase 3 of 3 - definitive overlap IIM diagnosis (Anti-NXP2 + Anti-HMGCR). Confidence 92%. Cancer screen + ILD screen are next-step priorities before steroid taper.",
    ],
  };
}
