"use client";

import type { MimicCheckResponse, MimicHit } from "@/lib/agents/mimic-detector";

type Props = {
  status: "idle" | "loading" | "ready" | "error";
  data: MimicCheckResponse | null;
  error: string | null;
  onRun: () => void;
  hasDifferentials: boolean;
};

const CATEGORY_LABEL: Record<MimicHit["category"], string> = {
  lymphoma_hematologic: "Lymphoma / haematologic",
  infection_chronic: "Chronic infection",
  drug_reaction: "Drug reaction",
  endocrine: "Endocrine",
  autoinflammatory_genetic: "Autoinflammatory / genetic",
  metabolic_storage: "Metabolic / storage",
  neoplastic_solid: "Solid neoplasm",
  primary_immunodeficiency: "Primary immunodeficiency",
};

const CATEGORY_COLOUR: Record<MimicHit["category"], string> = {
  lymphoma_hematologic: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  infection_chronic: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  drug_reaction: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  endocrine: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  autoinflammatory_genetic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  metabolic_storage: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  neoplastic_solid: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  primary_immunodeficiency: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

export default function MimicCheckPanel({ status, data, error, onRun, hasDifferentials }: Props) {
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Mimics that get missed</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Conditions that look like the leading differential but aren&apos;t autoimmune — must be excluded before chronic immunosuppression.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={status === "loading" || !hasDifferentials}
          className="text-sm px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
        >
          {status === "loading" ? "Screening…" : status === "ready" ? "Refresh" : "Screen mimics"}
        </button>
      </header>

      {status === "idle" && !hasDifferentials && (
        <p className="text-sm text-zinc-500">Synthesise differentials first.</p>
      )}

      {status === "error" && (
        <p className="text-sm text-rose-600 dark:text-rose-400">Error: {error}</p>
      )}

      {status === "ready" && data && (
        <div>
          {data.hits.length === 0 ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {data.reassuring_note ?? "No high-priority mimics flagged given current data."}
            </p>
          ) : (
            <ol className="space-y-3">
              {data.hits.map((h, i) => (
                <li key={i} className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <h4 className="font-medium">{h.condition}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLOUR[h.category] ?? ""}`}>
                      {CATEGORY_LABEL[h.category] ?? h.category}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{h.why_consider}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {h.red_flags_in_case.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-400 mb-1">
                          Red flags in case
                        </h5>
                        <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-0.5">
                          {h.red_flags_in_case.map((f, j) => (
                            <li key={j}>· {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {h.recommended_workup.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">
                          Recommended workup
                        </h5>
                        <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-0.5">
                          {h.recommended_workup.map((f, j) => (
                            <li key={j}>· {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {h.reference && (
                    <p className="text-xs text-zinc-500 mt-3 italic leading-relaxed">
                      {h.reference.title}
                      {h.reference.year ? ` (${h.reference.year})` : ""}
                      {h.reference.pmid && (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${h.reference.pmid}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="not-italic underline hover:text-zinc-900 dark:hover:text-zinc-50"
                          >
                            PMID:{h.reference.pmid}
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
          <p className="text-xs text-zinc-400 mt-4">
            Source: {data.source === "opus-4.7" ? "Opus 4.7 mimic-detector agent" : "Deterministic fallback (no API key)"}
          </p>
        </div>
      )}
    </section>
  );
}
