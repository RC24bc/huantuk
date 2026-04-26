/**
 * Three banks of multi-choice clinical-history questions, one per phase
 * of the uncle-IIM demo. The questions get progressively more targeted as
 * earlier phases narrow the differential.
 *
 * Same a / b / c / d shape as screening-questions.ts so MultiChoiceIntake.tsx
 * renders them unchanged.
 */
import type { ScreeningBank } from "./screening-questions";

const PHASE1_QUESTIONS = [
  {
    id: "onset_pattern",
    text: "How did the illness start?",
    options: [
      { id: "abrupt", label: "Abruptly over days, with high fevers" },
      { id: "subacute", label: "Subacutely over 1-3 weeks (fevers, fatigue, weight loss)" },
      { id: "chronic", label: "Chronically over months (slowly worsening)" },
      { id: "relapsing", label: "Relapsing-remitting episodes over a year or more" },
    ],
  },
  {
    id: "muscle_function",
    text: "Has there been any change in muscle strength or function?",
    options: [
      { id: "proximal_weak", label: "Yes - hard to climb stairs, comb hair, get out of a chair" },
      { id: "distal_weak", label: "Yes - hand grip / foot drop / fine-motor weakness" },
      { id: "swallow_weak", label: "Yes - difficulty swallowing or hoarse voice" },
      { id: "no_weakness", label: "No obvious weakness, just fatigue and aches" },
    ],
  },
  {
    id: "skin_findings",
    text: "Any rashes or skin changes the family has noticed?",
    options: [
      { id: "knuckle_papules", label: "Reddish bumps over the knuckles or finger joints" },
      { id: "facial_violet", label: "Purplish discolouration around the eyelids" },
      { id: "shawl_chest", label: "Reddish patches on the upper chest, neck or shoulders" },
      { id: "no_rash", label: "No specific rash" },
    ],
  },
  {
    id: "fever_pattern",
    text: "How does the fever behave?",
    options: [
      { id: "quotidian", label: "One spike a day, returns to normal between" },
      { id: "continuous", label: "Persistent low-grade, never fully resolves" },
      { id: "intermittent", label: "On-and-off, irregular pattern" },
      { id: "no_fever", label: "No real fevers, just feeling unwell" },
    ],
  },
  {
    id: "exposures_meds",
    text: "Any recent medications, exposures or travel?",
    options: [
      { id: "statin", label: "Recently started or long-term statin (cholesterol drug)" },
      { id: "new_meds", label: "Other new medications in the last 6 months" },
      { id: "tb_contact", label: "Travel to / contact with TB-endemic area" },
      { id: "none_relevant", label: "None of the above" },
    ],
  },
];

const PHASE2_QUESTIONS = [
  {
    id: "swallow_breath",
    text: "Any swallowing difficulty or shortness of breath developing?",
    options: [
      { id: "dysphagia_only", label: "Difficulty swallowing solids or liquids" },
      { id: "dyspnea_only", label: "New shortness of breath on exertion" },
      { id: "both", label: "Both swallowing AND breathing problems" },
      { id: "neither", label: "Neither" },
    ],
  },
  {
    id: "ck_history",
    text: "Has creatine kinase (CK) ever been elevated on any earlier test?",
    options: [
      { id: "high_now_normal", label: "Yes - it was high before but is normal now" },
      { id: "always_normal", label: "Always normal on every test we have seen" },
      { id: "never_done", label: "Don't think it has ever been measured" },
      { id: "very_high_now", label: "Very high right now (>10x normal)" },
    ],
  },
  {
    id: "raynauds",
    text: "Do the fingers or toes change colour in the cold (white -> blue -> red)?",
    options: [
      { id: "yes_classic", label: "Yes, classical triphasic colour change" },
      { id: "yes_pale_only", label: "Just pale / cold, no triphasic colour" },
      { id: "no", label: "No" },
      { id: "not_sure", label: "Not sure" },
    ],
  },
  {
    id: "cancer_history",
    text: "Any prior cancer, current cancer screening, or weight loss?",
    options: [
      { id: "prior_cancer", label: "Yes, prior cancer history (treated)" },
      { id: "screening_due", label: "Age-appropriate screening overdue" },
      { id: "weight_loss", label: "Significant unintentional weight loss in last 6 months" },
      { id: "none", label: "None of the above" },
    ],
  },
  {
    id: "calcinosis",
    text: "Any hard lumps under the skin or skin ulcers over pressure points?",
    options: [
      { id: "calcinosis_present", label: "Yes - hard calcium-feeling lumps" },
      { id: "ulcers_only", label: "Skin ulcers, but no hard lumps" },
      { id: "neither", label: "Neither" },
      { id: "not_examined", label: "Not specifically examined" },
    ],
  },
];

