"use client";

import { useState } from "react";
import { usePersona, useCopy } from "@/lib/persona";
import DrugDiscoveryPanel from "./DrugDiscoveryPanel";
import { findCriteria, CRITERIA } from "@/lib/criteria";

export default function CureDiscovererShell() {
  const { carryOver, mode, setView } = usePersona();
  const copy = useCopy();

  const [manualDiagnosisId, setManualDiagnosisId] = useState<string>("");
  const [manualCaseSummary, setManualCaseSummary] = useState<string>("");

  const carryHasDx = !!carryOver.topDifferentialId;
  const manualHasDx = !!manualDiagnosisId;

  const activeId = carryHasDx ? carryOver.topDifferentialId! : manualDiagnosisId;
  const activeLabel = carryHasDx
    ? carryOver.topDifferentialLabel!
    : findCriteria(manualDiagnosisId)?.name ?? null;
  const activeCaseSummary = carryHasDx
    ? carryOver.caseSummary
    : manualCaseSummary;
  const activeExtractedSummary = carryHasDx
    ? carryOver.extractedSummary ?? null
    : null;

  const ready = !!activeId && !!activeLabel;

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
          {mode === "patient" ? "When the usual treatment didn't work" : "When CPG management has failed"}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
          {copy("cure.intro_h")}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-stone-700 leading-relaxed max-w-prose">
          {copy("cure.intro_p")}
        </p>
      </div>

      {carryHasDx ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-800">
            {copy("cure.from_dx")}
          </p>
          <p className="mt-1 text-base font-semibold text-stone-900">{carryOver.topDifferentialLabel}</p>
          <button
            onClick={() => setView("diagnosis")}
            className="mt-2 text-xs text-emerald-800 hover:text-emerald-900 underline"
          >
            ← {mode === "patient" ? "Back to my story" : "Back to Diagnosis Finder"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-stone-800">
            {mode === "patient" ? "Already know what you have? Pick it here." : "Or pick a known diagnosis directly:"}
          </h3>
          <p className="mt-1 text-xs text-stone-500 leading-relaxed">{copy("cure.no_dx")}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              value={manualDiagnosisId}
              onChange={(e) => setManualDiagnosisId(e.target.value)}
              className="text-sm rounded-md border border-stone-300 bg-white p-2.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="">{mode === "patient" ? "Pick your diagnosis…" : "Select a differential…"}</option>
              {CRITERIA.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={() => setView("diagnosis")}
              className="text-sm rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 px-3 py-2.5 text-stone-700"
            >
              {mode === "patient" ? "or — start with my story →" : "or — go to Diagnosis Finder →"}
            </button>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-900">
              {mode === "patient" ? "Add details about you (optional, makes results better)" : "Optional: paste case summary for better personalisation"}
            </summary>
            <textarea
              value={manualCaseSummary}
              onChange={(e) => setManualCaseSummary(e.target.value)}
              rows={4}
              placeholder={
                mode === "patient"
                  ? "e.g. I have lupus. I tried hydroxychloroquine for 2 years and mycophenolate for 1 year. Still flaring with kidney inflammation. I'm 34, in KL…"
                  : "e.g. SLE Class IV LN, anti-dsDNA 380 IU/mL, failed HCQ + MMF + IV cyclophosphamide. SLEDAI-2K 18. KL-based…"
              }
              className="mt-2 w-full text-sm rounded-md border border-stone-300 bg-transparent p-3 leading-relaxed focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </details>
        </div>
      )}

      {ready ? (
        <DrugDiscoveryPanel
          topDifferentialId={activeId}
          topDifferentialLabel={activeLabel}
          caseSummary={activeCaseSummary || undefined}
          extractedSummary={activeExtractedSummary ?? undefined}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <p className="text-sm text-stone-500 leading-relaxed max-w-prose mx-auto">
            {mode === "patient"
              ? "Pick your diagnosis above, or go back to the first tab and tell us your story so we can figure it out together."
              : "Pick a differential above, or run the Diagnosis Finder first to anchor on a synthesised top differential."}
          </p>
        </div>
      )}

      <p className="text-xs text-stone-500 leading-relaxed max-w-prose">{copy("cure.disclaimer")}</p>
    </div>
  );
}
