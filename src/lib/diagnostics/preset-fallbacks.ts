/**
 * Deterministic synthesise responses for each demo preset. Used when
 * ANTHROPIC_API_KEY is unset — every demo preset still returns a clinically
 * coherent set of differentials + criteria scoring + cited references.
 *
 * Each fallback is a hand-crafted SynthesiseResponse keyed by preset id.
 *
 * @public
 */

import type {
  SynthesiseResponse,
  DifferentialReasoning,
  CriteriaScore,
} from "./types";
import { findCriteria, flatCriterionList, topReferences } from "@/lib/criteria";
import type { DemoPresetId } from "./demo-presets";

function detectPreset(text: string): DemoPresetId | null {
  const t = text.toLowerCase();
  if (
    t.includes("ferritin") &&
    (t.includes("evanescent") || t.includes("salmon")) &&
    t.includes("rash")
  )
    return "aosd";
  if (
    (t.includes("anti-dsdna") || t.includes("anti-sm")) &&
    (t.includes("lupus nephritis") ||
      t.includes("class iv") ||
      (t.includes("proteinuria") && t.includes("low c3")) ||
      (t.includes("malar") && t.includes("photosensitivity")))
  )
    return "lupus-refractory";
  if (
    t.includes("igg4") &&
    (t.includes("storiform fibrosis") ||
      t.includes("retroperitoneal") ||
      t.includes("submandibular") ||
      t.includes("lacrimal"))
  )
    return "igg4rd";
  if (
    (t.includes("undifferentiated") || t.includes("4 years") || t.includes("six specialists") || t.includes("6 specialists")) &&
    (t.includes("raynaud") || t.includes("fatigue")) &&
    t.includes("ana")
  )
    return "undifferentiated-ctd";
  return null;
}

export function tryPresetFallback(text: string): SynthesiseResponse | null {
  const preset = detectPreset(text);
  if (!preset) return null;
  switch (preset) {
    case "aosd":
      return aosdFallback();
    case "lupus-refractory":
      return lupusFallback();
    case "igg4rd":
      return igg4Fallback();
    case "undifferentiated-ctd":
      return undifferentiatedFallback();
  }
}

function aosdFallback(): SynthesiseResponse {
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
  ];

  return {
    narrative_summary:
      "Mid-50s adult male with two months of quotidian fevers, evanescent salmon-coloured truncal rash during spikes, polyarthralgia, lymphadenopathy, neutrophilic leukocytosis, hyper-ferritinaemia (8,420 ng/mL with low glycosylated fraction ~12%), and complete steroid response after a comprehensive negative workup for infection, malignancy, and connective-tissue disease. The clinical pattern fits an autoinflammatory rather than autoimmune phenotype. Adult-Onset Still's Disease meeting Yamaguchi criteria is the leading classification.",
    differentials,
    criteria_scores,
    source: "deterministic-fallback",
    warnings: [
      "Demo preset (deterministic). Add ANTHROPIC_API_KEY to .env.local for live Opus 4.7 reasoning over your own cases.",
    ],
  };
}