const PHASE3_QUESTIONS = [
  {
    id: "treatment_response",
    text: "Has there been a clear response to corticosteroid therapy in hospital?",
    options: [
      { id: "rapid_response", label: "Yes - rapid improvement within days" },
      { id: "partial_slow", label: "Partial / slow response over 1-2 weeks" },
      { id: "no_response", label: "No clear response yet" },
      { id: "not_sure", label: "Not sure - hospital course was mixed" },
    ],
  },
  {
    id: "biopsy_done",
    text: "Has a muscle biopsy been performed or planned?",
    options: [
      { id: "done_imnm", label: "Yes - showed necrotising myopathy (IMNM features)" },
      { id: "done_dm", label: "Yes - showed dermatomyositis features (perifascicular atrophy)" },
      { id: "not_done", label: "Not done yet" },
      { id: "planned", label: "Planned for the next admission" },
    ],
  },
  {
    id: "pet_imaging",
    text: "Has whole-body imaging (PET-CT or CT chest/abdomen/pelvis) been done given the cancer-association risk?",
    options: [
      { id: "pet_done_clear", label: "Yes - PET / CT done, no malignancy seen" },
      { id: "ct_done_clear", label: "CT done, no malignancy seen" },
      { id: "not_done", label: "Not yet done" },
      { id: "abnormal_finding", label: "Done - abnormal finding being worked up" },
    ],
  },
  {
    id: "ild_screen",
    text: "Has interstitial lung disease been screened for (HRCT chest, lung function tests)?",
    options: [
      { id: "hrct_normal", label: "HRCT chest done - no ILD" },
      { id: "hrct_changes", label: "HRCT chest done - some ILD changes seen" },
      { id: "not_done", label: "Not done yet" },
      { id: "pft_only", label: "Lung function tests only, no HRCT" },
    ],
  },
  {
    id: "next_steps_concern",
    text: "What is the family's biggest concern right now?",
    options: [
      { id: "missed_cancer", label: "Whether an underlying cancer might be missed" },
      { id: "treatment_long", label: "Long-term treatment plan and side effects" },
      { id: "recurrence", label: "Risk of relapse after stopping steroids" },
      { id: "second_opinion", label: "Whether to seek a second rheumatology opinion" },
    ],
  },
];

export const PHASED_BANKS: Record<1 | 2 | 3, ScreeningBank> = {
  1: {
    preset_id: "iim-double-msa",
    preset_label: "Phase 1 history - admission week",
    intro:
      "Five quick clinical-history questions to focus the differential after the first batch of reports. Click a / b / c / d - or write in your own answer at the bottom.",
    questions: PHASE1_QUESTIONS,
  },
  2: {
    preset_id: "iim-double-msa",
    preset_label: "Phase 2 history - mid-workup",
    intro:
      "Now that the first chemistry, ANA and tumour-marker results are back, five more targeted questions to narrow the differential further.",
    questions: PHASE2_QUESTIONS,
  },
  3: {
    preset_id: "iim-double-msa",
    preset_label: "Phase 3 history - definitive workup",
    intro:
      "The myositis-specific antibody panel + biopsy + follow-up labs are in. Five final questions to lock the diagnosis and shape the management plan.",
    questions: PHASE3_QUESTIONS,
  },
};
