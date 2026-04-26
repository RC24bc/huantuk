"use client";

import { useCopy, usePersona } from "@/lib/persona";

type Props = {
  questions: string[];
  recommendedReports: string[];
  answers: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function FollowUpQuestions({
  questions,
  recommendedReports,
  answers,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  const copy = useCopy();
  const { mode } = usePersona();

  if (questions.length === 0 && recommendedReports.length === 0) return null;

  const anyAnswered = Object.values(answers).some((v) => v.trim().length > 0);

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/40 p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight">{copy("diagnosis.followup_h")}</h3>
        <p className="text-sm text-stone-600 mt-1 leading-relaxed">{copy("diagnosis.followup_p")}</p>
      </header>

      {questions.length > 0 && (
        <ul className="space-y-4">
          {questions.map((q, i) => (
            <li key={i}>
              <label className="block text-sm font-medium text-stone-800 mb-1.5 leading-snug">{q}</label>
              <input
                type="text"
                value={answers[q] ?? ""}
                onChange={(e) => onChange({ ...answers, [q]: e.target.value })}
                placeholder={mode === "patient" ? "Your answer (skip if you don't know)…" : "Answer or 'unknown'"}
                className="w-full text-sm rounded-md border border-stone-300 bg-white p-2.5 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </li>
          ))}
        </ul>
      )}

      {recommendedReports.length > 0 && (
        <div className="mt-5 pt-4 border-t border-blue-200">
          <h4 className="text-sm font-semibold text-stone-800">
            {mode === "patient" ? "Tests/scans that would help most:" : "Recommended additional reports:"}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {recommendedReports.map((r, i) => (
              <li key={i} className="text-sm text-stone-700 leading-relaxed flex gap-2">
                <span aria-hidden className="text-blue-600 mt-0.5">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-5">
          <button
            onClick={onSubmit}
            disabled={disabled || !anyAnswered}
            className="text-sm px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {copy("diagnosis.followup_send")}
          </button>
          {!anyAnswered && (
            <p className="text-xs text-stone-500 mt-2">
              {mode === "patient" ? "Answer at least one question above, then press the button." : "Answer at least one question to re-synthesise."}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
