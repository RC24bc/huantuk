"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { CurrentDifferential, SynthesiseResponse } from "@/lib/diagnostics/types";

export type Mode = "doctor" | "patient";
export type View = "diagnosis" | "cure";

type CarryOver = {
  caseSummary: string;
  topDifferentialId: string | null;
  topDifferentialLabel: string | null;
  extractedSummary: string | null;
  topDifferentials: CurrentDifferential[];
};

type PersonaContextShape = {
  mode: Mode;
  view: View;
  setMode: (m: Mode) => void;
  setView: (v: View) => void;
  carryOver: CarryOver;
  setCarryOver: (next: Partial<CarryOver>) => void;
  jumpToCure: (s: SynthesiseResponse, caseSummary: string) => void;
};

const PersonaContext = createContext<PersonaContextShape | null>(null);

const EMPTY_CARRY: CarryOver = {
  caseSummary: "",
  topDifferentialId: null,
  topDifferentialLabel: null,
  extractedSummary: null,
  topDifferentials: [],
};

export function PersonaProvider({
  children,
  initialMode = "doctor",
  initialView = "diagnosis",
}: {
  children: ReactNode;
  initialMode?: Mode;
  initialView?: View;
}) {
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [view, setViewState] = useState<View>(initialView);
  const [carryOver, setCarryOverState] = useState<CarryOver>(EMPTY_CARRY);

  const writeUrl = useCallback((next: { mode?: Mode; view?: View }) => {
    const url = new URL(window.location.href);
    if (next.mode) url.searchParams.set("mode", next.mode);
    if (next.view) url.searchParams.set("tab", next.view);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    writeUrl({ mode: m });
  }, [writeUrl]);

  const setView = useCallback((v: View) => {
    setViewState(v);
    writeUrl({ view: v });
  }, [writeUrl]);

  const setCarryOver = useCallback((next: Partial<CarryOver>) => {
    setCarryOverState((prev) => ({ ...prev, ...next }));
  }, []);

  const jumpToCure = useCallback(
    (s: SynthesiseResponse, caseSummary: string) => {
      const top = s.differentials[0];
      setCarryOverState({
        caseSummary,
        topDifferentialId: top?.differential_id ?? null,
        topDifferentialLabel: top?.differential_label ?? null,
        extractedSummary: s.narrative_summary ?? null,
        topDifferentials: s.differentials.map((d) => ({
          differential_id: d.differential_id,
          posterior_probability: d.posterior_probability,
        })),
      });
      setViewState("cure");
      writeUrl({ view: "cure" });
      // scroll to top so user sees the Cure Discoverer tab content
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [writeUrl],
  );

  return (
    <PersonaContext.Provider
      value={{ mode, view, setMode, setView, carryOver, setCarryOver, jumpToCure }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextShape {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used inside <PersonaProvider>");
  return ctx;
}

// ---------- Copy helpers ----------

type CopyKey =
  | "hero.kicker"
  | "hero.h1"
  | "hero.p"
  | "hero.cta_run_real"
  | "hero.cta_upload"
  | "tab.diagnosis"
  | "tab.cure"
  | "diagnosis.intake.h"
  | "diagnosis.intake.p"
  | "diagnosis.intake.upload_h"
  | "diagnosis.intake.upload_sub"
  | "diagnosis.intake.text_h"
  | "diagnosis.intake.text_placeholder"
  | "diagnosis.intake.run"
  | "diagnosis.intake.run_loading"
  | "diagnosis.intake.preset_h"
  | "diagnosis.intake.preset_p"
  | "diagnosis.summary_h"
  | "diagnosis.differentials_h"
  | "diagnosis.differentials_p"
  | "diagnosis.criteria_h"
  | "diagnosis.criteria_p"
  | "diagnosis.mimic_h"
  | "diagnosis.mimic_p"
  | "diagnosis.tests_h"
  | "diagnosis.tests_p"
  | "diagnosis.followup_h"
  | "diagnosis.followup_p"
  | "diagnosis.followup_send"
  | "diagnosis.handoff_h"
  | "diagnosis.handoff_p"
  | "diagnosis.handoff_cta"
  | "cure.intro_h"
  | "cure.intro_p"
  | "cure.from_dx"
  | "cure.no_dx"
  | "cure.repurpose_btn"
  | "cure.offlabel_btn"
  | "cure.trials_btn"
  | "cure.repurpose_h"
  | "cure.offlabel_h"
  | "cure.trials_h"
  | "cure.disclaimer"
  | "common.supports"
  | "common.contradicts"
  | "common.citations"
  | "common.evidence"
  | "common.sources";

const COPY_DOCTOR: Record<CopyKey, string> = {
  "hero.kicker": "Decision support for undiagnosed autoimmune-pattern cases",
  "hero.h1": "The 50-page folder you didn't have time to read.",
  "hero.p":
    "Huantuk reads every PDF, scan and clinical photo for one patient — across hospitals — and returns cited differentials, classification-criteria scores, mimic checks, next-test ranking, and (on demand) drug repurposing. Built on Claude Opus 4.7.",
  "hero.cta_run_real": "Run the real Malaysian case →",
  "hero.cta_upload": "Upload your patient's folder",
  "tab.diagnosis": "Diagnosis Finder",
  "tab.cure": "Cure Discoverer",
  "diagnosis.intake.h": "Drop the folder. Get the synthesis.",
  "diagnosis.intake.p":
    "Reports are sent to Anthropic for reading only — Huantuk does not store them. Use a demo preset to see the workflow with no API spend.",
  "diagnosis.intake.upload_h": "Drop documents here",
  "diagnosis.intake.upload_sub": "PDFs, JPEGs, PNGs · any facility · any order",
  "diagnosis.intake.text_h": "Or paste a case summary",
  "diagnosis.intake.text_placeholder":
    "e.g. 56-year-old male, persistent fevers, evanescent rash on trunk during spikes, ferritin 8420, RF and ANA negative…",
  "diagnosis.intake.run": "Synthesise differentials",
  "diagnosis.intake.run_loading": "Synthesising…",
  "diagnosis.intake.preset_h": "Try a demo case",
  "diagnosis.intake.preset_p":
    "One click loads a hand-crafted case → auto-runs synthesis. Zero API spend; deterministic.",
  "diagnosis.summary_h": "Case summary",
  "diagnosis.differentials_h": "Differential reasoning",
  "diagnosis.differentials_p":
    "Each differential names supporting findings AND cites the published source — verify, don't trust.",
  "diagnosis.criteria_h": "Classification criteria",
  "diagnosis.criteria_p":
    "Each disease scored against its published classification criteria. Every criterion shown so the clinician can audit.",
  "diagnosis.mimic_h": "Mimics that get missed",
  "diagnosis.mimic_p":
    "Conditions that look autoimmune but aren't — must be excluded before chronic immunosuppression.",
  "diagnosis.tests_h": "What's missing",
  "diagnosis.tests_p":
    "Highest-information-gain tests not yet ordered, ranked for this case.",
  "diagnosis.followup_h": "Follow-up to tighten the diagnosis",
  "diagnosis.followup_p":
    "Targeted questions Opus thinks would meaningfully narrow the differential. Answer what you know, leave the rest blank, and re-synthesise.",
  "diagnosis.followup_send": "Re-synthesise with answers",
  "diagnosis.handoff_h": "Standard care has nothing more to offer?",
  "diagnosis.handoff_p":
    "When CPG management has been tried and failed, switch to Cure Discoverer for repurposing candidates, off-label options and matching trials — anchored on the differential above.",
  "diagnosis.handoff_cta": "Open this case in Cure Discoverer →",
  "cure.intro_h": "When current treatment has run out.",
  "cure.intro_p":
    "Three clinical-research agents reason against the patient's leading differential — repurposing candidates, off-label options with regulatory pathways, and currently-recruiting trials. Cite primary sources only; never fabricate.",
  "cure.from_dx": "Working from the diagnosis you just synthesised:",
  "cure.no_dx":
    "No diagnosis loaded. Run the Diagnosis Finder first, or pick a known diagnosis below to explore directly.",
  "cure.repurpose_btn": "Find repurposing candidates",
  "cure.offlabel_btn": "Discover off-label options",
  "cure.trials_btn": "Match clinical trials",
  "cure.repurpose_h": "Repurposing candidates",
  "cure.offlabel_h": "Off-label options",
  "cure.trials_h": "Trial matches",
  "cure.disclaimer":
    "Research output for the treating clinician. Not a prescription. Patient access via DCA, HSA Special Access, US Expanded Access, or EU Compassionate Use — pathway noted per item.",
  "common.supports": "Supports",
  "common.contradicts": "Contradicts",
  "common.citations": "Citations",
  "common.evidence": "Evidence",
  "common.sources": "Sources",
};

const COPY_PATIENT: Record<CopyKey, string> = {
  "hero.kicker": "If you've been to many hospitals and still don't have an answer",
  "hero.h1": "Your reports. Read in plain English. Every page from every hospital.",
  "hero.p":
    "If you have a stack of reports and no clear answer, this tool reads them all together with AI and tells you in plain words what it might be, what tests would help, and — if the usual treatment didn't work — what else might be worth asking your doctor about.",
  "hero.cta_run_real": "See a real example →",
  "hero.cta_upload": "Upload your reports",
  "tab.diagnosis": "What might it be?",
  "tab.cure": "What else can I try?",
  "diagnosis.intake.h": "Tell us what's been happening.",
  "diagnosis.intake.p":
    "Upload reports from any hospital, or just type the story in your own words. We send them only to the AI to read — nothing is saved. Try the example to see how it works first.",
  "diagnosis.intake.upload_h": "Drop your reports here",
  "diagnosis.intake.upload_sub": "PDFs or photos of paper reports · from any hospital",
  "diagnosis.intake.text_h": "Or type your story",
  "diagnosis.intake.text_placeholder":
    "e.g. I'm 56. For the last 6 months I've had fevers every evening, a salmon-coloured rash that comes and goes when fever spikes, and joint pains in my wrists and knees…",
  "diagnosis.intake.run": "Read my reports",
  "diagnosis.intake.run_loading": "Reading…",
  "diagnosis.intake.preset_h": "Or see an example first",
  "diagnosis.intake.preset_p":
    "These are real-style cases (no real patient names). Click one to watch the AI read it — costs nothing.",
  "diagnosis.summary_h": "Here's your story, in one paragraph",
  "diagnosis.differentials_h": "What it might be",
  "diagnosis.differentials_p":
    "These are the possibilities the AI thinks fit your story best. The percentage is how confident it is — not a diagnosis. Every guess shows the findings that fit and the ones that don't, with the medical paper it's based on.",
  "diagnosis.criteria_h": "How well your story fits each disease's checklist",
  "diagnosis.criteria_p":
    "Doctors use official checklists to decide if someone has a disease. The AI ticks off which boxes your story already meets, which it doesn't, and which we don't have data for yet.",
  "diagnosis.mimic_h": "Other things that look the same — don't get tricked",
  "diagnosis.mimic_p":
    "Some non-autoimmune conditions copy autoimmune symptoms. Before going on long-term immune drugs, these must be ruled out. The AI lists which to ask your doctor about.",
  "diagnosis.tests_h": "What test would help most next",
  "diagnosis.tests_p":
    "If you can only do one or two more tests, these are the ones that would tell us the most — ranked, with rough cost in MYR.",
  "diagnosis.followup_h": "A few questions to make this more accurate",
  "diagnosis.followup_p":
    "The AI is missing some details. Answer what you know — even partial answers help. Skip what you don't know. Then press the button to read it again.",
  "diagnosis.followup_send": "Read it again with my answers",
  "diagnosis.handoff_h": "Have you already tried the standard treatment and it didn't work?",
  "diagnosis.handoff_p":
    "If yes — there is more. Switch to the next tab to see drugs already approved for other conditions that might help, and research studies (clinical trials) you could ask to join.",
  "diagnosis.handoff_cta": "What else can I try? →",
  "cure.intro_h": "When the usual treatment didn't work, there is still more to try.",
  "cure.intro_p":
    "This page shows three things, all based on your story: drugs approved for other illnesses that might also help yours, drugs being used 'off-label' in real cases like yours, and research studies you could ask your doctor about joining. None of this is a prescription — it's a list to take to your doctor.",
  "cure.from_dx": "Working from what we just figured out together:",
  "cure.no_dx":
    "We haven't worked out a likely diagnosis yet. Either go back to the first tab and tell us your story, or pick a known diagnosis below if you already have one from your doctor.",
  "cure.repurpose_btn": "Show me other drugs that might help",
  "cure.offlabel_btn": "Show me drugs already used 'off-label' for this",
  "cure.trials_btn": "Show me research studies I might join",
  "cure.repurpose_h": "Drugs approved for other things that might help",
  "cure.offlabel_h": "Drugs being used 'off-label' for cases like yours",
  "cure.trials_h": "Research studies you could ask about",
  "cure.disclaimer":
    "This is a list to bring to your doctor — not a prescription. Your doctor decides what's right for you. The pathway shown next to each drug is how Malaysian patients can get access (e.g. through the DCA compassionate-use route, or Singapore's Special Access scheme).",
  "common.supports": "Why it fits",
  "common.contradicts": "Why it might not",
  "common.citations": "Medical papers this is based on",
  "common.evidence": "What we know",
  "common.sources": "Sources",
};

export function useCopy() {
  const { mode } = usePersona();
  const table = mode === "patient" ? COPY_PATIENT : COPY_DOCTOR;
  return (key: CopyKey): string => table[key];
}
