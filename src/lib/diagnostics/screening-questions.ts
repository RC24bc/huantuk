/**
 * Per-case-type multi-choice screening questions for the dynamic clinical-history
 * questionnaire shown at intake.
 *
 * EC's docx 2 spec: "click a) or b) or c) or others and write in" — drives the
 * top-5 differential weighting. Per docx 2 round-1 questionnaire is dynamic per
 * case-type; round-2 questionnaire (clarifying_questions) stays free-text per
 * Opus's recommendations from the synthesis step.
 *
 * Each preset's questions are tuned to its leading differential's classification
 * criteria, so EC can demonstrate "the right questions for this picture" in the
 * OBS recording.
 */
import type { DemoPresetId } from "./demo-presets";

export type ScreeningOption = {
  id: string;
  label: string;
};

export type ScreeningQuestion = {
  id: string;
  text: string;
  options: ScreeningOption[];
  /** Free-text "Other" allowed after the multi-choice options. Default true. */
  other_allowed?: boolean;
};

export type ScreeningBank = {
  preset_id: DemoPresetId;
  preset_label: string;
  intro: string;
  questions: ScreeningQuestion[];
};

const AOSD_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "fever_pattern",
    text: "How does the fever come and go?",
    options: [
      { id: "quotidian", label: "Once or twice a day, returns to normal in between" },
      { id: "continuous", label: "Constant, never fully resolves" },
      { id: "intermittent", label: "Some days yes, some days no, irregular" },
      { id: "none", label: "No fever" },
    ],
  },
  {
    id: "rash_character",
    text: "What does the rash look like?",
    options: [
      { id: "salmon_evanescent", label: "Salmon-pink, comes with fever and clears within hours" },
      { id: "purpuric", label: "Purple-red bruise-like spots, mostly on lower legs" },
      { id: "photosensitive", label: "Worse with sun exposure, on face or arms" },
      { id: "none", label: "No rash" },
    ],
  },
  {
    id: "joint_pattern",
    text: "How are the joints affected?",
    options: [
      { id: "small_polyarthralgia", label: "Many small joints (wrists, fingers), painful but no swelling" },
      { id: "large_arthritis", label: "Big joints (knees, ankles) with swelling" },
      { id: "migratory", label: "Pain moves between joints, never stays in one place long" },
      { id: "none", label: "No joint problems" },
    ],
  },
  {
    id: "sore_throat",
    text: "Have you had a sore throat that comes and goes with the fevers?",
    options: [
      { id: "yes_recurrent", label: "Yes, repeatedly" },
      { id: "yes_once", label: "Yes, once or twice" },
      { id: "no", label: "No" },
    ],
  },
  {
    id: "ferritin_known",
    text: "Has any blood test shown a very high ferritin level?",
    options: [
      { id: "yes_very_high", label: "Yes, more than 5,000 ng/mL" },
      { id: "yes_high", label: "Yes, 1,000–5,000 ng/mL" },
      { id: "yes_normal", label: "It was checked and was normal" },
      { id: "not_sure", label: "Not sure / never measured" },
    ],
  },
];

