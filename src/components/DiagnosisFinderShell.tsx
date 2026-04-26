"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DropZone, { type ExtractedDoc } from "./DropZone";
import SuggestedTests from "./SuggestedTests";
import DifferentialReasoningPanel from "./DifferentialReasoning";
import CriteriaScoringPanel from "./CriteriaScoring";
import MimicCheckPanel from "./MimicCheckPanel";
import FollowUpQuestions from "./FollowUpQuestions";
import MultiChoiceIntake, { type MultiChoiceAnswer } from "./MultiChoiceIntake";
import ReferralLetterCard from "./ReferralLetterCard";
import EbmUpdatesPanel from "./EbmUpdatesPanel";
import PhasedDiagnosisShell from "./PhasedDiagnosisShell";
import { DEMO_PRESETS, findPreset, type DemoPresetId } from "@/lib/diagnostics/demo-presets";
import { findScreeningBank, formatAnswersAsHistory } from "@/lib/diagnostics/screening-questions";
import { usePersona, useCopy } from "@/lib/persona";
import type {
  CurrentDifferential,
  SuggestResponse,
  SynthesiseResponse,
} from "@/lib/diagnostics/types";
import type { MimicCheckResponse } from "@/lib/agents/mimic-detector";

type Status = "idle" | "loading" | "ready" | "error";

export default function DiagnosisFinderShell() {
  const searchParams = useSearchParams();
  // Phased real-case demo (uncle-IIM) lives in its own shell — delegate
  // when the URL asks for it. All other ?case= presets stay on this shell.
  if (searchParams.get("case") === "uncle-phased") {
    return <PhasedDiagnosisShell />;
  }

  return <DiagnosisFinderShellInner />;
}

function DiagnosisFinderShellInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, jumpToCure } = usePersona();
  const copy = useCopy();

  const [docs, setDocs] = useState<ExtractedDoc[]>([]);
  const [freeText, setFreeText] = useState<string>("");

  const [synthStatus, setSynthStatus] = useState<Status>("idle");
  const [synthData, setSynthData] = useState<SynthesiseResponse | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  const [suggestStatus, setSuggestStatus] = useState<Status>("idle");
  const [suggestData, setSuggestData] = useState<SuggestResponse | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [mimicStatus, setMimicStatus] = useState<Status>("idle");
  const [mimicData, setMimicData] = useState<MimicCheckResponse | null>(null);
  const [mimicError, setMimicError] = useState<string | null>(null);

  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, MultiChoiceAnswer>>({});

  const onDocsChange = useCallback((next: ExtractedDoc[]) => setDocs(next), []);

  const completedDocs = docs.filter((d) => d.status === "done");
  const canSynthesise = completedDocs.length > 0 || freeText.trim().length > 0;

  const autoRunForPresetRef = useRef<DemoPresetId | null>(null);

  const runSynthesise = useCallback(
    async (textOverride?: string, extraContext?: string) => {
      setSynthStatus("loading");
      setSynthError(null);
      setSuggestStatus("idle");
      setSuggestData(null);
      setMimicStatus("idle");
      setMimicData(null);
      try {
        const baseText = textOverride ?? freeText.trim();
        const combined = extraContext
          ? `${baseText}\n\n--- Patient follow-up answers ---\n${extraContext}`
          : baseText;
        const res = await fetch("/api/synthesise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extracted_docs: completedDocs.map((d) => ({ filename: d.filename, extracted: d.extracted })),
            free_text_summary: combined || undefined,
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
          await runSuggest(top, [], combined || undefined);
        }
      } catch (err: unknown) {
        setSynthError(err instanceof Error ? err.message : String(err));
        setSynthStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedDocs, freeText, mode],
  );

  async function runSuggest(
    forDifferentials: CurrentDifferential[],
    forTestsDone: string[],
    forFindings?: string,
  ) {
    if (forDifferentials.length === 0) return;
    setSuggestStatus("loading");
    setSuggestError(null);
    try {
      const res = await fetch("/api/suggest-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          top_differentials: forDifferentials,
          tests_already_done: forTestsDone,
          extracted_findings_summary: forFindings,
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

  async function runMimicCheck() {
    if (!synthData || synthData.differentials.length === 0) return;
    setMimicStatus("loading");
    setMimicError(null);
    try {
      const res = await fetch("/api/mimic-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_summary: synthData.narrative_summary || freeText.trim() || undefined,
          differentials: synthData.differentials,
          register: mode,
        }),
      });
      const json = (await res.json()) as MimicCheckResponse | { error: string };
      if (!res.ok || "error" in json) {
        throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
      }
      setMimicData(json);
      setMimicStatus("ready");
    } catch (err: unknown) {
      setMimicError(err instanceof Error ? err.message : String(err));
      setMimicStatus("error");
    }
  }

  function loadPreset(id: DemoPresetId) {
    const p = findPreset(id);
    if (!p) return;
    setFreeText(p.case_text);
    setDocs([]);
    setFollowUpAnswers({});
    setScreeningAnswers({});
    autoRunForPresetRef.current = id;
    const params = new URLSearchParams(searchParams.toString());
    params.set("case", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    void runSynthesise(p.case_text);
  }

  function rerunWithScreening() {
    const presetId = searchParams.get("case");
    const bank = findScreeningBank(presetId);
    if (!bank) return;
    const formatted = formatAnswersAsHistory(bank, screeningAnswers);
    if (!formatted) return;
    void runSynthesise(undefined, formatted);
  }

  function clearAll() {
    setFreeText("");
    setDocs([]);
    setFollowUpAnswers({});
    setScreeningAnswers({});
    setSynthStatus("idle");
    setSynthData(null);
    setSynthError(null);
    setSuggestStatus("idle");
    setSuggestData(null);
    setSuggestError(null);
    setMimicStatus("idle");
    setMimicData(null);
    setMimicError(null);
    autoRunForPresetRef.current = null;
    if (searchParams.has("case")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("case");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  function rerunWithAnswers() {
    const formatted = Object.entries(followUpAnswers)
      .filter(([, v]) => v.trim().length > 0)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join("\n\n");
    if (!formatted) return;
    void runSynthesise(undefined, formatted);
  }

  // Auto-load + auto-run when ?case=… or in patient mode (preload uncle's case).
  useEffect(() => {
    const caseParam = searchParams.get("case");
    // Patient mode default = uncle's iim-double-msa preset preloaded (matches user request).
    const target = caseParam ?? (mode === "patient" ? "iim-double-msa" : null);
    if (!target) return;
    const preset = findPreset(target);
    if (!preset) return;
    if (autoRunForPresetRef.current === preset.id) return;
    autoRunForPresetRef.current = preset.id;
    setFreeText(preset.case_text);
    void runSynthesise(preset.case_text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, mode]);

  const caseSummary = synthData?.narrative_summary ?? (freeText.trim() || undefined);
  const activePresetId = searchParams.get("case");

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{copy("diagnosis.intake.h")}</h2>
        <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed max-w-prose">
          {copy("diagnosis.intake.p")}
        </p>
      </div>

      <PresetSelector
        activeId={activePresetId}
        onPick={(id) => loadPreset(id)}
        disabled={synthStatus === "loading"}
      />

      {(() => {
        const bank = findScreeningBank(activePresetId);
        if (!bank) return null;
        return (
          <MultiChoiceIntake
            bank={bank}
            answers={screeningAnswers}
            onChange={setScreeningAnswers}
            onSubmit={rerunWithScreening}
            disabled={synthStatus === "loading"}
            loading={synthStatus === "loading"}
          />
        );
      })()}

      <DropZone onDocsChange={onDocsChange} />

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <label className="block text-sm font-medium mb-2">
          {copy("diagnosis.intake.text_h")}
          <span className="text-xs font-normal text-stone-500 ml-2">
            {mode === "patient" ? "(in your own words)" : "(de-identified — labs, history, exam findings)"}
          </span>
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={5}
          placeholder={copy("diagnosis.intake.text_placeholder")}
          className="w-full text-sm rounded-md border border-stone-300 bg-transparent p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => void runSynthesise()}
            disabled={!canSynthesise || synthStatus === "loading"}
            className="text-sm px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {synthStatus === "loading" ? copy("diagnosis.intake.run_loading") : copy("diagnosis.intake.run")}
          </button>
          {(freeText.length > 0 || docs.length > 0 || synthData) && (
            <button
              onClick={clearAll}
              className="text-sm px-3 py-2 rounded-md text-stone-500 hover:text-stone-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {synthStatus === "error" && synthError && (
        <p className="text-sm text-rose-600">
          {mode === "patient" ? "Sorry — something went wrong reading your story. " : "Synthesise error: "}
          {synthError}
        </p>
      )}

      {synthStatus === "ready" && synthData && (
        <>
          {synthData.warnings && synthData.warnings.length > 0 && (
            <p className="text-sm text-amber-700">{synthData.warnings.join(" · ")}</p>
          )}
          {synthData.narrative_summary && (
            <section className="rounded-lg border border-stone-200 p-6 bg-stone-50">
              <h3 className="text-lg font-semibold tracking-tight mb-2">{copy("diagnosis.summary_h")}</h3>
              <p className="text-sm text-stone-700 leading-relaxed">{synthData.narrative_summary}</p>
              <p className="text-xs text-stone-400 mt-3">
                Source: {synthData.source === "opus-4.7" ? "Claude Opus 4.7" : "Deterministic fallback"}
              </p>
            </section>
          )}

          <DifferentialReasoningPanel differentials={synthData.differentials} />
          <CriteriaScoringPanel scores={synthData.criteria_scores} />

          <ReferralLetterCard synth={synthData} caseSummary={caseSummary ?? ""} />
          <EbmUpdatesPanel synth={synthData} />

          <MimicCheckPanel
            status={mimicStatus}
            data={mimicData}
            error={mimicError}
            onRun={() => void runMimicCheck()}
            hasDifferentials={synthData.differentials.length > 0}
          />

          <SuggestedTests
            status={suggestStatus}
            data={suggestData}
            error={suggestError}
            onRun={() => {
              const top = synthData.differentials.map((d) => ({
                differential_id: d.differential_id,
                posterior_probability: d.posterior_probability,
              }));
              void runSuggest(top, [], freeText.trim() || undefined);
            }}
            hasDifferentials={synthData.differentials.length > 0}
          />

          <FollowUpQuestions
            questions={synthData.clarifying_questions ?? []}
            recommendedReports={synthData.recommended_additional_reports ?? []}
            answers={followUpAnswers}
            onChange={setFollowUpAnswers}
            onSubmit={rerunWithAnswers}
          />

          <Handoff
            disabled={!synthData.differentials[0]}
            onJump={() => synthData && jumpToCure(synthData, caseSummary ?? "")}
          />
        </>
      )}
    </div>
  );
}

function Handoff({ disabled, onJump }: { disabled: boolean; onJump: () => void }) {
  const copy = useCopy();
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 sm:p-7">
      <h3 className="text-lg sm:text-xl font-semibold tracking-tight">{copy("diagnosis.handoff_h")}</h3>
      <p className="mt-2 text-sm sm:text-base text-stone-700 leading-relaxed max-w-prose">{copy("diagnosis.handoff_p")}</p>
      <button
        onClick={onJump}
        disabled={disabled}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium px-5 py-3 text-sm transition-colors disabled:opacity-50"
      >
        {copy("diagnosis.handoff_cta")}
      </button>
    </section>
  );
}

function PresetSelector({
  activeId,
  onPick,
  disabled,
}: {
  activeId: string | null;
  onPick: (id: DemoPresetId) => void;
  disabled?: boolean;
}) {
  const copy = useCopy();
  return (
    <section className="rounded-lg border border-stone-200 p-5 bg-stone-50">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{copy("diagnosis.intake.preset_h")}</h3>
          <p className="text-xs text-stone-500 mt-0.5">{copy("diagnosis.intake.preset_p")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DEMO_PRESETS.map((p) => {
          const isActive = activeId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              disabled={disabled}
              className={
                "text-left p-3 rounded-md border transition-colors disabled:opacity-50 bg-white " +
                (isActive
                  ? "border-stone-900"
                  : "border-stone-200 hover:border-stone-500")
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm">{p.short_label}</span>
                {isActive && <span className="text-xs text-stone-500">Active</span>}
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-snug">{p.one_line}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