function lupusFallback(): SynthesiseResponse {
  const sle = findCriteria("acr-eular-sle-2019")!;
  const aav = findCriteria("acr-eular-aav-2022")!;
  const sjog = findCriteria("acr-eular-sjogren-2016")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.86,
      key_evidence:
        "ANA 1:640 entry criterion met, anti-dsDNA + anti-Sm both positive (specific), Class IV lupus nephritis on biopsy, low C3/C4, multi-system involvement; comfortably satisfies the 2019 EULAR/ACR SLE classification weighted-criteria threshold.",
      supporting_findings: [
        "ANA 1:640 (entry criterion)",
        "Anti-dsDNA 380 IU/mL rising",
        "Anti-Sm positive (highly specific)",
        "Biopsy-proven Class IV LN",
        "Proteinuria 1.8 g/24h, RBC casts",
        "Low C3 + C4",
        "Photosensitive malar rash",
        "Non-erosive polyarthritis",
        "Two prior pleural effusions",
      ],
      contradicting_findings: [],
      citations: topReferences(sle, 3),
    },
    {
      differential_id: "acr-eular-aav-2022",
      differential_label: aav.name,
      posterior_probability: 0.04,
      key_evidence:
        "ANCA negative; pauci-immune glomerulonephritis would be expected in AAV but biopsy showed immune-complex Class IV LN — vasculitis unlikely as primary process.",
      supporting_findings: ["Renal involvement"],
      contradicting_findings: [
        "ANCA negative on assay",
        "Biopsy is immune-complex, not pauci-immune",
        "No upper-airway / pulmonary haemorrhage",
      ],
      citations: topReferences(aav, 2),
    },
    {
      differential_id: "acr-eular-sjogren-2016",
      differential_label: sjog.name,
      posterior_probability: 0.05,
      key_evidence:
        "Anti-Ro positive raises Sjögren's question, but absence of sicca symptoms on history and dominant lupus phenotype favours secondary Sjögren overlap rather than primary.",
      supporting_findings: ["Anti-Ro/SSA positive"],
      contradicting_findings: [
        "No documented sicca complaints",
        "No Schirmer's / salivary flow data",
        "Lupus phenotype dominates",
      ],
      citations: topReferences(sjog, 2),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: sle.id,
      criteria_name: sle.name,
      citation: sle.citation ?? "",
      classification_rule: sle.classification_rule ?? "",
      classification_status: "meets",
      met_count: 7,
      total_count: flatCriterionList(sle).length,
      criteria: flatCriterionList(sle).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: ((x.id ?? "").includes("ana") || (x.id ?? "").includes("ds_dna") || (x.id ?? "").includes("renal") || (x.id ?? "").includes("hypocomplement"))
          ? ("met" as const)
          : ("unknown" as const),
      })),
      references: topReferences(sle, 4),
    },
  ];

  return {
    narrative_summary:
      "Female patient mid-30s with biopsy-proven Class IV lupus nephritis and 6-year history of multi-organ SLE, currently in active flare with rising anti-dsDNA, falling complements, declining renal function, and proteinuria 1.8 g/24h despite hydroxychloroquine, mycophenolate (3 g/day, 24 months), and a completed Euro-Lupus IV cyclophosphamide pulse course 12 months ago. Refractory disease — standard of care has been exhausted along the EULAR / ACR 2019 lupus nephritis pathway. Concurrent triple-positive antiphospholipid serology adds thrombotic risk. The next step is post-CPG biologic / cellular therapy decision-making.",
    differentials,
    criteria_scores,
    source: "deterministic-fallback",
    warnings: [
      "Demo preset (deterministic). Add ANTHROPIC_API_KEY to .env.local for live Opus 4.7 reasoning over your own cases.",
    ],
  };
}

