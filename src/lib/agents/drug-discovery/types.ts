/**
 * Personalized Drug Discovery — shared types for the three functions:
 *   1. Drug Repurposing
 *   2. Off-Label Indication Discovery
 *   3. Trial Matching
 *
 * @public
 */

import type { CitedReference } from "@/lib/diagnostics/types";

export type EvidenceLevel =
  | "fda_approved"
  | "guideline_recommended" // NCCN / EULAR / ACR
  | "phase3_trial"
  | "phase2_trial"
  | "phase1_trial"
  | "case_series"
  | "case_report"
  | "preclinical_only";

export type Availability =
  | "approved_my" // approved + marketed in Malaysia
  | "approved_sg" // approved Singapore — patient travels
  | "approved_intl" // FDA/EMA approved, not yet MY
  | "compassionate_use" // expanded-access pathway exists
  | "clinical_trial_only"
  | "research_use_only";

export type RepurposingCandidate = {
  drug: string;
  drug_class: string;
  approved_indication: string;
  proposed_mechanism_in_case: string;
  evidence_level: EvidenceLevel;
  availability: Availability;
  est_cost_myr_monthly?: [number, number];
  references: CitedReference[];
  safety_flags: string[];
  reasoning_steps: string[];
};

export type RepurposeResponse = {
  top_differential_id: string;
  top_differential_label: string;
  candidates: RepurposingCandidate[];
  source: "opus-4.7" | "mock-up";
  is_mock: boolean;
};

export type OffLabelCandidate = {
  drug: string;
  approved_indication: string;
  off_label_use_summary: string;
  case_report_count?: number;
  evidence_level: EvidenceLevel;
  pathway: {
    type:
      | "my_dca_compassionate"
      | "sg_hsa_special_access"
      | "us_expanded_access"
      | "eu_compassionate_use"
      | "physician_off_label_prescription";
    notes: string;
  };
  est_wait_weeks?: [number, number];
  est_cost_myr_per_course?: [number, number];
  references: CitedReference[];
  safety_flags: string[];
  reasoning_steps: string[];
};

export type OffLabelResponse = {
  top_differential_id: string;
  top_differential_label: string;
  candidates: OffLabelCandidate[];
  source: "opus-4.7" | "mock-up";
  is_mock: boolean;
};

export type TrialMatch = {
  trial_id: string; // NCT##### or local equivalent
  registry: "ClinicalTrials.gov" | "EU CTR" | "jRCT" | "ChiCTR" | "CRIS" | "NMRR" | "ANZCTR" | "CTRI";
  title: string;
  phase: "Phase 1" | "Phase 1/2" | "Phase 2" | "Phase 2/3" | "Phase 3" | "Phase 4" | "Observational";
  sponsor: string;
  intervention: string;
  enrolling_status: "Recruiting" | "Not yet recruiting" | "Active, not recruiting";
  primary_sites: { country: string; city: string; flight_from_kl_myr_estimate?: number }[];
  match_confidence: number; // 0-1
  inclusion_match_reasoning: string[];
  potential_exclusion_concerns: string[];
  contact?: { name?: string; email?: string; phone?: string };
};

export type TrialMatchResponse = {
  top_differential_id: string;
  top_differential_label: string;
  matches: TrialMatch[];
  watchdog_note: string;
  source: "opus-4.7" | "mock-up";
  is_mock: boolean;
};
