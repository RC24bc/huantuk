"use client";

import Link from "next/link";
import { Suspense } from "react";
import { PersonaProvider, usePersona, useCopy, type Mode, type View } from "@/lib/persona";
import DiagnosisFinderShell from "./DiagnosisFinderShell";
import CureDiscovererShell from "./CureDiscovererShell";

export default function AppShell({
  initialMode,
  initialView,
}: {
  initialMode?: Mode;
  initialView?: View;
}) {
  return (
    <PersonaProvider initialMode={initialMode} initialView={initialView}>
      <Suspense fallback={null}>
        <Header />
        <main>
          <Hero />
          <TabContent />
          <BelowTheFold />
          <Disclaimer />
          <Footer />
        </main>
      </Suspense>
    </PersonaProvider>
  );
}

function Header() {
  const { mode, view, setMode, setView } = usePersona();
  const copy = useCopy();
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-stone-50/85 border-b border-stone-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-6">
          <Link href="/" className="font-semibold tracking-tight text-lg text-stone-900">
            Huantuk
          </Link>
          <nav role="tablist" aria-label="Workflow" className="inline-flex rounded-md bg-white border border-stone-200 p-0.5 text-sm">
            <button
              role="tab"
              aria-selected={view === "diagnosis"}
              onClick={() => setView("diagnosis")}
              className={
                "px-3 py-1.5 rounded-[5px] transition-colors font-medium " +
                (view === "diagnosis"
                  ? "bg-teal-600 text-white"
                  : "text-stone-600 hover:text-stone-900")
              }
            >
              {copy("tab.diagnosis")}
            </button>
            <button
              role="tab"
              aria-selected={view === "cure"}
              onClick={() => setView("cure")}
              className={
                "px-3 py-1.5 rounded-[5px] transition-colors font-medium " +
                (view === "cure"
                  ? "bg-teal-600 text-white"
                  : "text-stone-600 hover:text-stone-900")
              }
            >
              {copy("tab.cure")}
            </button>
          </nav>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div role="group" aria-label="Audience" className="inline-flex rounded-md bg-stone-100 border border-stone-200 p-0.5 text-sm">
            <button
              aria-pressed={mode === "doctor"}
              onClick={() => setMode("doctor")}
              className={
                "px-3 py-1.5 rounded-[5px] transition-colors font-medium " +
                (mode === "doctor" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900")
              }
            >
              Doctor
            </button>
            <button
              aria-pressed={mode === "patient"}
              onClick={() => setMode("patient")}
              className={
                "px-3 py-1.5 rounded-[5px] transition-colors font-medium " +
                (mode === "patient" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-900")
              }
            >
              Patient
            </button>
          </div>
          <a
            href="https://github.com/RC24bc/huantuk"
            className="hidden sm:inline text-sm text-stone-500 hover:text-stone-900"
            aria-label="GitHub repository"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const copy = useCopy();
  const { mode, view } = usePersona();
  // Hero only shows on diagnosis tab — Cure has its own intro.
  if (view !== "diagnosis") return null;
  return (
    <section className="mx-auto max-w-6xl px-6 pt-10 sm:pt-14 pb-6">
      <div className="max-w-prose">
        <p
          className={
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5 " +
            (mode === "patient"
              ? "bg-rose-100 text-rose-900"
              : "bg-amber-100 text-amber-900")
          }
        >
          <span
            className={
              "size-1.5 rounded-full " +
              (mode === "patient" ? "bg-rose-500" : "bg-amber-500")
            }
          />
          {copy("hero.kicker")}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05] text-stone-900">
          {copy("hero.h1")}
        </h1>
        <p className="mt-5 text-base sm:text-lg leading-relaxed text-stone-600">
          {copy("hero.p")}
        </p>
      </div>
    </section>
  );
}

function TabContent() {
  const { view } = usePersona();
  return (
    <section id="start" className="mx-auto max-w-5xl px-6 pb-16 scroll-mt-20">
      {view === "diagnosis" ? <DiagnosisFinderShell /> : <CureDiscovererShell />}
    </section>
  );
}

function BelowTheFold() {
  const { mode, view } = usePersona();
  // Keep the marketing details only on the diagnosis tab — cure tab is patient-action focused.
  if (view !== "diagnosis") return null;
  return mode === "doctor" ? <DoctorBelowFold /> : <PatientBelowFold />;
}

function DoctorBelowFold() {
  const items = [
    { n: "01", title: "Unified case timeline", body: "Drag PDFs from any clinic, scans, lab panels, even WhatsApp clinical photos. Huantuk extracts every relevant finding, pins it chronologically, and groups by organ system." },
    { n: "02", title: "Cited differential reasoning", body: "Top 5 differentials with calibrated posterior probabilities, supporting/contradicting findings, and 1–3 primary-source citations from the literature. Never invented." },
    { n: "03", title: "Classification criteria scorecards", body: "Yamaguchi AOSD · 2017 EULAR/ACR IIM · 2019 ACR/EULAR SLE · 2010 ACR/EULAR RA · 2022 ACR/EULAR AAV · 2019 ACR/EULAR IgG4-RD · 2016 ACR/EULAR Sjögren's." },
    { n: "04", title: "Mimic check + next-investigation ranking", body: "Non-autoimmune mimics that cluster around each top differential, with the discriminating test for each — and the next test ranked by case-specific information gain." },
    { n: "05", title: "Drug repurposing + off-label + trial matching", body: "When standard care has run out: three agents return cited drug-repurposing candidates, off-label options, and currently-recruiting trials — Malaysian access pathways included." },
    { n: "06", title: "Cited handoff letter", body: "One-page summary for the next clinician. Every claim hyperlinked. Stripe-paid post-hackathon; free during evaluation." },
  ];
  return (
    <section id="workflow" className="bg-white border-y border-stone-200 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-prose mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700">What you get per case</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Six outputs. One workflow. Sixty seconds.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-stone-600">
            Drop the folder. Huantuk runs the chain end-to-end. Every output is cited, every uncertainty is flagged, every recommendation is yours to override.
          </p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((s) => (
            <li key={s.n} className="rounded-2xl border border-stone-200 p-6 sm:p-7 bg-stone-50">
              <div className="text-sm font-mono text-teal-700">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold leading-snug">{s.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-stone-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PatientBelowFold() {
  return (
    <section className="bg-white border-y border-stone-200">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="max-w-prose mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-rose-700">How this works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Three steps. About one minute.
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-stone-600">
            You don't need to know any medical words. Just upload what you have, or type what's been happening. The AI does the reading.
          </p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Step
            n="1"
            title="Tell us your story"
            body="Upload reports from any hospital, or just type what's been happening — when it started, what hurts, what tests you've had, what you've tried."
          />
          <Step
            n="2"
            title="Read it together"
            body="The AI reads everything and tells you what it might be, in plain English. It also tells you what's missing — questions to ask, tests that would help."
          />
          <Step
            n="3"
            title="When standard care fails — there's more"
            body="If you've already tried the usual treatment and you're still sick, switch to the second tab. The AI looks across the world's medical research for what else might help — to take to your doctor."
          />
        </ol>
        <p className="mt-8 text-sm text-stone-500 max-w-prose">
          You stay in control. Nothing is saved. Nothing is shared. The output is for you to bring to a doctor — Huantuk doesn't prescribe, doesn't diagnose, doesn't replace anyone.
        </p>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-stone-200 p-6 sm:p-7 bg-stone-50">
      <div className="text-sm font-mono text-rose-700">Step {n}</div>
      <h3 className="mt-3 text-xl font-semibold leading-snug">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-stone-600">{body}</p>
    </li>
  );
}

function Disclaimer() {
  const { mode } = usePersona();
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-7 sm:p-9 max-w-prose mx-auto">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-900">
          {mode === "patient" ? "Important" : "Regulatory framing"}
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-stone-900">
          {mode === "patient"
            ? "This helps you talk to your doctor. It doesn't replace your doctor."
            : "Clinical decision support. Not a diagnostic device."}
        </h2>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-stone-700">
          {mode === "patient"
            ? "Huantuk reads your reports and gives you ideas to bring to your doctor — what it might be, what tests would help, what other treatments exist if the usual one didn't work. It does not give you a diagnosis. It does not prescribe medicine. Always talk to your doctor before changing anything."
            : "Huantuk synthesises evidence and surfaces options. It does not prescribe, it does not diagnose, and it does not replace the consultation. Output is intended for use by registered medical practitioners only. The treating doctor remains the prescriber."}
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-stone-500">
        <p>Built on Claude Opus 4.7 + Sonnet 4.6 + Haiku 4.5 · Cerebral Valley × Anthropic hackathon · MIT</p>
        <div className="flex gap-5">
          <a href="https://github.com/RC24bc/huantuk" className="hover:text-stone-900">github.com/RC24bc/huantuk</a>
        </div>
      </div>
    </footer>
  );
}
