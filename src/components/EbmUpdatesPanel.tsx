"use client";

import { useEffect, useState, useRef } from "react";
import type { SynthesiseResponse } from "@/lib/diagnostics/types";
import { usePersona } from "@/lib/persona";

type EbmRecord = {
  pmid: string;
  title: string;
  authors: string;
  source: string;
  pubdate: string;
  doi?: string;
  url: string;
};

type EbmResponse = {
  query: string;
  results: EbmRecord[];
  total_count: number;
};

type Props = {
  synth: SynthesiseResponse;
  /** Threshold above which the panel auto-fetches. Default 0.85. */
  triggerThreshold?: number;
};

/**
 * Doctor-mode panel. Live-queries PubMed for the top differential's diagnosis
 * and surfaces 5–6 recent reviews / RCTs / guidelines for the clinician.
 */
export default function EbmUpdatesPanel({ synth, triggerThreshold = 0.85 }: Props) {
  const { mode } = usePersona();
  const top = synth.differentials[0];
  const topProb = top?.posterior_probability ?? 0;
  const eligible = mode === "doctor" && !!top && topProb >= triggerThreshold;

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<EbmResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!eligible || !top) return;
    if (lastQueryRef.current === top.differential_label) return;
    lastQueryRef.current = top.differential_label;

    let cancelled = false;
    setStatus("loading");
    setError(null);
    setData(null);

    fetch("/api/ebm-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagnosis_label: top.differential_label,
        max_results: 5,
      }),
    })
      .then(async (res) => {
        const json = (await res.json()) as EbmResponse | { error: string };
        if (cancelled) return;
        if (!res.ok || "error" in json) {
          throw new Error("error" in json ? json.error : `HTTP ${res.status}`);
        }
        setData(json);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [eligible, top]);

  if (!eligible || !top) return null;

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6 sm:p-7">
      <header className="mb-4">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Confidence ≥ {Math.round(triggerThreshold * 100)}% · live PubMed
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
          Latest evidence-based-medicine updates
        </h3>
        <p className="mt-2 text-sm text-stone-700 leading-relaxed max-w-prose">
          Recent reviews, RCTs and guidelines for{" "}
          <strong>{top.differential_label}</strong> from PubMed (last 18 months,
          ranked by date).
        </p>
      </header>

      {status === "loading" && (
        <p className="text-sm text-stone-600">Querying PubMed…</p>
      )}

      {status === "error" && error && (
        <p className="text-sm text-rose-700">PubMed lookup failed: {error}</p>
      )}

      {status === "ready" && data && data.results.length === 0 && (
        <p className="text-sm text-stone-600">
          No recent indexed reviews/RCTs/guidelines found. Try a related search term.
        </p>
      )}

      {status === "ready" && data && data.results.length > 0 && (
        <ol className="space-y-3">
          {data.results.map((r) => (
            <li
              key={r.pmid}
              className="rounded-md border border-stone-200 bg-white p-4 text-sm"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-stone-900 hover:text-amber-700 leading-snug"
              >
                {r.title || `PMID ${r.pmid}`}
              </a>
              <p className="mt-1 text-xs text-stone-600">
                {r.authors ? `${r.authors} · ` : ""}
                {r.source} {r.pubdate ? `· ${r.pubdate}` : ""} · PMID {r.pmid}
                {r.doi ? (
                  <>
                    {" · "}
                    <a
                      href={`https://doi.org/${r.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-amber-700 underline-offset-2 hover:underline"
                    >
                      doi:{r.doi}
                    </a>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ol>
      )}

      {status === "ready" && data && (
        <p className="mt-3 text-xs text-stone-500">
          Showing {data.results.length} of {data.total_count.toLocaleString()} matching
          articles. Source: PubMed E-utilities.
        </p>
      )}
    </section>
  );
}
