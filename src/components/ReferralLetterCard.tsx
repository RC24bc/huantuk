"use client";

import { useState, useMemo } from "react";
import type { SynthesiseResponse } from "@/lib/diagnostics/types";
import { usePersona } from "@/lib/persona";

type Props = {
  synth: SynthesiseResponse;
  caseSummary: string;
  /** Threshold above which the letter card appears. Default 0.85. */
  triggerThreshold?: number;
};

/**
 * Patient-mode card. Appears when the top differential's posterior probability
 * is high enough that the patient should bring a referral letter to a clinician.
 *
 * The letter is composed client-side from the synthesis output (no extra LLM call)
 * and downloadable as a Word-readable .doc (HTML-styled, opens cleanly in MS Word
 * and Google Docs).
 */
export default function ReferralLetterCard({
  synth,
  caseSummary,
  triggerThreshold = 0.85,
}: Props) {
  const { mode } = usePersona();
  const top = synth.differentials[0];
  const topProb = top?.posterior_probability ?? 0;
  const [recipient, setRecipient] = useState<"GP" | "Rheumatologist" | "Physician">(
    "Rheumatologist",
  );

  const letter = useMemo(
    () => composeLetter({ synth, caseSummary, recipient }),
    [synth, caseSummary, recipient],
  );

  if (mode !== "patient") return null;
  if (!top) return null;
  if (topProb < triggerThreshold) return null;

  return (
    <section className="rounded-2xl border border-rose-300 bg-rose-50/60 p-6 sm:p-7">
      <header className="mb-4">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-rose-700">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Confidence ≥ {Math.round(triggerThreshold * 100)}% · letter ready
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-stone-900">
          A letter for your doctor
        </h3>
        <p className="mt-2 text-sm text-stone-700 leading-relaxed max-w-prose">
          The leading possibility is <strong>{top.differential_label}</strong> at{" "}
          <strong>{Math.round(topProb * 100)}%</strong> confidence. This is high enough
          that you should print this letter and bring it to your next appointment.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm text-stone-700">
          Address to:
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value as typeof recipient)}
            className="ml-2 text-sm border border-stone-300 rounded-md px-2 py-1 bg-white"
          >
            <option value="Rheumatologist">Rheumatologist</option>
            <option value="GP">General Practitioner</option>
            <option value="Physician">Internal Medicine Physician</option>
          </select>
        </label>
        <button
          onClick={() => downloadDoc(letter, top.differential_label)}
          className="text-sm px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors"
        >
          Download as .doc
        </button>
        <button
          onClick={() => copyToClipboard(plainText(letter))}
          className="text-sm px-3 py-2 rounded-md text-rose-700 hover:bg-rose-100 transition-colors"
        >
          Copy text
        </button>
      </div>

      <article
        className="rounded-md border border-stone-300 bg-white p-6 sm:p-7 text-sm leading-relaxed text-stone-800"
        // The composed letter is plain HTML built from typed fields; safe.
        dangerouslySetInnerHTML={{ __html: letter }}
      />

      <p className="mt-3 text-xs text-stone-500 max-w-prose">
        This letter is a draft to bring to your doctor — not a diagnosis, not a prescription.
        Your doctor remains the prescriber.
      </p>
    </section>
  );
}

type ComposeArgs = {
  synth: SynthesiseResponse;
  caseSummary: string;
  recipient: "GP" | "Rheumatologist" | "Physician";
};