function igg4Fallback(): SynthesiseResponse {
  const igg4 = findCriteria("acr-eular-igg4rd-2019")!;
  const sjog = findCriteria("acr-eular-sjogren-2016")!;
  const aav = findCriteria("acr-eular-aav-2022")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "acr-eular-igg4rd-2019",
      differential_label: igg4.name,
      posterior_probability: 0.88,
      key_evidence:
        "Classic multi-organ IgG4-RD phenotype: bilateral submandibular + lacrimal gland enlargement, retroperitoneal fibrosis, sausage pancreas; serum IgG4 4.8 g/L; biopsy shows storiform fibrosis with IgG4+/IgG ratio 60% and IgG4 65/HPF — sufficient for ACR/EULAR 2019 classification.",
      supporting_findings: [
        "Bilateral submandibular swelling",
        "Lacrimal gland enlargement",
        "Retroperitoneal fibrosis",
        "Sausage-shaped pancreas",
        "Serum IgG4 4.8 g/L",
        "Storiform fibrosis on biopsy",
        "IgG4+/IgG ratio 60%",
        "Obliterative phlebitis",
      ],
      contradicting_findings: ["No clinical history of malignancy excluding lymphoma is essential"],
      citations: topReferences(igg4, 3),
    },
    {
      differential_id: "acr-eular-sjogren-2016",
      differential_label: sjog.name,
      posterior_probability: 0.04,
      key_evidence:
        "Sicca symptoms are present (mild dry eyes/mouth), and lacrimal involvement could mimic Sjögren — but anti-Ro/La negative and biopsy shows storiform fibrosis with IgG4 dominance, not focal lymphocytic sialadenitis.",
      supporting_findings: [
        "Lacrimal gland involvement",
        "Mild sicca symptoms",
      ],
      contradicting_findings: [
        "Anti-Ro / anti-La both negative",
        "Biopsy shows storiform fibrosis, not focal lymphocytic sialadenitis",
        "Multi-organ extra-glandular IgG4-RD pattern",
      ],
      citations: topReferences(sjog, 2),
    },
    {
      differential_id: "acr-eular-aav-2022",
      differential_label: aav.name,
      posterior_probability: 0.02,
      key_evidence:
        "Retroperitoneal infiltration around the aorta could mimic large-vessel vasculitis, but ANCA negative and no necrotising vasculitis on biopsy.",
      supporting_findings: ["Periaortic mass"],
      contradicting_findings: [
        "ANCA negative",
        "No necrotising vasculitis on biopsy",
        "Storiform fibrosis is highly specific for IgG4-RD",
      ],
      citations: topReferences(aav, 2),
    },
  ];

  const criteria_scores: CriteriaScore[] = [
    {
      criteria_id: igg4.id,
      criteria_name: igg4.name,
      citation: igg4.citation ?? "",
      classification_rule: igg4.classification_rule ?? "",
      classification_status: "meets",
      met_count: 6,
      total_count: flatCriterionList(igg4).length,
      criteria: flatCriterionList(igg4).map((x) => ({
        criterion_id: x.id ?? "",
        label: x.label ?? "",
        status: "unknown" as const,
      })),
      references: topReferences(igg4, 4),
    },
  ];

  return {
    narrative_summary:
      "Late-50s male with 18-month progressive multi-organ disease characterised by bilateral submandibular and lacrimal gland enlargement, retroperitoneal fibrosis around the aorta, and a sausage-shaped pancreas indicating type 1 autoimmune pancreatitis. Serum IgG4 markedly elevated at 4.8 g/L; submandibular gland biopsy demonstrates dense lymphoplasmacytic infiltrate with storiform fibrosis, obliterative phlebitis, and IgG4+ plasma cells 65/HPF with IgG4+/IgG ratio 60%. The clinical, serological and histological criteria together meet the 2019 ACR/EULAR IgG4-RD classification with high confidence. First-line therapy is glucocorticoid induction; refractory or relapsing disease historically responds to rituximab.",
    differentials,
    criteria_scores,
    source: "deterministic-fallback",
    warnings: [
      "Demo preset (deterministic). Add ANTHROPIC_API_KEY to .env.local for live Opus 4.7 reasoning over your own cases.",
    ],
  };
}

