"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DifferentialReasoningPanel from "./DifferentialReasoning";
import CriteriaScoringPanel from "./CriteriaScoring";
import SuggestedTests from "./SuggestedTests";
import MultiChoiceIntake, { type MultiChoiceAnswer } from "./MultiChoiceIntake";
import ReferralLetterCard from "./ReferralLetterCard";
import { usePersona, useCopy } from "@/lib/persona";
import {
  UNCLE_PHASES,
  buildCumulativeCaseText,
  findPhase,
  type PhaseSpec,
} from "@/lib/diagnostics/uncle-phased-manifest";
import { PHASED_BANKS } from "@/lib/diagnostics/uncle-phased-questions";
import { formatAnswersAsHistory } from "@/lib/diagnostics/screening-questions";
import type {
  CurrentDifferential,
  SuggestResponse,
  SynthesiseResponse,
} from "@/lib/diagnostics/types";

type Status = "idle" | "loading" | "ready" | "error";

const FREE_TEXT_INTAKE_DEFAULT =
  "My uncle is mid-60s, Malaysian, generally well until 2 weeks ago. Now he has persistent fevers, profound fatigue, muscle pain, joint aches and loss of appetite. Just admitted to a tertiary hospital for workup. The first batch of results are below.";

export default function PhasedDiagnosisShell() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, jumpToCure } = usePersona();
  const copy = useCopy();

  // Active phase from URL (?phase=1|2|3) — defaults to 1.
  const phaseParam = searchParams.get("phase");
  const activePhase = (phaseParam === "2" || phaseParam === "3" ? Number(phaseParam) : 1) as 1 | 2 | 3;

  // Free-text intake (typed in Phase 1 only).
  const [intakeText, setIntakeText] = useState<string>(FREE_TEXT_INTAKE_DEFAULT);

  // Per-phase screening answers.
  const [phaseAnswers, setPhaseAnswers] = useState<Record<1 | 2 | 3, Record<string, MultiChoiceAnswer>>>({
    1: {},
    2: {},
    3: {},
  });

  // Synthesise + suggest state — reset on phase change.
  const [synthStatus, setSynthStatus] = useState<Status>("idle");
  const [synthData, setSynthData] = useState<SynthesiseResponse | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  const [suggestStatus, setSuggestStatus] = useState<Status>("idle");
  const [suggestData, setSuggestData] = useState<SuggestResponse | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const lastRunPhaseRef = useRef<1 | 2 | 3 | null>(null);

  const runSynthesise = useCallback(
    async (phase: 1 | 2 | 3) => {
      setSynthStatus("loading");
      setSynthError(null);
      setSuggestStatus("idle");
      setSuggestData(null);
      try {
        const cumulative = buildCumulativeCaseText(phase);
        const userIntake = intakeText.trim();
        const allAnswers = (Object.keys(phaseAnswers) as unknown as Array<1 | 2 | 3>)
          .filter((p) => p <= phase)
          .map((p) => {
            const bank = PHASED_BANKS[p];
            const formatted = formatAnswersAsHistory(bank, phaseAnswers[p]);
            return formatted ? `\n\nPhase ${p} — patient-answered history:${formatted.replace(/^[\s\S]*?-\s/, "\n- ")}` : "";
          })
          .filter(Boolean)
          .join("\n");
        const combinedText = `${cumulative}\n\n--- Family-typed intake ---\n${userIntake}${allAnswers}`;

        const res = await fetch("/api/synthesise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extracted_docs: [],
            free_text_summary: combinedText,
            register: mode,
          }),
        });
        const json = (await res.json()) as SynthesiseResponse | { error: string };
        if (!res.ok || "error" in json) {
          throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
        }
        setSynthData(json);
        setSynthStatus("ready");

        if (json.differentials.length > 0) {
          const top: CurrentDifferential[] = json.differentials.map((d) => ({
            differential_id: d.differential_id,
            posterior_probability: d.posterior_probability,
          }));
          await runSuggest(top, combinedText);
        }
      } catch (err: unknown) {
        setSynthError(err instanceof Error ? err.message : String(err));
        setSynthStatus("error");
      }
    },
    [intakeText, phaseAnswers, mode],
  );

  async function runSuggest(top: CurrentDifferential[], findings: string) {
    if (top.length === 0) return;
    setSuggestStatus("loading");
    setSuggestError(null);
    try {
      const res = await fetch("/api/suggest-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          top_differentials: top,
          tests_already_done: [],
          extracted_findings_summary: findings,
          register: mode,
        }),
      });
      const json = (await res.json()) as SuggestResponse | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
      }
      setSuggestData(json);
      setSuggestStatus("ready");
    } catch (err: unknown) {
      setSuggestError(err instanceof Error ? err.message : String(err));
      setSuggestStatus("error");
    }
  }

  // Auto-synthesise when the phase changes.
  useEffect(() => {
    if (lastRunPhaseRef.current === activePhase && synthStatus !== "idle") return;
    lastRunPhaseRef.current = activePhase;
    void runSynthesise(activePhase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhase]);

  function setPhase(next: 1 | 2 | 3) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("case", "uncle-phased");
    params.set("phase", String(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // Reset transient AI state so the user sees the new phase synthesise from scratch.
    setSynthStatus("idle");
    setSynthData(null);
    setSynthError(null);
    setSuggestStatus("idle");
    setSuggestData(null);
    setSuggestError(null);
  }

  const phaseSpec = findPhase(activePhase)!;
  const screeningBank = PHASED_BANKS[activePhase];

  const setAnswersForPhase = useCallback(
    (next: Record<string, MultiChoiceAnswer>) => {
      setPhaseAnswers((prev) => ({ ...prev, [activePhase]: next }));
    },
    [activePhase],
  );

  return (
    <div className="space-y-8">
      <PhaseStepper active={activePhase} onJump={(n) => setPhase(n)} />

      <PhaseHeader phase={phaseSpec} onResynth={() => void runSynthesise(activePhase)} loading={synthStatus === "loading"} />

      <UploadedFilesPanel phase={phaseSpec} />

      {activePhase === 1 && (
        <FreeTextIntake
          value={intakeText}
          onChange={setIntakeText}
          onResubmit={() => void runSynthesise(1)}
          loading={synthStatus === "loading"}
        />
      )}

      <MultiChoiceIntake
        bank={screeningBank}
        answers={phaseAnswers[activePhase]}
        onChange={setAnswersForPhase}
        onSubmit={() => void runSynthesise(activePhase)}
        disabled={synthStatus === "loading"}
        loading={synthStatus === "loading"}
      />

      {synthStatus === "error" && synthError && (
        <p className="text-sm text-rose-600">Synthesise error: {synthError}</p>
      )}

      {synthStatus === "ready" && synthData && (
        <>
          {synthData.warnings && synthData.warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {synthData.warnings.join(" · ")}
            </div>
          )}
          {synthData.narrative_summary && (
            <section className="rounded-lg border border-stone-200 p-6 bg-stone-50">
              <h3 className="text-lg font-semibold tracking-tight mb-2">{copy("diagnosis.summary_h")}</h3>
              <p className="text-sm text-stone-700 leading-relaxed">{synthData.narrative_summary}</p>
              <p className="text-xs text-stone-400 mt-3">
                Source: {synthData.source === "opus-4.7" ? "Claude Opus 4.7" : "Deterministic fallback (preset)"}
              </p>
            </section>
          )}

          <DifferentialReasoningPanel differentials={synthData.differentials} />
          <CriteriaScoringPanel scores={synthData.criteria_scores} />

          {(synthData.clarifying_questions?.length || synthData.recommended_additional_reports?.length) ? (
            <NextStepsPanel
              questions={synthData.clarifying_questions ?? []}
              reports={synthData.recommended_additional_reports ?? []}
              activePhase={activePhase}
            />
          ) : null}

          <SuggestedTests
            status={suggestStatus}
            data={suggestData}
            error={suggestError}
            onRun={() => {
              const top = synthData.differentials.map((d) => ({
                differential_id: d.differential_id,
                posterior_probability: d.posterior_probability,
              }));
              void runSuggest(top, intakeText);
            }}
            hasDifferentials={synthData.differentials.length > 0}
          />

          {activePhase === 3 && synthData.differentials.length > 0 && (
            <ReferralLetterCard synth={synthData} caseSummary={synthData.narrative_summary ?? ""} />
          )}

          <PhaseAdvanceCTA
            activePhase={activePhase}
            onAdvance={() => activePhase < 3 && setPhase((activePhase + 1) as 1 | 2 | 3)}
            onJumpToCure={() => synthData && jumpToCure(synthData, synthData.narrative_summary ?? "")}
          />
        </>
      )}
    </div>
  );
}

