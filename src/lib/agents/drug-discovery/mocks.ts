/**
 * Mock-up Drug Discovery results — clearly labelled for demo only.
 * Returned when ANTHROPIC_API_KEY is unset OR when running without a real
 * Opus 4.7 round-trip. Each mock is parameterised by the top differential
 * so the demo case (AOSD pattern) shows AOSD-relevant repurposing /
 * off-label / trial data, not generic placeholders.
 *
 * @public
 */

import type {
  RepurposeResponse,
  OffLabelResponse,
  TrialMatchResponse,
} from "./types";

const DIFFERENTIAL_LABELS: Record<string, string> = {
  "yamaguchi-1992": "Adult-Onset Still's Disease",
  "eular-acr-iim-2017": "Idiopathic Inflammatory Myopathy",
  "acr-eular-sle-2019": "Systemic Lupus Erythematosus",
  "acr-eular-ra-2010": "Rheumatoid Arthritis",
  "acr-eular-aav-2022": "ANCA-Associated Vasculitis",
  "acr-eular-igg4rd-2019": "IgG4-Related Disease",
  "acr-eular-sjogren-2016": "Sjögren's Syndrome",
  "ucd-overlap": "Undifferentiated Connective Tissue Disease",
};

export function mockRepurpose(diffId: string): RepurposeResponse {
  const label = DIFFERENTIAL_LABELS[diffId] ?? diffId;

  if (diffId === "yamaguchi-1992") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      candidates: [
        {
          drug: "Anakinra",
          drug_class: "Recombinant IL-1 receptor antagonist",
          approved_indication:
            "FDA-approved for rheumatoid arthritis, cryopyrin-associated periodic syndromes (CAPS), neonatal-onset multisystem inflammatory disease (NOMID), and deficiency of IL-1 receptor antagonist (DIRA).",
          proposed_mechanism_in_case:
            "AOSD is driven by IL-1β-mediated autoinflammation; the patient's hyperferritinaemia and steroid responsiveness are classic IL-1-driven phenotypes — direct IL-1 blockade addresses the upstream pathway, not just downstream inflammation.",
          evidence_level: "phase3_trial",
          availability: "approved_intl",
          est_cost_myr_monthly: [4500, 7500],
          safety_flags: [
            "Injection-site reactions common",
            "Increased serious infection risk",
            "Avoid in active TB",
            "Daily SC injection",
          ],
          reasoning_steps: [
            "1. Patient phenotype matches IL-1-driven autoinflammation (low glycosylated ferritin, neutrophilic leukocytosis).",
            "2. Anakinra has Class I evidence in systemic JIA, the paediatric analogue of AOSD.",
            "3. Multiple AOSD case series document rapid steroid-sparing response.",
            "4. Short half-life allows daily titration vs. monthly biologics.",
            "5. No TPMT or HLA-B*5801 testing required.",
          ],
          references: [
            {
              title:
                "Anakinra in adult-onset Still's disease: long-term treatment in patients resistant to conventional therapy",
              authors: "Giampietro C, Ravagnani V, Barbaroux M, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2013,
              pmid: "23303067",
              doi: "10.1136/annrheumdis-2012-202600",
            },
            {
              title:
                "ANAJIS trial: anakinra in steroid-dependent adult-onset Still's disease",
              authors: "Nordström D, Knight A, Luukkainen R, et al.",
              journal: "Journal of Rheumatology",
              year: 2012,
              pmid: "22422496",
              doi: "10.3899/jrheum.110569",
            },
          ],
        },
        {
          drug: "Canakinumab",
          drug_class: "Humanised anti-IL-1β monoclonal antibody",
          approved_indication:
            "FDA-approved for periodic fever syndromes (CAPS, TRAPS, HIDS/MKD, FMF), systemic juvenile idiopathic arthritis (sJIA), and adult-onset Still's disease (EMA + FDA).",
          proposed_mechanism_in_case:
            "Selective IL-1β blockade with monthly dosing — same mechanistic target as anakinra but with subcutaneous injection every 4 weeks instead of daily; ideal once treatment response is established.",
          evidence_level: "fda_approved",
          availability: "approved_intl",
          est_cost_myr_monthly: [22000, 32000],
          safety_flags: [
            "Long half-life — slower to wash out",
            "Serious infection risk",
            "Avoid in active TB / hepatitis B",
            "High cost",
          ],
          reasoning_steps: [
            "1. EMA + FDA approved specifically for AOSD since 2020.",
            "2. CONSIDER-AOSD trial showed sustained DAS28 response.",
            "3. Monthly dosing improves adherence vs. daily anakinra.",
            "4. Cost is the limiting factor in MY context.",
            "5. Reasonable second-line if anakinra response is incomplete or adherence problematic.",
          ],
          references: [
            {
              title:
                "Efficacy and safety of canakinumab in patients with active adult-onset Still's disease",
              authors: "Kedor C, Listing J, Zernicke J, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2020,
              pmid: "32209552",
              doi: "10.1136/annrheumdis-2019-216956",
            },
          ],
        },
        {
          drug: "Tocilizumab",
          drug_class: "Humanised anti-IL-6 receptor monoclonal antibody",
          approved_indication:
            "FDA/EMA-approved for rheumatoid arthritis, giant cell arteritis, systemic JIA, polyarticular JIA, COVID-19, and CAR-T-induced cytokine release syndrome.",
          proposed_mechanism_in_case:
            "IL-6 is the second cytokine driving AOSD pathology after IL-1; useful when IL-1 blockade response is partial, or when articular involvement dominates over systemic features.",
          evidence_level: "phase2_trial",
          availability: "approved_my",
          est_cost_myr_monthly: [3500, 6000],
          safety_flags: [
            "GI perforation risk if diverticular disease",
            "Lipid + LFT monitoring required",
            "Neutropenia",
            "Cytopenias",
          ],
          reasoning_steps: [
            "1. Tocilizumab is approved + marketed in Malaysia for RA and GCA.",
            "2. Multiple AOSD open-label studies show response in IL-1-refractory patients.",
            "3. IV or SC dosing options.",
            "4. Lower per-dose cost than canakinumab.",
            "5. Can mask CRP elevation — monitor by clinical/serositis response.",
          ],
          references: [
            {
              title:
                "Tocilizumab in adult-onset Still's disease: a meta-analysis of efficacy and safety",
              authors: "Kaneko Y, Kameda H, Ikeda K, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2018,
              pmid: "30019875",
              doi: "10.1136/annrheumdis-2018-213920",
            },
          ],
        },
        {
          drug: "Ruxolitinib",
          drug_class: "JAK1/2 inhibitor",
          approved_indication:
            "FDA-approved for myelofibrosis, polycythaemia vera, steroid-refractory acute graft-versus-host disease, and atopic dermatitis (topical).",
          proposed_mechanism_in_case:
            "Pan-JAK inhibition modulates IFN-γ + IL-6 + IL-12/23 signalling; emerging data show response in IL-1/IL-6-refractory AOSD with macrophage activation features.",
          evidence_level: "case_series",
          availability: "approved_intl",
          est_cost_myr_monthly: [12000, 18000],
          safety_flags: [
            "Cytopenias common",
            "Reactivation of latent infection (TB, hepatitis B, HSV)",
            "VTE risk",
            "Lipid elevation",
          ],
          reasoning_steps: [
            "1. Reserved for IL-1 + IL-6 refractory disease or MAS-prone patients.",
            "2. Three published case series with response rates 50–70%.",
            "3. Oral once-daily dosing.",
            "4. Cost intermediate between tocilizumab and canakinumab.",
            "5. Strong opportunistic-infection screening required pre-start.",
          ],
          references: [
            {
              title:
                "Ruxolitinib in refractory adult-onset Still's disease: a multicentre case series",
              authors: "Vercruysse F, Barba T, Gilardin L, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2022,
              pmid: "35193860",
              doi: "10.1136/annrheumdis-2021-221814",
            },
          ],
        },
      ],
    };
  }

  if (diffId === "acr-eular-sle-2019") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      candidates: [
        {
          drug: "Anifrolumab",
          drug_class: "Anti-type-I interferon receptor (anti-IFNAR1) monoclonal antibody",
          approved_indication: "FDA/EMA-approved (2021) for moderate-to-severe SLE in adults receiving standard therapy.",
          proposed_mechanism_in_case:
            "Type-I IFN signature is dominant in this patient (anti-Ro+, anti-Sm+, low complement, multi-system flare); IFNAR1 blockade closes the upstream interferon driver, improving cutaneous + serological disease beyond MMF/CYC pathway.",
          evidence_level: "fda_approved",
          availability: "approved_intl",
          est_cost_myr_monthly: [16000, 22000],
          safety_flags: [
            "Increased URTI / herpes zoster risk",
            "Defer live vaccines",
            "Caution if baseline lymphopenia",
            "Monthly IV infusion logistics",
          ],
          reasoning_steps: [
            "1. TULIP-1/TULIP-2 trials demonstrated BICLA response advantage.",
            "2. Strong IFN-signature phenotype in this patient supports response prediction.",
            "3. Steroid-sparing potential after 6 months.",
            "4. Not yet routinely reimbursed in MY — out-of-pocket or named-patient.",
            "5. Pair with continued HCQ; MMF can be tapered as response allows.",
          ],
          references: [
            {
              title: "Anifrolumab efficacy and safety in moderate-to-severe SLE: TULIP-2 trial",
              authors: "Morand EF, Furie R, Tanaka Y, et al.",
              journal: "New England Journal of Medicine",
              year: 2020,
              pmid: "31851795",
              doi: "10.1056/NEJMoa1912196",
            },
          ],
        },
        {
          drug: "Belimumab",
          drug_class: "Anti-BAFF (BLyS) monoclonal antibody",
          approved_indication: "FDA/EMA-approved for active SLE and active lupus nephritis (added 2020) in adults and paediatric patients.",
          proposed_mechanism_in_case:
            "BAFF blockade reduces autoreactive B-cell survival in active LN; the BLISS-LN trial showed renal-response advantage when added to standard induction. This patient has biopsy-proven Class IV disease with rising anti-dsDNA — ideal phenotype.",
          evidence_level: "fda_approved",
          availability: "approved_my",
          est_cost_myr_monthly: [6500, 9500],
          safety_flags: [
            "Serious infection risk",
            "Caution in mood / suicidality history",
            "Slow onset of effect (3–6 months)",
          ],
          reasoning_steps: [
            "1. BLISS-LN demonstrated renal complete response benefit.",
            "2. Anti-dsDNA + low-complement phenotype most likely to respond.",
            "3. Add to MMF rather than switching; combination is the trial regimen.",
            "4. Approved + marketed in Malaysia (named patient).",
            "5. Monthly IV (or weekly SC) — patient preference question.",
          ],
          references: [
            {
              title: "Belimumab in patients with active lupus nephritis (BLISS-LN)",
              authors: "Furie R, Rovin BH, Houssiau F, et al.",
              journal: "New England Journal of Medicine",
              year: 2020,
              pmid: "32937045",
              doi: "10.1056/NEJMoa2001180",
            },
          ],
        },
        {
          drug: "Voclosporin",
          drug_class: "Calcineurin inhibitor (next-generation)",
          approved_indication: "FDA-approved (2021) for active lupus nephritis as triple therapy with MMF + low-dose steroids.",
          proposed_mechanism_in_case:
            "Triple therapy combination addresses the unresolved proteinuria 1.8 g/24h despite MMF + CYC; AURORA-1 trial showed superior renal complete response at 52 weeks.",
          evidence_level: "fda_approved",
          availability: "approved_intl",
          est_cost_myr_monthly: [12000, 18000],
          safety_flags: [
            "eGFR monitoring (acute decline reversible)",
            "Hypertension",
            "CYP3A4 drug interactions",
            "Avoid if eGFR < 45",
          ],
          reasoning_steps: [
            "1. AURORA-1 + AURORA-2 extension confirmed 24-month safety + efficacy.",
            "2. Patient eGFR 68 — within voclosporin therapeutic window.",
            "3. Triple therapy with MMF (continued) + low-dose steroid taper.",
            "4. Not yet MY-approved — named-patient import.",
            "5. Monitor eGFR + BP weekly initially.",
          ],
          references: [
            {
              title: "Voclosporin for lupus nephritis: AURORA 1 phase 3 trial",
              authors: "Rovin BH, Teng YKO, Ginzler EM, et al.",
              journal: "Lancet",
              year: 2021,
              pmid: "33864840",
              doi: "10.1016/S0140-6736(21)00578-X",
            },
          ],
        },
      ],
    };
  }

  if (diffId === "eular-acr-iim-2017") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      candidates: [
        {
          drug: "Intravenous Immunoglobulin (IVIG)",
          drug_class: "Pooled human immunoglobulin",
          approved_indication:
            "FDA-approved for primary immunodeficiency, ITP, Kawasaki, CIDP, and (since 2021) for adult dermatomyositis (Octagam 10%).",
          proposed_mechanism_in_case:
            "Anti-HMGCR IMNM responds reliably to IVIG; anti-NXP2 dermatomyositis with calcinosis or refractory weakness also benefits. The 2021 ProDERM Phase 3 trial demonstrated clear DM benefit, making IVIG a guideline-supported option for this dual-MSA phenotype.",
          evidence_level: "fda_approved",
          availability: "approved_my",
          est_cost_myr_monthly: [12000, 22000],
          safety_flags: [
            "Volume overload — caution in CKD stage 3a",
            "Thromboembolic risk",
            "Aseptic meningitis",
            "Renal monitoring required",
          ],
          reasoning_steps: [
            "1. ProDERM trial established Phase 3 efficacy for adult DM (NEJM 2022).",
            "2. Pinal-Fernandez 2020 protocol shows IVIG is preferred first-line for anti-HMGCR IMNM.",
            "3. IVIG is steroid-sparing — useful given pre-diabetic IFG already developing.",
            "4. CKD 3a requires renal-friendly preparation + slower infusion.",
            "5. Available in Malaysia at major tertiary centres.",
          ],
          references: [
            {
              title:
                "Trial of intravenous immune globulin in dermatomyositis (ProDERM)",
              authors: "Aggarwal R, Charles-Schoeman C, Schessl J, et al.",
              journal: "New England Journal of Medicine",
              year: 2022,
              pmid: "36287101",
              doi: "10.1056/NEJMoa2117912",
            },
            {
              title:
                "Treatment trial in immune-mediated necrotizing myopathy: a multicenter retrospective analysis",
              authors: "Pinal-Fernandez I, Casal-Dominguez M, Mammen AL",
              journal: "Neurology",
              year: 2020,
              pmid: "33323473",
              doi: "10.1212/WNL.0000000000011175",
            },
          ],
        },
        {
          drug: "Rituximab",
          drug_class: "Anti-CD20 chimeric monoclonal antibody",
          approved_indication:
            "FDA/EMA-approved for non-Hodgkin lymphoma, CLL, RA, ANCA-associated vasculitis, pemphigus vulgaris. Not on-label for IIM but widely used.",
          proposed_mechanism_in_case:
            "B-cell depletion targets myositis-specific antibody production. The RIM trial (Oddis 2013) showed >80% of refractory adult/juvenile DM and adult PM patients met response criteria; case series support efficacy in anti-HMGCR IMNM and anti-NXP2 DM specifically.",
          evidence_level: "phase2_trial",
          availability: "approved_my",
          est_cost_myr_monthly: [4500, 8000],
          safety_flags: [
            "Hepatitis B reactivation risk — patient is non-immune (sAg negative, sAb low) — mandatory pre-treatment HBV vaccination/prophylaxis decision",
            "Infusion reactions",
            "Hypogammaglobulinaemia after repeat cycles",
            "PML risk (very rare)",
          ],
          reasoning_steps: [
            "1. RIM trial supports use in refractory adult DM/PM.",
            "2. Anti-HMGCR IMNM has growing case-series support for rituximab.",
            "3. Patient hepatitis B serology shows no immunity — vaccination/prophylaxis required pre-dose.",
            "4. 6-month dosing reduces clinic burden.",
            "5. Available + reimbursable in Malaysia for haem-onc indications; off-label IIM use is established.",
          ],
          references: [
            {
              title:
                "Rituximab in the treatment of refractory adult and juvenile dermatomyositis and adult polymyositis (RIM)",
              authors: "Oddis CV, Reed AM, Aggarwal R, et al.",
              journal: "Arthritis & Rheumatism",
              year: 2013,
              pmid: "23124935",
              doi: "10.1002/art.37754",
            },
          ],
        },
        {
          drug: "Tofacitinib",
          drug_class: "JAK 1/3 inhibitor",
          approved_indication:
            "FDA/EMA-approved for rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, juvenile idiopathic arthritis, ankylosing spondylitis.",
          proposed_mechanism_in_case:
            "JAK-STAT inhibition addresses the type-I-IFN-driven dermatomyositis transcriptional signature, especially anti-MDA5 and anti-NXP2 phenotypes; small open-label studies show rapid response in refractory cutaneous + myopathic disease.",
          evidence_level: "phase2_trial",
          availability: "approved_my",
          est_cost_myr_monthly: [3500, 6000],
          safety_flags: [
            "Cytopenias",
            "Reactivation of latent infection — TB / HSV / HBV",
            "Lipid elevation",
            "VTE risk in elderly",
          ],
          reasoning_steps: [
            "1. Open-label trial (Paik 2021) showed dermatomyositis-disease-activity reduction.",
            "2. Reasonable third-line after IVIG ± rituximab in this dual-MSA phenotype.",
            "3. Oral once-daily — better adherence than infusion biologics.",
            "4. Strong opportunistic-infection screening required pre-start.",
            "5. Available in Malaysia for RA — off-label IIM use established.",
          ],
          references: [
            {
              title: "Tofacitinib in refractory dermatomyositis: an open-label pilot study",
              authors: "Paik JJ, Casciola-Rosen L, Shin JY, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2021,
              pmid: "33602673",
              doi: "10.1136/annrheumdis-2020-219013",
            },
          ],
        },
        {
          drug: "Mycophenolate mofetil",
          drug_class: "Inhibitor of inosine monophosphate dehydrogenase (lymphocyte-selective)",
          approved_indication:
            "FDA/EMA-approved for prevention of organ-transplant rejection. Off-label across rheumatology including IIM.",
          proposed_mechanism_in_case:
            "Excellent oral steroid-sparing agent in IIM, with growing evidence specifically in anti-HMGCR IMNM. Particularly useful given the patient's pre-diabetic glucose status — minimising chronic steroid exposure is the priority.",
          evidence_level: "case_series",
          availability: "approved_my",
          est_cost_myr_monthly: [400, 1200],
          safety_flags: [
            "GI intolerance",
            "Cytopenias",
            "Increased infection risk",
            "Teratogenicity (not relevant here)",
          ],
          reasoning_steps: [
            "1. Generic available in Malaysia at very low cost.",
            "2. Oral, well-tolerated, monthly monitoring straightforward.",
            "3. Reasonable steroid-sparing partner with IVIG.",
            "4. Established off-label evidence base in adult IIM.",
            "5. Better tolerated than azathioprine for many patients.",
          ],
          references: [
            {
              title:
                "Mycophenolate mofetil for the treatment of idiopathic inflammatory myopathies: a long-term follow-up",
              authors: "Rouster-Stevens KA, Morgan GA, Wang D, Pachman LM",
              journal: "Pediatric Rheumatology",
              year: 2010,
              pmid: "20507542",
              doi: "10.1186/1546-0096-8-22",
            },
          ],
        },
      ],
    };
  }

  if (diffId === "acr-eular-igg4rd-2019") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      candidates: [
        {
          drug: "Rituximab",
          drug_class: "Anti-CD20 chimeric monoclonal antibody",
          approved_indication: "FDA/EMA-approved for NHL, CLL, RA, ANCA-associated vasculitis, pemphigus vulgaris. Not yet on-label for IgG4-RD.",
          proposed_mechanism_in_case:
            "IgG4-RD is a B-cell driven plasmablast disease; CD20 depletion of memory B-cells reduces IgG4-secreting plasmablast turnover. Two open-label trials show median 90% reduction in serum IgG4 + clinical remission within 6 months.",
          evidence_level: "phase2_trial",
          availability: "approved_my",
          est_cost_myr_monthly: [4500, 8000],
          safety_flags: [
            "Infusion reactions",
            "Hepatitis B reactivation — screen pre-dose",
            "PML risk (very rare)",
            "Hypogammaglobulinaemia after repeated cycles",
          ],
          reasoning_steps: [
            "1. Two prospective open-label trials (Mass General, Genoa) show >90% serum IgG4 reduction.",
            "2. Faster steroid taper compared to glucocorticoid monotherapy.",
            "3. Reasonable first-line in fibrotic / multi-organ disease.",
            "4. Available + reimbursable in Malaysia for haem-onc indications; off-label IgG4-RD use established.",
            "5. Mandatory hepatitis B serology before infusion.",
          ],
          references: [
            {
              title: "Rituximab for IgG4-related disease: a prospective, open-label trial",
              authors: "Carruthers MN, Topazian MD, Khosroshahi A, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2015,
              pmid: "25351522",
              doi: "10.1136/annrheumdis-2014-206605",
            },
          ],
        },
        {
          drug: "Inebilizumab",
          drug_class: "Anti-CD19 humanised afucosylated monoclonal antibody",
          approved_indication: "FDA-approved for neuromyelitis optica spectrum disorder (NMOSD).",
          proposed_mechanism_in_case:
            "CD19 depletes a broader B-cell + plasmablast population than CD20, including IgG4-secreting plasmablasts directly. The MITIGATE Phase 3 trial in IgG4-RD reported a 87% reduction in flare risk at 52 weeks.",
          evidence_level: "phase3_trial",
          availability: "approved_intl",
          est_cost_myr_monthly: [22000, 32000],
          safety_flags: [
            "Infusion reactions",
            "Increased infection risk",
            "Hypogammaglobulinaemia",
            "Twice-yearly dosing reduces clinic burden",
          ],
          reasoning_steps: [
            "1. MITIGATE Phase 3 (NEJM 2024) is the first positive RCT in IgG4-RD.",
            "2. Broader B-cell coverage than rituximab — addresses plasmablast resistance.",
            "3. Bi-annual IV infusion — better adherence than every-6-month rituximab.",
            "4. Not yet MY-approved; named-patient import via Singapore HSA.",
            "5. Reserved for refractory or relapsing disease post-rituximab.",
          ],
          references: [
            {
              title: "Inebilizumab in IgG4-related disease (MITIGATE phase 3)",
              authors: "Stone JH, Khosroshahi A, Hellmark T, et al.",
              journal: "New England Journal of Medicine",
              year: 2024,
              pmid: "38804516",
              doi: "10.1056/NEJMoa2402905",
            },
          ],
        },
      ],
    };
  }

  // Generic plausible mock for any other top differential.
  return {
    top_differential_id: diffId,
    top_differential_label: label,
    is_mock: true,
    source: "mock-up",
    candidates: [
      {
        drug: "Rituximab",
        drug_class: "Anti-CD20 chimeric monoclonal antibody",
        approved_indication:
          "FDA/EMA-approved for non-Hodgkin lymphoma, CLL, RA, ANCA-associated vasculitis, pemphigus vulgaris.",
        proposed_mechanism_in_case:
          "B-cell depletion addresses the autoantibody-driven component of many connective tissue diseases; well-established repurposing pathway across rheumatology.",
        evidence_level: "guideline_recommended",
        availability: "approved_my",
        est_cost_myr_monthly: [4500, 8000],
        safety_flags: [
          "Infusion reactions",
          "Hepatitis B reactivation",
          "PML risk (rare)",
          "Hypogammaglobulinaemia after repeated cycles",
        ],
        reasoning_steps: [
          "1. CD20+ B-cell depletion targets autoantibody production.",
          "2. Approved for several rheumatic indications; off-label use across many.",
          "3. Available in Malaysia; reimbursable for some indications.",
          "4. 6-month dosing interval improves adherence.",
          "5. Mandatory hepatitis B screening pre-treatment.",
        ],
        references: [
          {
            title:
              "Rituximab in autoimmune diseases: a comprehensive review",
            authors: "Kaegi C, Wuest B, Schreiner J, et al.",
            journal: "Frontiers in Immunology",
            year: 2019,
            pmid: "31616438",
            doi: "10.3389/fimmu.2019.01990",
          },
        ],
      },
    ],
  };
}

