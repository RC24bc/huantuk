/**
 * Demo case presets for the public Vercel deploy. Each preset:
 *  - Has a URL slug (?case=<slug>) that auto-loads + auto-runs.
 *  - Carries a hand-crafted free-text case description.
 *  - Maps to a deterministic fallback in /api/synthesise so the demo
 *    works with zero API spend.
 *
 * Add a new preset by:
 *  1. Adding to DEMO_PRESETS below
 *  2. Adding a fallback in src/lib/diagnostics/preset-fallbacks.ts
 *  3. (Optional) Adding disease-specific mocks in
 *     src/lib/agents/drug-discovery/mocks.ts
 *
 * @public
 */

export type DemoPresetId =
  | "aosd"
  | "lupus-refractory"
  | "igg4rd"
  | "undifferentiated-ctd"
  | "iim-double-msa";

export type DemoPreset = {
  id: DemoPresetId;
  label: string;
  short_label: string;
  one_line: string;
  case_text: string;
};

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: "aosd",
    label: "Adult-Onset Still's pattern",
    short_label: "Still's pattern",
    one_line: "Quotidian fevers, evanescent salmon rash, hyperferritinaemia",
    case_text: `Adult male, mid-50s, persistent quotidian fevers >2 months peaking ≥39.4°C, evanescent salmon-coloured truncal rash appearing during fever spikes and clearing within hours, polyarthralgia (wrists, knees, MCPs) without erosive change on plain films, cervical and inguinal lymphadenopathy, sore throat, and mild hepatomegaly on ultrasound. WBC 14.2×10⁹/L with 86% neutrophils. Ferritin 8,420 ng/mL with low glycosylated-ferritin fraction (~12%). ESR 92 mm/hr, CRP 88 mg/L. ANA negative. RF transiently positive at 1:80 then negative on repeat. Anti-CCP, anti-dsDNA, anti-Sm, ENA panel (SSA/SSB/RNP/Sm), ANCA (PR3/MPO), and complement (C3/C4) all unremarkable. Liver enzymes 2× ULN (AST 78, ALT 64, LDH 412). Blood cultures, EBV/CMV/parvovirus serologies, HIV and TB workup negative. Bone marrow biopsy: reactive marrow, no malignancy. Whole-body PET-CT: diffuse lymph-node uptake without dominant mass. Symptoms partially respond to NSAIDs, fully respond to prednisolone 0.5 mg/kg.`,
  },
  {
    id: "lupus-refractory",
    label: "Refractory SLE",
    short_label: "Refractory SLE",
    one_line: "Multi-organ SLE failing HCQ + MMF + cyclophosphamide",
    case_text: `Female patient, mid-30s, with biopsy-proven lupus nephritis (Class IV) and documented active SLE for 6 years. Persistent malar rash, photosensitivity, oral ulcers, non-erosive polyarthritis of MCPs/PIPs/wrists, intermittent serositis with two prior pleural effusions. Current proteinuria 1.8 g per 24 hours despite ongoing therapy, urinary RBC casts on three occasions in past 4 months, eGFR declining from 92 to 68 mL/min over 18 months. ANA 1:640 homogeneous, anti-dsDNA 380 IU/mL (rising), anti-Sm positive, anti-Ro/SSA positive, anti-Smith positive. C3 0.45 g/L (low), C4 0.07 g/L (low). Anti-cardiolipin and anti-β2-glycoprotein-I both positive on two occasions ≥12 weeks apart; lupus anticoagulant positive. Prior therapies: hydroxychloroquine 400 mg daily (6 years, ongoing), prednisolone (multiple flares, currently on 15 mg daily), mycophenolate mofetil 3 g daily (24 months, partial response, breakthrough flare), cyclophosphamide IV 6 monthly pulses (Euro-Lupus protocol, completed 12 months ago, no sustained remission). SLEDAI-2K score 18. Patient is from KL; nearest tertiary rheumatology centre is University Malaya Medical Centre. No active infection on routine workup; latent TB negative; hepatitis B sAg negative.`,
  },
  {
    id: "igg4rd",
    label: "IgG4-Related Disease pattern",
    short_label: "IgG4-RD",
    one_line: "Bilateral submandibular swelling, periorbital fullness, RPF",
    case_text: `Male patient, late 50s, with 18 months of progressive bilateral submandibular gland swelling (initially attributed to chronic sialadenitis), periorbital fullness with bilateral lacrimal gland enlargement on MRI, and an incidental retroperitoneal mass found on CT abdomen during workup for back pain — radiology reads it as soft-tissue infiltration around the abdominal aorta consistent with retroperitoneal fibrosis. Review of systems: mild dry eyes and dry mouth, no oral ulcers, no rash, no Raynaud's, no joint pain. Past medical history: type 2 diabetes for 8 years on metformin. Lab work: serum IgG total 35 g/L (elevated), IgG4 4.8 g/L (markedly elevated, normal <2.0), IgG4:total IgG ratio 13.7%, ESR 48 mm/hr, CRP 12 mg/L, complement C3/C4 normal, ANA negative, RF negative, anti-CCP negative, ANCA negative, anti-Ro/La negative. Biopsy of submandibular gland: dense lymphoplasmacytic infiltrate with storiform fibrosis, obliterative phlebitis, and IgG4+ plasma cells 65 per HPF with IgG4+/IgG ratio 60%. Serum amylase mildly elevated; pancreatic imaging shows diffuse "sausage-shaped" pancreas without focal mass. No history of malignancy. Patient has not yet started corticosteroids.`,
  },
  {
    id: "undifferentiated-ctd",
    label: "Undifferentiated CTD — 4 years, 6 specialists, no diagnosis",
    short_label: "Undifferentiated CTD",
    one_line: "Multiple specialists, multiple hospitals, still no clear diagnosis",
    case_text: `Female patient, late 40s, with 4 years of constitutional symptoms — chronic fatigue limiting work to part-time, intermittent low-grade fevers (rarely documented above 37.8°C), Raynaud's phenomenon affecting fingers in cold weather since age 42, episodic livedo reticularis on the thighs, dry eyes (Schirmer's test 4 mm at 5 minutes bilaterally), occasional dry mouth, and migratory polyarthralgia (knees, wrists, ankles, never persistent in any one joint for more than two weeks at a time, no swelling on examination by 3 different rheumatologists). No malar rash, no oral ulcers, no alopecia. Multi-hospital workup over 4 years: ANA 1:160 speckled (consistently), anti-Ro/SSA weakly positive on two occasions but negative on third confirmation panel, anti-La/SSB negative, anti-dsDNA negative, anti-Sm negative, anti-RNP negative, anti-Scl-70 negative, anti-centromere negative, anti-Jo-1 negative, ANCA negative, anti-CCP negative, RF 18 IU/mL (just above upper normal), C3/C4 normal. ESR fluctuates 20–48 mm/hr; CRP 5–14 mg/L. Full blood count, renal function, liver enzymes, thyroid function all normal. Whole-body MRI 2 years ago: no significant findings. Salivary gland biopsy not performed. Pulmonary function tests normal. Echo normal. Patient has been seen by 6 specialists across 3 hospitals (KPJ, Pantai, Sunway) — primary diagnoses offered have included "undifferentiated connective tissue disease", "fibromyalgia", "chronic fatigue syndrome", and "early Sjögren's". No specific therapy started; trial of hydroxychloroquine for 6 months produced mild symptom improvement. Patient seeks resolution.`,
  },
  {
    id: "iim-double-msa",
    label: "Real Malaysian case · Anti-NXP2 + Anti-HMGCR overlap myopathy",
    short_label: "Real case · IIM double MSA",
    one_line: "Adult male · double myositis-specific antibodies · normal CK · paraneoplastic risk",
    case_text: `Adult male, mid-60s, admitted to a Malaysian tertiary hospital with systemic inflammation requiring inpatient care; outpatient follow-up labs ~2 weeks post-discharge show partial response to inpatient therapy.

Hematology evolution (admission → 2-week outpatient follow-up):
- Haemoglobin 9.4 → 10.7 g/dL (normochromic normocytic anaemia, persistent)
- Red cell distribution width 16.1 → 19.0 % (rising — mixed marrow picture)
- White blood cell count 19.5 → 16.3 ×10⁹/L (leucocytosis, improving)
- Neutrophil absolute 15.5 → 10.9 ×10⁹/L (neutrophilia, improving)
- Eosinophil absolute 0.80 → 0.11 ×10⁹/L (peripheral eosinophilia on admission, normalised on follow-up)
- Platelets 657 → 405 ×10⁹/L (reactive thrombocytosis, resolving)
- Erythrocyte sedimentation rate 118 → 28 mm/hr (marked treatment response)

Liver function panel:
- Total protein 86 → 67 g/L
- Albumin 23 → 30 g/L (low on admission, improving)
- Globulin 63 → 37 g/L (markedly elevated polyclonal hyperglobulinaemia on admission, normalising) — albumin/globulin ratio reversal 0.37 → 0.81
- Aspartate transaminase 64 → 18 U/L
- Alanine transaminase 29 → 20 U/L
- Alkaline phosphatase 122 → 91 U/L
- Bilirubin within normal range
- Gamma-glutamyl transferase normal
- Lactate dehydrogenase 180 (normal)
- FIB-4 score 1.12 (low risk for advanced fibrosis)

Renal function:
- Sodium 134 → 141 mmol/L
- Creatinine 101 → 108 µmol/L (mild rise)
- Estimated GFR (CKD-EPI) 68 → 63 mL/min/1.73m² (CKD stage 3a)
- Glucose 5.8 → 7.7 mmol/L (impaired fasting glucose, possibly steroid-induced)
- Uric acid normal; calcium / phosphate / cholesterol within normal limits

CRITICAL INVESTIGATIONS — Inflammatory Myopathy Autoimmune Profile (18-marker panel, performed on admission):
- ANA negative; anti-double-stranded DNA <10 IU/mL (negative)
- Inflammatory Myopathy Autoimmune Profile:
  • Anti-NXP2: POSITIVE
  • Anti-HMGCR: POSITIVE
  • All other myositis-specific and myositis-associated antibodies negative — anti-Jo-1, anti-MDA5, anti-TIF1γ, anti-SAE1, anti-SRP, anti-Mi-2 (M2 alpha + M2 beta), anti-PL-7, anti-PL-12, anti-EJ, anti-OJ, anti-Ku, anti-Scl100, anti-Scl75, anti-Ro52, anti-cN-1A all negative

Creatine kinase: 46 U/L on admission, 34 U/L follow-up (NORMAL on both occasions — atypical for classical IMNM)

Infectious / hepatic exclusion: hepatitis B surface antigen non-reactive (low surface antibody — non-immune), hepatitis C antibody non-reactive, Treponema pallidum antibody non-reactive.

Tumour markers (admission): AFP <1.3 ug/L, CEA 0.6 ug/L, CA 19-9 14.4 U/mL, PSA 1.51 ng/mL — all within normal limits.

Urinalysis: protein 1+, trace glucose, urobilinogen 16.0 µmol/L (mildly elevated); no haematuria, no casts, no leukocytes, no nitrites.

Clinical context: hospital admission triggered by acute systemic-inflammatory presentation; diagnostic workup during admission identified the dual-positive myositis serology; patient improved with inpatient therapy (likely glucocorticoids and possibly IVIG, although treatment regimen is not detailed in the available labs). Most distinctive finding: dual myositis-specific antibody positivity — anti-NXP2 AND anti-HMGCR — despite normal creatine kinase. This combination is unusual and demands explanation: anti-NXP2 dermatomyositis (associated with calcinosis and 15–30% adult paraneoplastic risk), anti-HMGCR immune-mediated necrotising myopathy (often statin-triggered, CK can normalise rapidly with treatment), or co-existing dual immunology in an overlap presentation. Standard EULAR/ACR 2017 IIM classification thresholds are likely met given the autoantibody data even with currently normal CK.`,
  },
];

export function findPreset(id: string | null | undefined): DemoPreset | null {
  if (!id) return null;
  return DEMO_PRESETS.find((p) => p.id === id) ?? null;
}