function undifferentiatedFallback(): SynthesiseResponse {
  const sjog = findCriteria("acr-eular-sjogren-2016")!;
  const sle = findCriteria("acr-eular-sle-2019")!;
  const ra = findCriteria("acr-eular-ra-2010")!;

  const differentials: DifferentialReasoning[] = [
    {
      differential_id: "acr-eular-sjogren-2016",
      differential_label: sjog.name,
      posterior_probability: 0.32,
      key_evidence:
        "Schirmer's <5 mm bilaterally + dry mouth + intermittently positive anti-Ro/SSA over 4 years suggests primary Sjögren's, but salivary gland biopsy has not been performed and confirmation panel was negative on third assay — needs minor salivary gland biopsy + ocular staining score before firm classification.",
      supporting_findings: [
        "Schirmer's 4 mm bilaterally",
        "Dry mouth on history",
        "Anti-Ro/SSA twice positive",
        "Episodic livedo",
      ],
      contradicting_findings: [
        "Anti-Ro confirmation panel negative",
        "No salivary gland biopsy yet",
        "No focus score data",
      ],
      citations: topReferences(sjog, 3),
    },
    {
      differential_id: "acr-eular-sle-2019",
      differential_label: sle.name,
      posterior_probability: 0.18,
      key_evidence:
        "ANA 1:160 speckled meets entry criterion; Raynaud's, fatigue, livedo all consistent — but specific autoantibodies (anti-dsDNA / anti-Sm) negative and weighted criteria score does not yet reach SLE classification threshold.",
      supporting_findings: [
        "ANA 1:160 speckled (entry)",
        "Raynaud's phenomenon",
        "Episodic livedo",
        "Fatigue + arthralgia",
      ],
      contradicting_findings: [
        "Anti-dsDNA negative",
        "Anti-Sm negative",
        "Complement normal",
        "No malar rash",
        "No haematological / renal involvement",
      ],
      citations: topReferences(sle, 2),
    },
    {
      differential_id: "ucd-overlap",
      differential_label: "Undifferentiated Connective Tissue Disease (UCTD)",
      posterior_probability: 0.36,
      key_evidence:
        "After 4 years of evolution without crystallising into any single defined CTD, ANA-positive multi-system features, mild response to hydroxychloroquine — fits the UCTD phenotype. Up to 30% of UCTD evolves into a defined CTD over years; ongoing surveillance is the standard.",
      supporting_findings: [
        "≥3 years of CTD-like features without classification",
        "ANA 1:160 sustained",
        "Response to hydroxychloroquine",
        "No single CTD criteria set met",
      ],
      contradicting_findings: [
        "Mimic conditions (fibromyalgia, hypothyroidism, primary Raynaud's) not fully excluded",
      ],
      citations: [
        {
          title: "Undifferentiated connective tissue disease — concept, course, and outcome",
          authors: "Mosca M, Tani C, Vagnani S, et al.",
          journal: "Autoimmunity Reviews",
          year: 2014,
          pmid: "24461367",
          doi: "10.1016/j.autrev.2013.11.005",
          why_it_matters: "Defines the UCTD phenotype and 30% conversion-to-defined-CTD risk.",
        },
      ],
    },
    {
      differential_id: "acr-eular-ra-2010",
      differential_label: ra.name,
      posterior_probability: 0.06,
      key_evidence:
        "RF marginally elevated and migratory polyarthralgia, but no synovitis on examination by 3 rheumatologists, anti-CCP negative, no erosions on imaging — RA effectively excluded.",
      supporting_findings: ["RF 18 IU/mL (just above ULN)"],
      contradicting_findings: [
        "No synovitis on exam",
        "Anti-CCP negative",
        "No erosions",
        "Migratory pattern atypical for RA",
      ],
      citations: topReferences(ra, 2),
    },
  ];

  const criteria_scores: CriteriaScore[] = [];

  return {
    narrative_summary:
      "Late-40s female with 4 years of multi-system but mild and migratory autoimmune-like symptoms — chronic fatigue, Raynaud's, episodic livedo, dry eyes/mouth, migratory polyarthralgia without synovitis — consistent ANA 1:160 speckled, intermittently positive anti-Ro on two of three assays, mildly elevated RF, fluctuating ESR/CRP. Six specialists across three hospitals have variously labelled the picture undifferentiated CTD, fibromyalgia, chronic fatigue syndrome, and early Sjögren's; no single classification criteria set is fully met. The most useful next step is targeted serology repetition + minor salivary gland biopsy + lab-driven exclusion of common mimics (thyroid, vitamin D, ferritin, HCV, HIV, monoclonal gammopathy) before either accepting UCTD as the working diagnosis or pursuing further immunological characterisation.",
    differentials,
    criteria_scores,
    source: "deterministic-fallback",
    warnings: [
      "Demo preset (deterministic). Add ANTHROPIC_API_KEY to .env.local for live Opus 4.7 reasoning over your own cases.",
    ],
  };
}
