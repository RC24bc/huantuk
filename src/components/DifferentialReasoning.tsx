"use client";

import type { CitedReference, DifferentialReasoning } from "@/lib/diagnostics/types";
import { useCopy } from "@/lib/persona";

type Props = {
  differentials: DifferentialReasoning[];
};

export default function DifferentialReasoningPanel({ differentials }: Props) {
  const copy = useCopy();
  if (differentials.length === 0) return null;
  return (
    <section className="rounded-lg border border-stone-200 p-6 bg-white">
      <header className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight">{copy("diagnosis.differentials_h")}</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">{copy("diagnosis.differentials_p")}</p>
      </header>
      <ol className="space-y-4">
        {differentials.map((d) => (
          <DifferentialCard key={d.differential_id} d={d} />
        ))}
      </ol>
    </section>
  );
}

function DifferentialCard({ d }: { d: DifferentialReasoning }) {
  const copy = useCopy();
  const pct = Math.round(d.posterior_probability * 100);
  return (
    <li className="rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h4 className="font-medium">{d.differential_label}</h4>
        <span className="text-xs tabular-nums text-zinc-500">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden mb-3">
        <div className="h-full bg-zinc-900 dark:bg-zinc-50" style={{ width: `${pct}%` }} />
      </div>
      {d.key_evidence && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{d.key_evidence}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {d.supporting_findings.length > 0 && (
          <div>
            <h5 className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-1">
              {copy("common.supports")}
            </h5>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-0.5">
              {d.supporting_findings.map((f, i) => (
                <li key={i}>· {f}</li>
              ))}
            </ul>
          </div>
        )}
        {d.contradicting_findings.length > 0 && (
          <div>
            <h5 className="text-xs font-medium uppercase tracking-wide text-rose-700 dark:text-rose-400 mb-1">
              {copy("common.contradicts")}
            </h5>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-0.5">
              {d.contradicting_findings.map((f, i) => (
                <li key={i}>· {f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {d.citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
            {copy("common.citations")}
          </h5>
          <ul className="space-y-2">
            {d.citations.map((c, i) => (
              <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <CitationLine c={c} />
                {c.why_it_matters && (
                  <span className="block text-zinc-500 dark:text-zinc-500 italic mt-0.5">
                    — {c.why_it_matters}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function CitationLine({ c }: { c: CitedReference }) {
  const head = [c.authors, c.title].filter(Boolean).join(". ");
  const tail = [
    c.journal,
    c.year ? String(c.year) : null,
    c.volume ? `vol ${c.volume}${c.issue ? "(" + c.issue + ")" : ""}` : null,
    c.pages,
  ]
    .filter(Boolean)
    .join("; ");
  const link = c.doi
    ? `https://doi.org/${c.doi}`
    : c.pmid
    ? `https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`
    : null;
  return (
    <span>
      <span className="text-zinc-700 dark:text-zinc-300">{head}</span>
      {tail && <span>. {tail}</span>}
      {link && (
        <>
          {" "}
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {c.doi ? `doi:${c.doi}` : `PMID:${c.pmid}`}
          </a>
        </>
      )}
    </span>
  );
}
