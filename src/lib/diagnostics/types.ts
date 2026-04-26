export type Direction = "rules_in" | "rules_out" | "rules_out_mimic" | "reweights";

export type Discriminator = {
  differential_id: string;
  info_gain: number;
  direction: Direction;
};

export type TestEntry = {
  id: string;
  name: string;
  short_name: string;
  category: string;
  tier: "tier_1_local" | "tier_2_regional" | "tier_3_research";
  discriminates: Discriminator[];
  triggers: string[];
  must_not_have_done?: string[];
  cost_myr_range: [number, number];
  availability: "local_kl" | "regional_singapore" | "international_sendout";
  turnaround_days: string;
  rationale: string;
  citation: string;
  purpose?: "diagnosis" | "treatment_safety";
};

export type TestCatalog = {
  schema_version: string;
  differentials_index: Record<string, string>;
  tiers: Record<string, string>;
  tests: TestEntry[];
};

export type CurrentDifferential = {
  differential_id: string;
  posterior_probability: number;
};

export type SuggestRequest = {
  extracted_findings_summary?: string;
  top_differentials: CurrentDifferential[];
  tests_already_done?: string[];
};

export type Recommendation = {
  test_id: string;
  short_name: string;
  rank: number;
  case_specific_info_gain: number;
  discriminates_for_case: { differential_id: string; differential_label: string; direction: Direction }[];
  rationale: string;
  citation: string;
  cost_myr_range: [number, number];
  availability: TestEntry["availability"];
  turnaround_days: string;
  tier: TestEntry["tier"];
};

export type CitedReference = {
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
  why_it_matters?: string;
};

export type DifferentialReasoning = {
  differential_id: string;
  differential_label: string;
  posterior_probability: number;
  key_evidence: string;
  supporting_findings: string[];
  contradicting_findings: string[];
  citations: CitedReference[];
};

export type CriterionResult = {
  criterion_id: string;
  label: string;
  status: "met" | "unmet" | "unknown";
  evidence?: string;
};

export type CriteriaScore = {
  criteria_id: string;
  criteria_name: string;
  citation: string;
  met_count: number;
  total_count: number;
  classification_rule: string;
  classification_status: "meets" | "does_not_meet" | "borderline" | "insufficient_data";
  criteria: CriterionResult[];
  references: CitedReference[];
};

export type SynthesiseRequest = {
  extracted_docs: { filename: string; extracted: unknown }[];
  free_text_summary?: string;
  register?: "doctor" | "patient";
};

export type SynthesiseResponse = {
  narrative_summary: string;
  differentials: DifferentialReasoning[];
  criteria_scores: CriteriaScore[];
  clarifying_questions?: string[];
  recommended_additional_reports?: string[];
  source: "opus-4.7" | "deterministic-fallback";
  warnings?: string[];
};

export type SuggestResponse = {
  recommendations: Recommendation[];
  reasoning_summary: string;
  source: "opus-4.7" | "deterministic-fallback";
};