const LUPUS_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "rash_distribution",
    text: "Where on the body does the rash appear?",
    options: [
      { id: "malar_butterfly", label: "Cheeks and bridge of nose (butterfly shape)" },
      { id: "discoid", label: "Round, scaly patches that scar" },
      { id: "photosensitive", label: "Anywhere the sun hits" },
      { id: "none", label: "No rash" },
    ],
  },
  {
    id: "kidney_symptoms",
    text: "Have you had any kidney findings?",
    options: [
      { id: "protein_in_urine", label: "Protein in urine on a dipstick or 24h collection" },
      { id: "swelling", label: "Swelling around eyes or ankles" },
      { id: "biopsy_done", label: "I've had a kidney biopsy" },
      { id: "none", label: "Nothing kidney-related" },
    ],
  },
  {
    id: "treatments_tried",
    text: "Which treatments have already been tried?",
    options: [
      { id: "hcq_only", label: "Hydroxychloroquine alone" },
      { id: "hcq_plus_mmf", label: "HCQ + mycophenolate (CellCept)" },
      { id: "added_cyclo", label: "HCQ + MMF + cyclophosphamide pulses" },
      { id: "rituximab", label: "Including rituximab or belimumab" },
    ],
  },
  {
    id: "anti_dsdna",
    text: "Has anti-dsDNA been measured?",
    options: [
      { id: "high_rising", label: "High and rising over time" },
      { id: "high_stable", label: "High but stable" },
      { id: "negative", label: "Negative" },
      { id: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "antiphospholipid",
    text: "Any history of clots or pregnancy losses?",
    options: [
      { id: "yes_clot", label: "Yes, a documented clot (DVT/stroke)" },
      { id: "yes_loss", label: "Yes, a pregnancy loss" },
      { id: "antibody_only", label: "Antibody positive but no events" },
      { id: "no", label: "No" },
    ],
  },
];

const IGG4RD_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "glandular_swelling",
    text: "Have you had swelling of any glands?",
    options: [
      { id: "submandibular", label: "Under the jaw (submandibular)" },
      { id: "lacrimal", label: "Around the eyes (tear glands)" },
      { id: "parotid", label: "In front of the ears (parotid)" },
      { id: "multiple", label: "More than one of the above" },
      { id: "none", label: "No gland swelling" },
    ],
  },
  {
    id: "rpf_symptoms",
    text: "Any back, flank or abdominal symptoms?",
    options: [
      { id: "back_pain", label: "Persistent back or flank pain" },
      { id: "obstruction", label: "Symptoms of urinary obstruction (slow flow, hesitancy)" },
      { id: "incidental_mass", label: "An incidental mass on a scan around the kidneys/aorta" },
      { id: "none", label: "None" },
    ],
  },
  {
    id: "pancreas_symptoms",
    text: "Have you had pancreas-related findings?",
    options: [
      { id: "sausage_pancreas", label: 'Imaging called the pancreas "sausage-shaped" or diffusely enlarged' },
      { id: "pancreatitis", label: "An episode of pancreatitis" },
      { id: "diabetes_new", label: "New-onset diabetes" },
      { id: "none", label: "None" },
    ],
  },
  {
    id: "igg4_level",
    text: "Has serum IgG4 been measured?",
    options: [
      { id: "high", label: "Yes, elevated above normal" },
      { id: "very_high", label: "Yes, more than 2× normal" },
      { id: "normal", label: "Yes, normal" },
      { id: "not_done", label: "Not measured" },
    ],
  },
  {
    id: "biopsy_findings",
    text: "Has any tissue biopsy been done?",
    options: [
      { id: "lp_storiform", label: "Showed lymphoplasmacytic infiltrate + storiform fibrosis" },
      { id: "igg4_positive", label: "IgG4+ plasma cells counted high per HPF" },
      { id: "non_specific", label: "Non-specific inflammation only" },
      { id: "not_done", label: "No biopsy done" },
    ],
  },
];