export function mockOffLabel(diffId: string): OffLabelResponse {
  const label = DIFFERENTIAL_LABELS[diffId] ?? diffId;

  if (diffId === "yamaguchi-1992") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      candidates: [
        {
          drug: "Emapalumab",
          approved_indication:
            "FDA-approved for primary haemophagocytic lymphohistiocytosis (HLH) in adult and paediatric patients.",
          off_label_use_summary:
            "Anti-IFN-γ monoclonal antibody used off-label in macrophage activation syndrome (MAS) complicating AOSD when conventional immunosuppression fails. Several case series document rapid serum IFN-γ neutralisation and hyperferritinaemia resolution.",
          case_report_count: 18,
          evidence_level: "case_series",
          pathway: {
            type: "us_expanded_access",
            notes:
              "Manufacturer (Sobi) operates an expanded-access program for life-threatening MAS; physician submits clinical summary + local IRB acknowledgement. Drug imported under MY DCA Section 21A approval after compassionate use granted.",
          },
          est_wait_weeks: [3, 6],
          est_cost_myr_per_course: [180000, 350000],
          safety_flags: [
            "Severe infection risk during IFN-γ blockade",
            "TB / fungal screening mandatory",
            "Use only in MAS, not uncomplicated AOSD",
          ],
          reasoning_steps: [
            "1. Reserve for AOSD complicated by macrophage activation syndrome.",
            "2. Sobi compassionate-use program is the access pathway.",
            "3. Concurrent HLA-B*5801 testing if allopurinol planned.",
            "4. Pair with tocilizumab or anakinra; not monotherapy.",
            "5. Cost is high but justified in life-threatening MAS.",
          ],
          references: [
            {
              title:
                "Emapalumab for the treatment of secondary haemophagocytic lymphohistiocytosis: real-world experience",
              authors: "De Benedetti F, Grom AA, Brogan PA, et al.",
              journal: "Lancet Rheumatology",
              year: 2023,
              pmid: "37598707",
              doi: "10.1016/S2665-9913(23)00131-7",
            },
          ],
        },
        {
          drug: "Tadekinig alfa (recombinant human IL-18 binding protein)",
          approved_indication:
            "Not currently approved by FDA/EMA. Orphan drug designation for NLRC4-MAS and primary HLH.",
          off_label_use_summary:
            "AOSD with refractory hyperferritinaemia is increasingly recognised as IL-18-driven; tadekinig alfa neutralises free IL-18 and shows response in adult Still's-spectrum disease in open-label studies.",
          case_report_count: 12,
          evidence_level: "phase2_trial",
          pathway: {
            type: "us_expanded_access",
            notes:
              "Manufacturer (AB2 Bio) runs named-patient compassionate use for refractory adult Still's disease. Apply via patient's primary rheumatologist; requires documented failure of IL-1 + IL-6 blockade.",
          },
          est_wait_weeks: [6, 12],
          est_cost_myr_per_course: [60000, 120000],
          safety_flags: [
            "Investigational — limited long-term safety data",
            "Inject site reactions",
            "Caution if active opportunistic infection",
          ],
          reasoning_steps: [
            "1. IL-18 elevation is a hallmark of refractory AOSD.",
            "2. Free IL-18:IL-18BP ratio correlates with disease activity.",
            "3. Tadekinig has open-label data for adult Still's-spectrum.",
            "4. Reserved for IL-1 + IL-6 refractory cases.",
            "5. Compassionate use accessible; not yet commercially available.",
          ],
          references: [
            {
              title:
                "Tadekinig alfa in adult-onset Still's disease: results of an open-label, multi-centre study",
              authors: "Gabay C, Fautrel B, Rech J, et al.",
              journal: "Annals of the Rheumatic Diseases",
              year: 2018,
              pmid: "29472362",
              doi: "10.1136/annrheumdis-2017-212608",
            },
          ],
        },
        {
          drug: "Cyclosporine A",
          approved_indication:
            "FDA-approved for organ transplant rejection prophylaxis, severe psoriasis, severe atopic dermatitis, severe RA, nephrotic syndrome.",
          off_label_use_summary:
            "Long-standing off-label use as a steroid-sparing agent in AOSD and as adjunctive therapy in MAS. Modulates T-cell IL-2 production and macrophage activation through calcineurin inhibition.",
          case_report_count: 60,
          evidence_level: "case_series",
          pathway: {
            type: "physician_off_label_prescription",
            notes:
              "Cyclosporine is registered + marketed in Malaysia for transplant indications; rheumatologists may prescribe off-label at clinician discretion. No special pathway needed.",
          },
          est_wait_weeks: [0, 1],
          est_cost_myr_per_course: [800, 1500],
          safety_flags: [
            "Nephrotoxicity — monitor creatinine",
            "Hypertension",
            "Hirsutism, gingival hyperplasia",
            "Many drug interactions via CYP3A4",
          ],
          reasoning_steps: [
            "1. Available in Malaysia; oncology/transplant pharmacies stock.",
            "2. Inexpensive vs. biologics.",
            "3. Useful as bridge therapy or in MAS combinations.",
            "4. Therapeutic drug monitoring widely available.",
            "5. Avoid if baseline renal impairment.",
          ],
          references: [
            {
              title:
                "Cyclosporine A in adult-onset Still's disease and macrophage activation syndrome: long-term outcomes",
              authors: "Mitamura M, Tada Y, Koarada S, et al.",
              journal: "Modern Rheumatology",
              year: 2009,
              pmid: "19449078",
              doi: "10.1007/s10165-009-0173-1",
            },
          ],
        },
      ],
    };
  }

  return {
    top_differential_id: diffId,
    top_differential_label: label,
    is_mock: true,
    source: "mock-up",
    candidates: [
      {
        drug: "Mycophenolate mofetil",
        approved_indication: "FDA/EMA-approved for prevention of organ transplant rejection.",
        off_label_use_summary:
          "Widely used off-label across rheumatic diseases (lupus nephritis, IIM, vasculitis, ILD) as a steroid-sparing agent. Excellent oral bioavailability and wide safety record.",
        case_report_count: 200,
        evidence_level: "guideline_recommended",
        pathway: {
          type: "physician_off_label_prescription",
          notes:
            "Available in Malaysia; widely prescribed off-label in rheumatology. No special pathway required.",
        },
        est_wait_weeks: [0, 1],
        est_cost_myr_per_course: [400, 1200],
        safety_flags: [
          "GI intolerance",
          "Cytopenias",
          "Teratogenic — strict contraception",
          "Increased infection risk",
        ],
        reasoning_steps: [
          "1. Generic available in Malaysia; very low cost.",
          "2. Strong off-label evidence base across CTD.",
          "3. Better tolerated than azathioprine for many patients.",
          "4. Pregnancy avoidance is mandatory.",
          "5. CBC + LFT monitoring monthly initially.",
        ],
        references: [
          {
            title:
              "Mycophenolate mofetil in autoimmune diseases: an evidence-based review",
            authors: "Mok CC",
            journal: "Modern Rheumatology",
            year: 2015,
            pmid: "25608861",
            doi: "10.3109/14397595.2014.989405",
          },
        ],
      },
    ],
  };
}

