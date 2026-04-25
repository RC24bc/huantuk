"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DropZone, { type ExtractedDoc } from "./DropZone";
import SuggestedTests from "./SuggestedTests";
import DifferentialReasoningPanel from "./DifferentialReasoning";
import CriteriaScoringPanel from "./CriteriaScoring";
import MimicCheckPanel from "./MimicCheckPanel";
import DrugDiscoveryPanel from "./DrugDiscoveryPanel";
import { DEMO_PRESETS, findPreset, type DemoPresetId } from "@/lib/diagnostics/demo-presets";
import type {
  CurrentDifferential,
  SuggestResponse,
  SynthesiseResponse,
} from "@/lib/diagnostics/types";
import type { MimicCheckResponse } from "@/lib/agents/mimic-detector";

type Status = "idle" | "loading" | "ready" | "error";

export default function PatientAtlasShell() {
  return (
    <Suspense fallback={null}>
      <PatientAtlasShellInner />
    </Suspense>
  );
}

function PatientAtlasShellInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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

  const onDocsChange = useCallback((next: ExtractedDoc[]) => setDocs(next), []);

  const completedDocs = docs.filter((d) => d.status === "done");
  const canSynthesise = completedDocs.length > 0 || freeText.trim().length > 0;

  // Track which preset we already auto-ran so back/forward navigation doesn't double-run.
  const autoRunForPresetRef = useRef<DemoPresetId | null>(null);

  async function runSynthesise(textOverride?: string) {
    setSynthStatus("loading");
    setSynthError(null);
    setSuggestStatus("idle");
    setSuggestData(null);
    setMimicStatus("idle");
    setMimicData(null);
    try {
      const res = await fetch("/api/synthesise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted_docs: completedDocs.map((d) => ({ filename: d.filename, extracted: d.extracted })),
          free_text_summary: textOverride ?? freeText.trim() ? (textOverride ?? freeText.trim()) : undefined,
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
        await runSuggest(top, [], textOverride ?? freeText.trim() ?? undefined);
      }
    } catch (err: unknown) {
      setSynthError(err instanceof Error ? err.message : String(err));
      setSynthStatus("error");
    }
  }

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

  function loadPreset(id: DemoPresetId, opts?: { updateUrl?: boolean }) {
    const p = findPreset(id);
    if (!p) return;
    setFreeText(p.case_text);
    setDocs([]);
    autoRunForPresetRef.current = id;
    if (opts?.updateUrl !== false) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("case", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    void runSynthesise(p.case_text);
  }

  function clearAll() {
    setFreeText("");
    setDocs([]);
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

  // Auto-load + auto-run when a `?case=…` preset is in the URL.
  useEffect(() => {
    const caseParam = searchParams.get("case");
    if (!caseParam) return;
    const preset = findPreset(caseParam);
    if (!preset) return;
    if (autoRunForPresetRef.current === preset.id) return;
    autoRunForPresetRef.current = preset.id;
    setFreeText(preset.case_text);
    void runSynthesise(preset.case_text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const topDifferential = synthData?.differentials?.[0] ?? null;
  const caseSummary = synthData?.narrative_summary ?? (freeText.trim() || undefined);
  const activePresetId = searchParams.get("case");

  return (
    <div className="space-y-8">
      <PresetSelector
        activeId={activePresetId}
        onPick={(id) => loadPreset(id)}
        disabled={synthStatus === "loading"}
      />

      <DropZone onDocsChange={onDocsChange} />

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
        <label className="block text-sm font-medium mb-2">
          Or paste a case summary
          <span className="text-xs font-normal text-zinc-500 ml-2">
            (de-identified — labs, history, exam findings)
          </span>
        </label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={5}
          placeholder="e.g. 56-year-old male, persistent fevers, evanescent rash on trunk during spikes, ferritin 8420, RF and ANA negative…"
          className="w-full text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => void runSynthesise()}
            disabled={!canSynthesise || synthStatus === "loading"}
            className="text-sm px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
          >
            {synthStatus === "loading" ? "Synthesising…" : "Synthesise differentials"}
          </button>
          {(freeText.length > 0 || docs.length > 0 || synthData) && (
            <button
              onClick={clearAll}
              className="text-sm px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {synthStatus === "error" && synthError && (
        <p className="text-sm text-rose-600 dark:text-rose-400">Synthesise error: {synthError}</p>
      )}

      {synthStatus === "ready" && synthData && (
        <>
          {synthData.warnings && synthData.warnings.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {synthData.warnings.join(" · ")}
            </p>
          )}
          {synthData.narrative_summary && (
            <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-950">
              <h3 className="text-lg font-semibold tracking-tight mb-2">Case summary</h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {synthData.narrative_summary}
              </p>
              <p className="text-xs text-zinc-400 mt-3">
                Source: {synthData.source === "opus-4.7" ? "Claude Opus 4.7" : "Deterministic fallback"}
              </p>
            </section>
          )}

          <DifferentialReasoningPanel differentials={synthData.differentials} />
          <CriteriaScoringPanel scores={synthData.criteria_scores} />

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

          <DrugDiscoveryPanel
            topDifferentialId={topDifferential?.differential_id ?? null}
            topDifferentialLabel={topDifferential?.differential_label ?? null}
            caseSummary={caseSummary}
            extractedSummary={synthData.narrative_summary}
          />
        </>
      )}
    </div>
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
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Try a demo case</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            One click loads a hand-crafted case → auto-runs Diagnostic Synthesizer → exposes Drug Discovery buttons. Zero API spend; deterministic.
          </p>
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
                "text-left p-3 rounded-md border transition-colors disabled:opacity-50 " +
                (isActive
                  ? "border-zinc-900 bg-white dark:border-zinc-50 dark:bg-zinc-900"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-500 dark:hover:border-zinc-500 bg-white dark:bg-black")
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-sm">{p.short_label}</span>
                {isActive && <span className="text-xs text-zinc-500">Active</span>}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-snug">{p.one_line}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