function PhaseStepper({ active, onJump }: { active: 1 | 2 | 3; onJump: (n: 1 | 2 | 3) => void }) {
  return (
    <nav aria-label="Diagnostic phases" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-500 mb-3">
        Real-case simulation - the way the uncle's diagnosis actually unfolded
      </p>
      <ol className="grid grid-cols-3 gap-3">
        {UNCLE_PHASES.map((p) => {
          const isActive = p.phase === active;
          const isPast = p.phase < active;
          return (
            <li key={p.phase}>
              <button
                onClick={() => onJump(p.phase)}
                aria-current={isActive ? "step" : undefined}
                className={
                  "w-full text-left rounded-lg border p-3 transition-colors " +
                  (isActive
                    ? "border-teal-600 bg-teal-50"
                    : isPast
                    ? "border-stone-300 bg-stone-50 hover:bg-stone-100"
                    : "border-stone-200 bg-white hover:border-stone-400")
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "inline-flex items-center justify-center size-6 rounded-full text-xs font-semibold " +
                      (isActive
                        ? "bg-teal-600 text-white"
                        : isPast
                        ? "bg-stone-400 text-white"
                        : "bg-stone-200 text-stone-700")
                    }
                  >
                    {isPast ? "✓" : p.phase}
                  </span>
                  <span className="text-sm font-medium text-stone-900">{p.title}</span>
                </div>
                <p className="text-xs text-stone-500 mt-1.5 leading-snug line-clamp-2">{p.headline}</p>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PhaseHeader({ phase, onResynth, loading }: { phase: PhaseSpec; onResynth: () => void; loading: boolean }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{phase.title}</h2>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">{phase.headline}</p>
        </div>
        <button
          onClick={onResynth}
          disabled={loading}
          className="text-sm px-3 py-2 rounded-md border border-stone-300 hover:bg-stone-100 disabled:opacity-50"
        >
          {loading ? "Re-running…" : "Re-run synthesis"}
        </button>
      </div>
    </section>
  );
}

function UploadedFilesPanel({ phase }: { phase: PhaseSpec }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <header className="mb-3">
        <h3 className="text-base font-semibold tracking-tight">Reports uploaded in this phase</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Click any report to view the redacted PDF (patient name + IC blanked - safe to share).
        </p>
      </header>
      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 overflow-hidden">
        {phase.documents.map((d, i) => (
          <li key={i} className="flex items-start gap-3 p-3 sm:p-4 bg-stone-50/40">
            <span className="inline-flex items-center justify-center size-7 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold shrink-0 mt-0.5">
              ✓
            </span>
            <div className="flex-1 min-w-0">
              <a
                href={d.publicPath}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-stone-900 hover:text-teal-700 underline-offset-2 hover:underline"
              >
                {d.filename}
              </a>
              <p className="text-xs text-stone-500 mt-0.5 leading-snug">{d.oneline}</p>
            </div>
            <span className="text-xs text-stone-400 shrink-0 self-center">PDF</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FreeTextIntake({
  value,
  onChange,
  onResubmit,
  loading,
}: {
  value: string;
  onChange: (s: string) => void;
  onResubmit: () => void;
  loading: boolean;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <header className="mb-3">
        <h3 className="text-base font-semibold tracking-tight">Initial clinical history</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Edit if needed - this is the free-text the family / referring doctor would type.
        </p>
      </header>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full text-sm rounded-md border border-stone-300 bg-transparent p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-500"
      />
      <div className="mt-3">
        <button
          onClick={onResubmit}
          disabled={loading}
          className="text-sm px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-700 text-white disabled:opacity-50"
        >
          {loading ? "Re-running…" : "Re-run with this history"}
        </button>
      </div>
    </section>
  );
}

function NextStepsPanel({
  questions,
  reports,
  activePhase,
}: {
  questions: string[];
  reports: string[];
  activePhase: 1 | 2 | 3;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
      <header className="mb-3">
        <h3 className="text-base font-semibold tracking-tight">What the AI wants next</h3>
        <p className="text-xs text-stone-600 mt-0.5">
          Two outputs end every phase: clarifying clinical-history questions, and the recommended additional reports.
        </p>
      </header>
      {questions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-700 mb-2">
            Clarifying questions ({activePhase < 3 ? "answered next phase" : "for the rheumatology team"})
          </h4>
          <ul className="space-y-1.5">
            {questions.map((q, i) => (
              <li key={i} className="text-sm text-stone-700 leading-relaxed">
                <span className="text-stone-400 mr-1">{i + 1}.</span> {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {reports.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-700 mb-2">
            Recommended additional reports
          </h4>
          <ul className="space-y-1.5">
            {reports.map((r, i) => (
              <li key={i} className="text-sm text-stone-700 leading-relaxed">
                <span className="text-amber-700 mr-1">→</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PhaseAdvanceCTA({
  activePhase,
  onAdvance,
  onJumpToCure,
}: {
  activePhase: 1 | 2 | 3;
  onAdvance: () => void;
  onJumpToCure: () => void;
}) {
  if (activePhase < 3) {
    return (
      <section className="rounded-2xl border-2 border-teal-300 bg-teal-50/70 p-6 text-center">
        <h3 className="text-lg font-semibold text-stone-900">
          Ready for the next batch of reports?
        </h3>
        <p className="mt-2 text-sm text-stone-600 max-w-prose mx-auto">
          Phase {activePhase} done. Click below to upload the {activePhase === 1 ? "chemistry, ANA, tumour-marker" : "definitive myositis panel + biopsy + follow-up"} reports and answer Phase {activePhase + 1} clinical-history questions.
        </p>
        <button
          onClick={onAdvance}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2.5 text-sm transition-colors"
        >
          Advance to Phase {activePhase + 1} of 3
          <span aria-hidden>→</span>
        </button>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-6">
      <h3 className="text-lg font-semibold text-stone-900">Diagnosis derived. Now what?</h3>
      <p className="mt-2 text-sm text-stone-700 leading-relaxed">
        The phased workflow is complete. The referral letter above summarises the case for the receiving rheumatologist. If standard care fails or the family wants to pre-empt with drug-discovery research, switch to Workflow 2.
      </p>
      <button
        onClick={onJumpToCure}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium px-5 py-2.5 text-sm transition-colors"
      >
        Continue to Workflow 2 — Drug Discovery →
      </button>
    </section>
  );
}
