"use client";

import type { CriteriaScore } from "@/lib/diagnostics/types";
import { CitationLine } from "./DifferentialReasoning";

type Props = {
  scores: CriteriaScore[];
};

const STATUS_LABEL: Record<CriteriaScore["classification_status"], string> = {
  meets: "Meets criteria",
  does_not_meet: "Does not meet",
  borderline: "Borderline",
  insufficient_data: "Insufficient data",
};

const STATUS_COLOUR: Record<CriteriaScore["classification_status"], string> = {
  meets: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  does_not_meet: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  borderline: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  insufficient_data: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
};

const ITEM_DOT: Record<"met" | "unmet" | "unknown", string> = {
  met: "text-emerald-600 dark:text-emerald-400",
  unmet: "text-rose-600 dark:text-rose-400",
  unknown: "text-zinc-400 dark:text-zinc-600",
};

const ITEM_GLYPH: Record<"met" | "unmet" | "unknown", string> = {
  met: "✓",
  unmet: "✗",
  unknown: "?",
};

export default function CriteriaScoringPanel({ scores }: Props) {
  if (scores.length === 0) return null;
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight">Classification criteria</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Each disease scored against its published classification criteria — every criterion shown so the clinician can audit. Citations link to the source paper.
        </p>
      </header>
      <div className="space-y-4">
        {scores.map((s) => (
          <CriteriaCard key={s.criteria_id} s={s} />
        ))}
      </div>
    </section>
  );
}

function CriteriaCard({ s }: { s: CriteriaScore }) {
  return (
    <details className="rounded-md border border-zinc-200 dark:border-zinc-800" open>
      <summary className="cursor-pointer list-none p-4 flex items-baseline justify-between gap-3">
        <div>
          <h4 className="font-medium">{s.criteria_name}</h4>
          {s.citation && (
            <p className="text-xs text-zinc-500 mt-0.5">{s.citation}</p>
          )}
        </div>
        <span className="flex items-baseline gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOUR[s.classification_status]}`}>
            {STATUS_LABEL[s.classification_status]}
          </span>
          <span className="text-xs tabular-nums text-zinc-500">
            {s.met_count}/{s.total_count} met
          </span>
        </span>
      </summary>
      <div className="px-4 pb-4">
        {s.classification_rule && (
          <p className="text-xs italic text-zinc-500 mb-3">Rule: {s.classification_rule}</p>
        )}
        <ul className="space-y-1">
          {s.criteria.map((c) => (
            <li key={c.criterion_id} className="flex gap-2 text-sm leading-relaxed">
              <span className={`font-mono ${ITEM_DOT[c.status]} shrink-0 w-4`}>
                {ITEM_GLYPH[c.status]}
              </span>
              <span className="flex-1">
                <span className="text-zinc-700 dark:text-zinc-300">{c.label}</span>
                {c.evidence && c.status === "met" && (
                  <span className="block text-xs text-zinc-500 italic mt-0.5">{c.evidence}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {s.references.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
              References
            </h5>
            <ul className="space-y-1.5">
              {s.references.map((r, i) => (
                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <CitationLine c={r} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
