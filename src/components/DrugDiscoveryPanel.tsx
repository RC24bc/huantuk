"use client";

import { useState } from "react";
import type {
  RepurposeResponse,
  OffLabelResponse,
  TrialMatchResponse,
  EvidenceLevel,
  Availability,
  RepurposingCandidate,
  OffLabelCandidate,
  TrialMatch,
} from "@/lib/agents/drug-discovery/types";
import type { CitedReference } from "@/lib/diagnostics/types";
import { CitationLine } from "./DifferentialReasoning";
import { usePersona, useCopy } from "@/lib/persona";

type Props = {
  topDifferentialId: string | null;
  topDifferentialLabel: string | null;
  caseSummary?: string;
  extractedSummary?: string;
};

type Status = "idle" | "loading" | "ready" | "error";

const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  fda_approved: "FDA approved",
  guideline_recommended: "Guideline-recommended",
  phase3_trial: "Phase 3 trial",
  phase2_trial: "Phase 2 trial",
  phase1_trial: "Phase 1 trial",
  case_series: "Case series",
  case_report: "Case report",
  preclinical_only: "Preclinical only",
};

const EVIDENCE_COLOUR: Record<EvidenceLevel, string> = {
  fda_approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  guideline_recommended: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  phase3_trial: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  phase2_trial: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  phase1_trial: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  case_series: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  case_report: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  preclinical_only: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
};

const AVAIL_LABEL: Record<Availability, string> = {
  approved_my: "Approved in MY",
  approved_sg: "Approved in SG",
  approved_intl: "Approved overseas",
  compassionate_use: "Compassionate use",
  clinical_trial_only: "Trial only",
  research_use_only: "Research only",
};

export default function DrugDiscoveryPanel({
  topDifferentialId,
  topDifferentialLabel,
  caseSummary,
  extractedSummary,
}: Props) {
  const [repStatus, setRepStatus] = useState<Status>("idle");
  const [repData, setRepData] = useState<RepurposeResponse | null>(null);
  const [repError, setRepError] = useState<string | null>(null);

  const [offStatus, setOffStatus] = useState<Status>("idle");
  const [offData, setOffData] = useState<OffLabelResponse | null>(null);
  const [offError, setOffError] = useState<string | null>(null);

  const [trialStatus, setTrialStatus] = useState<Status>("idle");
  const [trialData, setTrialData] = useState<TrialMatchResponse | null>(null);
  const [trialError, setTrialError] = useState<string | null>(null);

  const { mode } = usePersona();
  const copy = useCopy();

  if (!topDifferentialId || !topDifferentialLabel) return null;

  const body = {
    top_differential_id: topDifferentialId,
    top_differential_label: topDifferentialLabel,
    case_summary: caseSummary ?? null,
    extracted_findings_summary: extractedSummary ?? null,
    register: mode,
  };

  async function callRoute<T>(path: string): Promise<T> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || (json && typeof json === "object" && "error" in json)) {
      throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return json as T;
  }

  async function runRepurpose() {
    setRepStatus("loading");
    setRepError(null);
    try {
      const j = await callRoute<RepurposeResponse>("/api/repurpose");
      setRepData(j);
      setRepStatus("ready");
    } catch (e: unknown) {
      setRepError(e instanceof Error ? e.message : String(e));
      setRepStatus("error");
    }
  }

  async function runOffLabel() {
    setOffStatus("loading");
    setOffError(null);
    try {
      const j = await callRoute<OffLabelResponse>("/api/off-label");
      setOffData(j);
      setOffStatus("ready");
    } catch (e: unknown) {
      setOffError(e instanceof Error ? e.message : String(e));
      setOffStatus("error");
    }
  }

  async function runTrialMatch() {
    setTrialStatus("loading");
    setTrialError(null);
    try {
      const j = await callRoute<TrialMatchResponse>("/api/trial-match");
      setTrialData(j);
      setTrialStatus("ready");
    } catch (e: unknown) {
      setTrialError(e instanceof Error ? e.message : String(e));
      setTrialStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-6">
      <header className="mb-5">
        <h3 className="text-lg font-semibold tracking-tight">
          {mode === "patient" ? "Other treatments to ask your doctor about" : "Personalized Drug Discovery"}
        </h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          {mode === "patient"
            ? "Three AI specialists look across the world's medical research. They suggest other approved drugs that might help, drugs already used 'off-label' in cases like yours, and research studies you could ask to join. Bring this list to your doctor."
            : "Three clinical research agents reason against the patient's leading differential. Live results require ANTHROPIC_API_KEY in the environment — otherwise candidates are clearly-labelled mocks for the case at hand."}
        </p>
        <p className="text-xs text-stone-500 mt-2">
          {mode === "patient" ? "Working from: " : "Top differential: "}
          <span className="font-medium text-stone-700">{topDifferentialLabel}</span>
        </p>
      </header>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={runRepurpose}
          disabled={repStatus === "loading"}
          className="text-sm px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {repStatus === "loading"
            ? mode === "patient" ? "Searching…" : "Reasoning…"
            : copy("cure.repurpose_btn")}
        </button>
        <button
          onClick={runOffLabel}
          disabled={offStatus === "loading"}
          className="text-sm px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {offStatus === "loading"
            ? mode === "patient" ? "Reading papers…" : "Mining literature…"
            : copy("cure.offlabel_btn")}
        </button>
        <button
          onClick={runTrialMatch}
          disabled={trialStatus === "loading"}
          className="text-sm px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {trialStatus === "loading"
            ? mode === "patient" ? "Finding studies…" : "Matching trials…"
            : copy("cure.trials_btn")}
        </button>
      </div>

      {repStatus === "ready" && repData && <RepurposeBlock data={repData} />}
      {repStatus === "error" && (
        <p className="text-sm text-rose-600 dark:text-rose-400 mt-4">Repurpose error: {repError}</p>
      )}

      {offStatus === "ready" && offData && <OffLabelBlock data={offData} />}
      {offStatus === "error" && (
        <p className="text-sm text-rose-600 dark:text-rose-400 mt-4">Off-label error: {offError}</p>
      )}

      {trialStatus === "ready" && trialData && <TrialMatchBlock data={trialData} />}
      {trialStatus === "error" && (
        <p className="text-sm text-rose-600 dark:text-rose-400 mt-4">Trial match error: {trialError}</p>
      )}
    </section>
  );
}

