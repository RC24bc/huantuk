"use client";

import { useEffect, useState } from "react";
import { useCopy, usePersona } from "@/lib/persona";
import {
  type ScreeningBank,
  type ScreeningQuestion,
} from "@/lib/diagnostics/screening-questions";

export type MultiChoiceAnswer = {
  option_id?: string;
  other_text?: string;
};

type Props = {
  bank: ScreeningBank;
  answers: Record<string, MultiChoiceAnswer>;
  onChange: (next: Record<string, MultiChoiceAnswer>) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function MultiChoiceIntake({
  bank,
  answers,
  onChange,
  onSubmit,
  disabled,
  loading,
}: Props) {
  const copy = useCopy();
  const { mode } = usePersona();

  // Reset answers if bank changes (different preset loaded).
  // The parent owns state, so we just clear it once on bank change.
  useEffect(() => {
    onChange({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank.preset_id]);

  const answeredCount = Object.values(answers).filter(
    (a) => a.option_id && (a.option_id !== "__other__" || (a.other_text ?? "").trim().length > 0),
  ).length;
  const allAnswered = answeredCount === bank.questions.length;

  function setAnswer(qid: string, next: MultiChoiceAnswer) {
    onChange({ ...answers, [qid]: next });
  }

  const heading =
    mode === "patient"
      ? "Quick clinical history — five questions"
      : "Targeted clinical-history screen";

  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50/40 p-5 sm:p-6">
      <header className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-stone-900">{heading}</h3>
        <p className="text-sm text-stone-600 mt-1 leading-relaxed">{bank.intro}</p>
        <p className="text-xs text-stone-500 mt-2">
          {answeredCount} of {bank.questions.length} answered
        </p>
      </header>

      <ol className="space-y-5">
        {bank.questions.map((q, idx) => (
          <QuestionRow
            key={q.id}
            index={idx + 1}
            question={q}
            answer={answers[q.id]}
            onChange={(next) => setAnswer(q.id, next)}
          />
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={disabled || loading || answeredCount === 0}
          className="text-sm px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {loading
            ? copy("diagnosis.intake.run_loading")
            : mode === "patient"
              ? "Read my reports with these answers"
              : "Synthesise with screening answers"}
        </button>
        {answeredCount > 0 && answeredCount < bank.questions.length && (
          <span className="text-xs text-stone-500">
            {bank.questions.length - answeredCount} unanswered — that's fine, partial answers help.
          </span>
        )}
        {allAnswered && (
          <span className="text-xs text-teal-700 font-medium">All answered ✓</span>
        )}
      </div>
    </section>
  );
}

function QuestionRow({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: ScreeningQuestion;
  answer?: MultiChoiceAnswer;
  onChange: (next: MultiChoiceAnswer) => void;
}) {
  const otherAllowed = question.other_allowed !== false;
  return (
    <li>
      <p className="text-sm font-medium text-stone-800 leading-snug">
        <span className="text-stone-400 font-mono mr-1.5">{index}.</span>
        {question.text}
      </p>
      <div className="mt-2 space-y-1.5">
        {question.options.map((opt, i) => {
          const checked = answer?.option_id === opt.id;
          const letter = String.fromCharCode("a".charCodeAt(0) + i);
          return (
            <label
              key={opt.id}
              className={
                "flex items-start gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors " +
                (checked
                  ? "border-teal-500 bg-teal-100/40"
                  : "border-stone-200 bg-white hover:border-stone-400")
              }
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={opt.id}
                checked={checked}
                onChange={() => onChange({ option_id: opt.id })}
                className="mt-1 accent-teal-600"
              />
              <span>
                <span className="font-mono text-stone-400 mr-1.5">{letter})</span>
                {opt.label}
              </span>
            </label>
          );
        })}
        {otherAllowed && (
          <div
            className={
              "flex items-start gap-2 px-3 py-2 rounded-md border text-sm transition-colors " +
              (answer?.option_id === "__other__"
                ? "border-teal-500 bg-teal-100/40"
                : "border-stone-200 bg-white")
            }
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              value="__other__"
              checked={answer?.option_id === "__other__"}
              onChange={() => onChange({ option_id: "__other__", other_text: answer?.other_text ?? "" })}
              className="mt-1 accent-teal-600"
            />
            <span className="flex-1">
              <span className="font-mono text-stone-400 mr-1.5">other)</span>
              <input
                type="text"
                value={answer?.other_text ?? ""}
                onChange={(e) =>
                  onChange({ option_id: "__other__", other_text: e.target.value })
                }
                onFocus={() =>
                  answer?.option_id !== "__other__" &&
                  onChange({ option_id: "__other__", other_text: answer?.other_text ?? "" })
                }
                placeholder="write in…"
                className="w-full sm:w-3/4 ml-1 text-sm bg-transparent border-b border-stone-300 focus:outline-none focus:border-teal-600 py-0.5"
              />
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
