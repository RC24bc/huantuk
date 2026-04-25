"use client";

import type {
  Recommendation,
  SuggestResponse,
} from "@/lib/diagnostics/types";

type Props = {
  status: "idle" | "loading" | "ready" | "error";
  data: SuggestResponse | null;
  error: string | null;
  onRun: () => void;
  hasDifferentials: boolean;
};

const TIER_LABEL: Record<string, string> = {
  tier_1_local: "Available in KL",
  tier_2_regional: "Singapore send-out",
  tier_3_research: "Research / international",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  local_kl: "KL",
  regional_singapore: "Singapore",
  international_sendout: "Intl. send-out",
};

const DIRECTION_LABEL: Record<string, string> = {
  rules_in: "rules in",
  rules_out: "rules out",
  rules_out_mimic: "rules out mimic",
  reweights: "re-weights",
};

const DIRECTION_COLOUR: Record<string, string> = {
  rules_in: "text-emerald-700 dark:text-emerald-400",
  rules_out: "text-rose-700 dark:text-rose-400",
  rules_out_mimic: "text-rose-700 dark:text-rose-400",
  reweights: "text-amber-700 dark:text-amber-400",
};

export default function SuggestedTests({ status, data, error, onRun, hasDifferentials }: Props) {
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <header className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">What&apos;s missing</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Highest-information-gain tests not yet ordered, ranked for this case.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={status === "loading" || !hasDifferentials}
          className="text-sm px-3 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-50"
        >
          {status === "loading" ? "Reasoning…" : status === "ready" ? "Refresh" : "Suggest tests"}
        </button>
      </header>

      {status === "idle" && !hasDifferentials && (
        <p className="text-sm text-zinc-500">Score the case against classification criteria first.</p>
      )}

      {status === "error" && (
        <p className="text-sm text-rose-600 dark:text-rose-400">Error: {error}</p>
      )}

      {status === "ready" && data && (
        <div>
          {data.reasoning_summary && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 italic">
              {data.reasoning_summary}
            </p>
          )}
          <ol className="space-y-3">
            {data.recommendations.map((r) => (
              <RecommendationCard key={r.test_id} rec={r} />
            ))}
          </ol>
          <p className="text-xs text-zinc-400 mt-4">
            Source: {data.source === "opus-4.7" ? "Opus 4.7 reasoning over case + catalog" : "Deterministic fallback (no API key or Opus error)"}
          </p>
        </div>
      )}
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [lo, hi] = rec.cost_myr_range;
  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-400 text-sm tabular-nums">#{rec.rank}</span>
          <h4 className="font-medium">{rec.short_name}</h4>
        </div>
        <span className="text-xs text-zinc-500 whitespace-nowrap">
          RM{lo.toLocaleString()}–{hi.toLocaleString()} · {AVAILABILITY_LABEL[rec.availability] ?? rec.availability} · {rec.turnaround_days}d
        </span>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">{rec.rationale}</p>

      {rec.citation && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic leading-relaxed">
          <span className="not-italic font-medium text-zinc-600 dark:text-zinc-300">Evidence: </span>
          {rec.citation}
        </p>
      )}

      {rec.discriminates_for_case.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3">
          {rec.discriminates_for_case.map((d) => (
            <li
              key={d.differential_id}
              className={`text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 ${DIRECTION_COLOUR[d.direction] ?? ""}`}
            >
              {DIRECTION_LABEL[d.direction] ?? d.direction} · {d.differential_label}
            </li>
          ))}
        </ul>
      )}

      <div className="text-xs text-zinc-400 mt-2">
        {TIER_LABEL[rec.tier] ?? rec.tier} · info gain {rec.case_specific_info_gain.toFixed(2)}
      </div>
    </li>
  );
}