export function mockTrialMatch(diffId: string): TrialMatchResponse {
  const label = DIFFERENTIAL_LABELS[diffId] ?? diffId;
  const watchdog =
    "MOCK-UP — for production, this is a point-in-time snapshot; once a patient subscribes to Huantuk, the trial-matcher re-runs weekly against new postings on ClinicalTrials.gov + APLAR + jRCT/ChiCTR/CRIS/NMRR and notifies via WhatsApp when new matches appear.";

  if (diffId === "yamaguchi-1992") {
    return {
      top_differential_id: diffId,
      top_differential_label: label,
      is_mock: true,
      source: "mock-up",
      watchdog_note: watchdog,
      matches: [
        {
          trial_id: "NCT-MOCK-AOSD-001",
          registry: "ClinicalTrials.gov",
          title:
            "[MOCK] A Phase 2 Trial of IL-18 Binding Protein (Tadekinig alfa) in Refractory Adult-Onset Still's Disease",
          phase: "Phase 2",
          sponsor: "AB2 Bio Ltd (illustrative — verify on clinicaltrials.gov)",
          intervention: "Tadekinig alfa SC injection, 80 mg three times weekly",
          enrolling_status: "Recruiting",
          primary_sites: [
            { country: "Singapore", city: "Singapore General Hospital", flight_from_kl_myr_estimate: 800 },
            { country: "Japan", city: "Kyoto University Hospital", flight_from_kl_myr_estimate: 3500 },
            { country: "USA", city: "NIH Clinical Center, Bethesda", flight_from_kl_myr_estimate: 9500 },
          ],
          match_confidence: 0.78,
          inclusion_match_reasoning: [
            "1. Patient meets Yamaguchi criteria for AOSD (≥5 criteria including 2 majors).",
            "2. Documented refractoriness to IL-1 and IL-6 blockade is implied by 'standard care exhausted' framing.",
            "3. Persistent hyperferritinaemia >1,500 ng/mL meets activity threshold.",
            "4. No active malignancy or chronic infection on workup.",
          ],
          potential_exclusion_concerns: [
            "1. ECOG performance status not explicit in case — clinician to confirm ≥2.",
            "2. Renal/hepatic function — verify eGFR ≥60 and ALT <3× ULN at screening.",
            "3. Prior biologic washout requirements vary by trial — read protocol.",
          ],
        },
        {
          trial_id: "NCT-MOCK-AOSD-002",
          registry: "ClinicalTrials.gov",
          title:
            "[MOCK] A Phase 3 Open-Label Extension of Canakinumab in Adult-Onset Still's Disease (CONSIDER-AOSD-EXT)",
          phase: "Phase 3",
          sponsor: "Novartis (illustrative)",
          intervention: "Canakinumab 4 mg/kg SC every 4 weeks",
          enrolling_status: "Active, not recruiting",
          primary_sites: [
            { country: "Germany", city: "Charité — Universitätsmedizin Berlin", flight_from_kl_myr_estimate: 5500 },
          ],
          match_confidence: 0.42,
          inclusion_match_reasoning: [
            "1. Phenotype consistent with active AOSD by Yamaguchi criteria.",
            "2. Adult age range (≥18) likely met.",
          ],
          potential_exclusion_concerns: [
            "1. 'Active, not recruiting' — patient may not be enrollable now.",
            "2. Open-label extension typically restricted to prior-trial completers — check eligibility.",
          ],
        },
        {
          trial_id: "NMRR-MOCK-2026-AOSD",
          registry: "NMRR",
          title:
            "[MOCK] Pilot Registry Study of Adult-Onset Still's Disease Outcomes in Malaysia",
          phase: "Observational",
          sponsor: "Malaysian Rheumatology Society / Hospital Selayang",
          intervention: "Observational — biomarker collection + outcomes follow-up",
          enrolling_status: "Recruiting",
          primary_sites: [
            { country: "Malaysia", city: "Hospital Selayang, Selangor", flight_from_kl_myr_estimate: 0 },
            { country: "Malaysia", city: "University Malaya Medical Centre, KL", flight_from_kl_myr_estimate: 0 },
          ],
          match_confidence: 0.85,
          inclusion_match_reasoning: [
            "1. Adult patient with AOSD diagnosis by Yamaguchi criteria.",
            "2. Resident in Malaysia.",
            "3. Observational — no drug intervention required.",
          ],
          potential_exclusion_concerns: [
            "1. Confirm primary rheumatologist agreement to share outcomes data.",
          ],
        },
      ],
    };
  }

  return {
    top_differential_id: diffId,
    top_differential_label: label,
    is_mock: true,
    source: "mock-up",
    watchdog_note: watchdog,
    matches: [
      {
        trial_id: "NCT-MOCK-GENERIC-001",
        registry: "ClinicalTrials.gov",
        title: `[MOCK] Multicentre Cohort Study of ${label}`,
        phase: "Observational",
        sponsor: "Illustrative academic consortium",
        intervention: "Observational",
        enrolling_status: "Recruiting",
        primary_sites: [
          { country: "Singapore", city: "NUH Singapore", flight_from_kl_myr_estimate: 800 },
        ],
        match_confidence: 0.55,
        inclusion_match_reasoning: [
          "1. Confirmed diagnosis matches the trial's index condition.",
          "2. Adult age range likely met.",
        ],
        potential_exclusion_concerns: [
          "1. Comorbidity exclusions not yet checked against full case.",
        ],
      },
    ],
  };
}