function composeLetter({ synth, caseSummary, recipient }: ComposeArgs): string {
  const top = synth.differentials[0];
  const second = synth.differentials[1];
  const today = new Date().toLocaleDateString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const probPct = top ? Math.round(top.posterior_probability * 100) : 0;

  const supporting =
    top?.supporting_findings && top.supporting_findings.length > 0
      ? `<ul style="margin:8px 0 0 18px;padding:0;">${top.supporting_findings
          .map((f) => `<li style="margin:2px 0;">${escapeHtml(f)}</li>`)
          .join("")}</ul>`
      : "";

  const criteria =
    synth.criteria_scores && synth.criteria_scores.length > 0
      ? `<p><strong>Classification criteria scoring:</strong></p>
         <ul style="margin:6px 0 0 18px;padding:0;">${synth.criteria_scores
           .slice(0, 3)
           .map(
             (c) =>
               `<li style="margin:2px 0;">${escapeHtml(c.criteria_name)} — <em>${escapeHtml(
                 c.classification_status.replace(/_/g, " "),
               )}</em> (${c.met_count}/${c.total_count} criteria met)</li>`,
           )
           .join("")}</ul>`
      : "";

  const recommended =
    synth.recommended_additional_reports && synth.recommended_additional_reports.length > 0
      ? `<p><strong>Recommended additional investigations to confirm or refute:</strong></p>
         <ul style="margin:6px 0 0 18px;padding:0;">${synth.recommended_additional_reports
           .map((r) => `<li style="margin:2px 0;">${escapeHtml(r)}</li>`)
           .join("")}</ul>`
      : "";

  const secondary = second
    ? `<p>The secondary consideration is <strong>${escapeHtml(
        second.differential_label,
      )}</strong> at ${Math.round(second.posterior_probability * 100)}%; ${escapeHtml(
        second.key_evidence,
      )}.</p>`
    : "";

  return `
<header style="margin-bottom:16px;">
  <p style="text-align:right;color:#666;margin:0;">${today}</p>
  <h2 style="margin:8px 0 4px 0;font-size:1.05rem;letter-spacing:0.04em;text-transform:uppercase;color:#444;">Referral letter — patient-prepared</h2>
  <p style="margin:0;color:#666;">Generated by Huantuk · clinical decision support · not a diagnosis</p>
</header>

<p>To the attending ${escapeHtml(recipient)},</p>

<p>I am bringing this letter on the recommendation of an AI clinical synthesis tool that has reviewed my full medical record across the hospitals I have attended. Its leading impression for my case is <strong>${escapeHtml(
    top?.differential_label ?? "—",
  )}</strong> at ${probPct}% calibrated probability.</p>

<p><strong>Case summary as understood:</strong></p>
<p style="margin:6px 0 12px 0;color:#333;">${escapeHtml(synth.narrative_summary || caseSummary || "—")}</p>

<p><strong>Why this is the leading impression:</strong></p>
<p style="margin:4px 0;">${escapeHtml(top?.key_evidence ?? "—")}</p>
${supporting}

${criteria}

${recommended}

${secondary}

<p>I would be grateful if you could review the synthesis above, decide which of the recommended investigations are appropriate, and discuss the management plan with me at the next consultation.</p>

<p style="margin-top:18px;">Thank you for your time and care.</p>

<p style="margin-top:14px;">Sincerely,</p>
<p style="margin:2px 0 0 0;color:#444;">[Patient name]</p>

<hr style="border:none;border-top:1px solid #ddd;margin:18px 0 6px 0;" />
<p style="color:#888;font-size:0.78rem;margin:0;">Drafted via Huantuk on ${today}. Synthesis source: ${
    synth.source === "opus-4.7" ? "Claude Opus 4.7" : "Deterministic fallback"
  }. This document is informational and does not replace clinical judgment.</p>
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(html: string): string {
  return html
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function downloadDoc(html: string, diagnosisLabel: string) {
  // Word recognises HTML wrapped with the right MIME headers. We use .doc rather
  // than .docx because .doc accepts HTML directly without the docx zip structure.
  const docHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Huantuk referral letter</title>
  <style>
    body { font-family: 'Calibri', 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
    h2 { font-size: 12pt; }
    p { margin: 6pt 0; }
    ul { margin: 6pt 0 6pt 18pt; padding: 0; }
    li { margin: 2pt 0; }
  </style>
</head>
<body>${html}</body>
</html>`;
  const safe = diagnosisLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const blob = new Blob([docHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `huantuk-referral-${safe}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text);
}