const UNDIFF_CTD_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "raynauds",
    text: "Do your fingers turn white or blue in cold weather?",
    options: [
      { id: "yes_classic", label: "Yes, white-blue-red colour change" },
      { id: "yes_cold_only", label: "Yes, but just cold and pale, no triphasic colour" },
      { id: "no", label: "No" },
    ],
  },
  {
    id: "dry_symptoms",
    text: "Dry eyes or dry mouth?",
    options: [
      { id: "both", label: "Both, every day" },
      { id: "eyes_only", label: "Just eyes" },
      { id: "mouth_only", label: "Just mouth" },
      { id: "neither", label: "Neither" },
    ],
  },
  {
    id: "ana_pattern",
    text: "Has ANA been positive on more than one test?",
    options: [
      { id: "yes_consistent", label: "Yes, consistently" },
      { id: "yes_once", label: "Positive once, negative on repeat" },
      { id: "negative", label: "Negative" },
      { id: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "specialists_seen",
    text: "How many different doctors have seen the case?",
    options: [
      { id: "one_two", label: "One or two" },
      { id: "three_five", label: "Three to five" },
      { id: "six_plus", label: "Six or more" },
    ],
  },
  {
    id: "hcq_trial",
    text: "Has hydroxychloroquine ever been tried?",
    options: [
      { id: "yes_helped", label: "Yes — symptoms improved" },
      { id: "yes_no_effect", label: "Yes — no clear effect" },
      { id: "no", label: "Never tried" },
    ],
  },
];

const IIM_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "muscle_weakness",
    text: "Where is the weakness most noticeable?",
    options: [
      { id: "proximal", label: "Hips and shoulders (hard to climb stairs, comb hair)" },
      { id: "distal", label: "Hands and feet (hard to grip, foot drop)" },
      { id: "facial_swallow", label: "Face and swallowing" },
      { id: "none", label: "Not sure / no obvious weakness" },
    ],
  },
  {
    id: "skin_findings",
    text: "Any of these skin findings?",
    options: [
      { id: "heliotrope", label: "Purple discoloration around the eyelids" },
      { id: "gottron", label: "Reddish bumps over knuckles" },
      { id: "shawl_v", label: "Reddish rash on upper chest or back of shoulders" },
      { id: "calcinosis", label: "Hard calcium deposits under the skin" },
      { id: "none", label: "No skin findings" },
    ],
  },
  {
    id: "ck_level",
    text: "What about creatine kinase (CK), the muscle enzyme?",
    options: [
      { id: "very_high", label: "Markedly elevated (>10× normal)" },
      { id: "moderately_high", label: "Mildly to moderately elevated" },
      { id: "normal", label: "Normal" },
      { id: "not_known", label: "Not sure / not measured" },
    ],
  },
  {
    id: "lung_or_swallow",
    text: "Any lung or swallowing symptoms?",
    options: [
      { id: "ild_imaging", label: "Imaging shows interstitial lung disease (ILD)" },
      { id: "shortness_of_breath", label: "Progressive shortness of breath" },
      { id: "dysphagia", label: "Difficulty swallowing" },
      { id: "none", label: "None" },
    ],
  },
  {
    id: "msa_panel",
    text: "Has a myositis-specific antibody (MSA) panel been done?",
    options: [
      { id: "double_positive", label: "Yes, two or more antibodies positive" },
      { id: "single_positive", label: "Yes, one positive" },
      { id: "negative", label: "Yes, all negative" },
      { id: "not_done", label: "Not done" },
    ],
  },
  {
    id: "cancer_screen",
    text: "Has any cancer screening been done given paraneoplastic risk?",
    options: [
      { id: "comprehensive", label: "Yes, full age-appropriate screen + PET-CT" },
      { id: "partial", label: "Some imaging only" },
      { id: "none", label: "No cancer screening yet" },
    ],
  },
];

export const SCREENING_BANKS: ScreeningBank[] = [
  {
    preset_id: "aosd",
    preset_label: "Adult-Onset Still's pattern",
    intro: "Five quick questions about the fever, rash and joints to focus the differential.",
    questions: AOSD_QUESTIONS,
  },
  {
    preset_id: "lupus-refractory",
    preset_label: "Refractory SLE",
    intro: "Five quick questions about lupus features and what's already been tried.",
    questions: LUPUS_QUESTIONS,
  },
  {
    preset_id: "igg4rd",
    preset_label: "IgG4-RD pattern",
    intro: "Five quick questions about glands, organs and IgG4 — the IgG4-RD pattern.",
    questions: IGG4RD_QUESTIONS,
  },
  {
    preset_id: "undifferentiated-ctd",
    preset_label: "Undifferentiated CTD",
    intro: "Five quick questions for the long-undiagnosed connective-tissue picture.",
    questions: UNDIFF_CTD_QUESTIONS,
  },
  {
    preset_id: "iim-double-msa",
    preset_label: "Inflammatory myopathy with double MSA",
    intro: "Six quick questions about muscles, skin and antibodies for the myositis picture.",
    questions: IIM_QUESTIONS,
  },
];

export function findScreeningBank(presetId: string | null | undefined): ScreeningBank | undefined {
  if (!presetId) return undefined;
  return SCREENING_BANKS.find((b) => b.preset_id === presetId);
}

/**
 * Format multi-choice answers as a clinical-history paragraph that gets appended
 * to the case_text before synthesise. Skips questions left unanswered.
 */
export function formatAnswersAsHistory(
  bank: ScreeningBank,
  answers: Record<string, { option_id?: string; other_text?: string }>,
): string {
  const lines: string[] = [];
  for (const q of bank.questions) {
    const a = answers[q.id];
    if (!a) continue;
    if (a.option_id === "__other__" && a.other_text?.trim()) {
      lines.push(`- ${q.text} ${a.other_text.trim()}`);
      continue;
    }
    if (!a.option_id) continue;
    const opt = q.options.find((o) => o.id === a.option_id);
    if (!opt) continue;
    lines.push(`- ${q.text} ${opt.label}.`);
  }
  if (lines.length === 0) return "";
  return `\n\n--- Patient-answered clinical history ---\n${lines.join("\n")}`;
}