function MockBanner() {
  return (
    <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-3 py-2 mb-4">
      <p className="text-xs text-amber-900 dark:text-amber-200">
        <span className="font-semibold">MOCK-UP — for demo only.</span> Add <code className="font-mono text-[11px]">ANTHROPIC_API_KEY</code> to <code className="font-mono text-[11px]">.env.local</code> to run live Opus 4.7 reasoning.
      </p>
    </div>
  );
}

function CostRange({ range }: { range?: [number, number] }) {
  if (!range) return null;
  const [lo, hi] = range;
  return (
    <span className="text-xs text-zinc-500 whitespace-nowrap">
      RM{lo.toLocaleString()}–{hi.toLocaleString()}
    </span>
  );
}

function ReasoningSteps({ steps }: { steps: string[] }) {
  if (!steps || steps.length === 0) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
        Show reasoning steps ({steps.length})
      </summary>
      <ol className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </details>
  );
}

function CitationsBlock({ refs }: { refs: CitedReference[] }) {
  if (!refs || refs.length === 0) return null;
  return (
    <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
      <ul className="space-y-1.5">
        {refs.map((c, i) => (
          <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <CitationLine c={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SafetyFlags({ flags }: { flags: string[] }) {
  if (!flags || flags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5 mt-2">
      {flags.map((f, i) => (
        <li
          key={i}
          className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          ⚠ {f}
        </li>
      ))}
    </ul>
  );
}

function RepurposeBlock({ data }: { data: RepurposeResponse }) {
  return (
    <div className="mt-4 rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <h4 className="font-medium mb-2">Repurposing candidates · {data.top_differential_label}</h4>
      {data.is_mock && <MockBanner />}
      {data.candidates.length === 0 ? (
        <p className="text-sm text-zinc-500">No candidates returned.</p>
      ) : (
        <ol className="space-y-3">
          {data.candidates.map((c, i) => (
            <RepurposeCard key={i} c={c} rank={i + 1} />
          ))}
        </ol>
      )}
      <p className="text-xs text-zinc-400 mt-3">
        Source: {data.source === "opus-4.7" ? "Opus 4.7 — Drug-Repurposing PhD agent" : "Mock-up (Opus key not configured)"}
      </p>
    </div>
  );
}

function RepurposeCard({ c, rank }: { c: RepurposingCandidate; rank: number }) {
  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-400 text-sm tabular-nums">#{rank}</span>
          <h5 className="font-medium">{c.drug}</h5>
          <span className="text-xs text-zinc-500">· {c.drug_class}</span>
        </div>
        <CostRange range={c.est_cost_myr_monthly} />
      </div>
      <p className="text-xs text-zinc-500 mt-1">{c.approved_indication}</p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">{c.proposed_mechanism_in_case}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${EVIDENCE_COLOUR[c.evidence_level] ?? ""}`}>
          {EVIDENCE_LABEL[c.evidence_level] ?? c.evidence_level}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {AVAIL_LABEL[c.availability] ?? c.availability}
        </span>
      </div>
      <SafetyFlags flags={c.safety_flags} />
      <ReasoningSteps steps={c.reasoning_steps} />
      <CitationsBlock refs={c.references} />
    </li>
  );
}

function OffLabelBlock({ data }: { data: OffLabelResponse }) {
  return (
    <div className="mt-4 rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <h4 className="font-medium mb-2">Off-label options · {data.top_differential_label}</h4>
      {data.is_mock && <MockBanner />}
      {data.candidates.length === 0 ? (
        <p className="text-sm text-zinc-500">No candidates returned.</p>
      ) : (
        <ol className="space-y-3">
          {data.candidates.map((c, i) => (
            <OffLabelCard key={i} c={c} rank={i + 1} />
          ))}
        </ol>
      )}
      <p className="text-xs text-zinc-400 mt-3">
        Source: {data.source === "opus-4.7" ? "Opus 4.7 — Off-Label-Discovery PhD agent" : "Mock-up (Opus key not configured)"}
      </p>
    </div>
  );
}

const PATHWAY_LABEL: Record<OffLabelCandidate["pathway"]["type"], string> = {
  my_dca_compassionate: "Malaysia DCA — compassionate use",
  sg_hsa_special_access: "Singapore HSA — Special Access Route",
  us_expanded_access: "US FDA — Expanded Access",
  eu_compassionate_use: "EU — Compassionate Use",
  physician_off_label_prescription: "Physician off-label prescription",
};

function OffLabelCard({ c, rank }: { c: OffLabelCandidate; rank: number }) {
  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-400 text-sm tabular-nums">#{rank}</span>
          <h5 className="font-medium">{c.drug}</h5>
        </div>
        <CostRange range={c.est_cost_myr_per_course} />
      </div>
      <p className="text-xs text-zinc-500 mt-1">Approved for: {c.approved_indication}</p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">{c.off_label_use_summary}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${EVIDENCE_COLOUR[c.evidence_level] ?? ""}`}>
          {EVIDENCE_LABEL[c.evidence_level] ?? c.evidence_level}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
          {PATHWAY_LABEL[c.pathway.type] ?? c.pathway.type}
        </span>
        {c.case_report_count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            ~{c.case_report_count} case reports
          </span>
        )}
        {c.est_wait_weeks && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Access: {c.est_wait_weeks[0]}–{c.est_wait_weeks[1]} weeks
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 italic leading-relaxed">
        Pathway: {c.pathway.notes}
      </p>
      <SafetyFlags flags={c.safety_flags} />
      <ReasoningSteps steps={c.reasoning_steps} />
      <CitationsBlock refs={c.references} />
    </li>
  );
}

function TrialMatchBlock({ data }: { data: TrialMatchResponse }) {
  return (
    <div className="mt-4 rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <h4 className="font-medium mb-2">Trial matches · {data.top_differential_label}</h4>
      {data.is_mock && <MockBanner />}
      {data.matches.length === 0 ? (
        <p className="text-sm text-zinc-500">No active trials matched.</p>
      ) : (
        <ol className="space-y-3">
          {data.matches.map((t, i) => (
            <TrialCard key={i} t={t} rank={i + 1} />
          ))}
        </ol>
      )}
      <p className="text-xs text-zinc-500 italic mt-3 leading-relaxed">{data.watchdog_note}</p>
      <p className="text-xs text-zinc-400 mt-2">
        Source: {data.source === "opus-4.7" ? "Opus 4.7 — Trial-Matching PhD agent" : "Mock-up (Opus key not configured)"}
      </p>
    </div>
  );
}

function TrialCard({ t, rank }: { t: TrialMatch; rank: number }) {
  const pct = Math.round(t.match_confidence * 100);
  const trialUrl = t.trial_id.startsWith("NCT")
    ? `https://clinicaltrials.gov/study/${t.trial_id}`
    : null;
  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-zinc-400 text-sm tabular-nums">#{rank}</span>
          {trialUrl ? (
            <a
              href={trialUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-blue-700 dark:text-blue-400 hover:underline shrink-0"
            >
              {t.trial_id}
            </a>
          ) : (
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{t.trial_id}</span>
          )}
          <span className="text-xs text-zinc-500">· {t.registry}</span>
        </div>
        <span className="text-xs tabular-nums text-zinc-500">{pct}% match</span>
      </div>
      <h5 className="font-medium mt-1.5 leading-snug">{t.title}</h5>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          {t.phase}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {t.enrolling_status}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {t.intervention}
        </span>
      </div>
      <p className="text-xs text-zinc-500 mt-2">Sponsor: {t.sponsor}</p>
      {t.primary_sites.length > 0 && (
        <ul className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 space-y-0.5">
          {t.primary_sites.map((s, i) => (
            <li key={i}>
              · {s.city}, {s.country}
              {s.flight_from_kl_myr_estimate !== undefined && (
                <span className="text-zinc-400">
                  {" "}
                  · flight from KL ~RM{s.flight_from_kl_myr_estimate.toLocaleString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {t.inclusion_match_reasoning.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            Inclusion match reasoning ({t.inclusion_match_reasoning.length})
          </summary>
          <ol className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4">
            {t.inclusion_match_reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </details>
      )}
      {t.potential_exclusion_concerns.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-amber-700 dark:text-amber-400 hover:underline">
            Exclusion concerns to verify ({t.potential_exclusion_concerns.length})
          </summary>
          <ol className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-4">
            {t.potential_exclusion_concerns.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </details>
      )}
      {t.contact && (t.contact.email || t.contact.phone) && (
        <p className="text-xs text-zinc-500 mt-2">
          Contact:{" "}
          {t.contact.email && (
            <a href={`mailto:${t.contact.email}`} className="underline hover:text-zinc-900 dark:hover:text-zinc-50">
              {t.contact.email}
            </a>
          )}
          {t.contact.phone && <span className="ml-2">{t.contact.phone}</span>}
        </p>
      )}
    </li>
  );
}
