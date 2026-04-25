"use client";

import { useCallback, useState } from "react";
import DropZone, { type ExtractedDoc } from "./DropZone";
import SuggestedTests from "./SuggestedTests";
import DifferentialReasoningPanel from "./DifferentialReasoning";
import CriteriaScoringPanel from "./CriteriaScoring";
import type {
  CurrentDifferential,
  SuggestResponse,
  SynthesiseResponse,
} from "@/lib/diagnostics/types";

const DEMO_FREE_TEXT = `Adult male, mid-50s, persistent quotidian fevers >2 months peaking ≥39.4°C, evanescent salmon-coloured truncal rash appearing during fever spikes and clearing within hours, polyarthralgia (wrists, knees, MCPs) without erosive change on plain films, cervical and inguinal lymphadenopathy, sore throat, and mild hepatomegaly on ultrasound. WBC 14.2×10⁹/L with 86% neutrophils. Ferritin 8,420 ng/mL with low glycosylated-ferritin fraction (~12%). ESR 92 mm/hr, CRP 88 mg/L. ANA negative. RF transiently positive at 1:80 then negative on repeat. Anti-CCP, anti-dsDNA, anti-Sm, ENA panel (SSA/SSB/RNP/Sm), ANCA (PR3/MPO), and complement (C3/C4) all unremarkable. Liver enzymes 2× ULN (AST 78, ALT 64, LDH 412). Blood cultures, EBV/CMV/parvovirus serologies, HIV and TB workup negative. Bone marrow biopsy: reactive marrow, no malignancy. Whole-body PET-CT: diffuse lymph-node uptake without dominant mass. Symptoms partially respond to NSAIDs, fully respond to prednisolone 0.5 mg/kg.`;

type SuggestStatus = "idle" | "loading" | "ready" | "error";
type SynthStatus = "idle" | "loading" | "ready" | "error";

export default function PatientAtlasShell() {
  const [docs, setDocs] = useState<ExtractedDoc[]>([]);
  const [freeText, setFreeText] = useState<string>("");

  const [synthStatus, setSynthStatus] = useState<SynthStatus>("idle");
  const [synthData, setSynthData] = useState<SynthesiseResponse | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  const [suggestStatus, setSuggestStatus] = useState<SuggestStatus>("idle");
  const [suggestData, setSuggestData] = useState<SuggestResponse | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const onDocsChange = useCallback((next: ExtractedDoc[]) => setDocs(next), []);

  const completedDocs = docs.filter((d) => d.status === "done");
  const canSynthesise = completedDocs.length > 0 || freeText.trim().length > 0;

  async function runSynthesise(textOverride?: string) {
    setSynthStatus("loading");
    setSynthError(null);
    setSuggestStatus("idle");
    setSuggestData(null);
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

  function loadDemo() {
    setFreeText(DEMO_FREE_TEXT);
    void runSynthesise(DEMO_FREE_TEXT);
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
  }

  return (
    <div className="space-y-8">
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
          <button
            onClick={loadDemo}
            disabled={synthStatus === "loading"}
            className="text-sm px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
          >
            Load demo case
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
        </>
      )}
    </div>
  );
}
