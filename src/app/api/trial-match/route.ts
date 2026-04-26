import { NextRequest, NextResponse } from "next/server";
import { getClient, SONNET_MODEL, extractText, safeParseJson } from "@/lib/agents/anthropic";
import { TRIAL_MATCH_SYSTEM_PROMPT } from "@/lib/agents/drug-discovery/prompts";
import { mockTrialMatch } from "@/lib/agents/drug-discovery/mocks";
import type { TrialMatchResponse, TrialMatch } from "@/lib/agents/drug-discovery/types";

export const runtime = "nodejs";
export const maxDuration = 90;

type Body = {
  top_differential_id: string;
  top_differential_label: string;
  case_summary?: string;
  prior_therapies?: string[];
  extracted_findings_summary?: string;
  patient_age?: number;
  patient_sex?: string;
  register?: "doctor" | "patient";
};

const PATIENT_PREFIX = `\n\nADDITIONAL REGISTER RULE: The reader is a patient (~14-year-old reading level). The "title" must be readable; translate "phase 2 RCT" as "phase 2 study (a stage where they test if it works)". The "inclusion_match_reasoning" and "potential_exclusion_concerns" MUST be in plain language. The "intervention" can keep the drug's generic name but explain the class in brackets. Trial IDs and registry stay in their official form (the patient brings these to their doctor).`;

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.top_differential_id) {
    return NextResponse.json({ error: "top_differential_id required" }, { status: 400 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json(mockTrialMatch(body.top_differential_id));
  }

  const register = body.register === "patient" ? "patient" : "doctor";
  const system =
    TRIAL_MATCH_SYSTEM_PROMPT + (register === "patient" ? PATIENT_PREFIX : "");

  try {
    const res = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4500,
      system,
      messages: [
        {
          role: "user",
          content:
            "Find currently enrolling clinical trials matching this patient. Asia-accessible from KL preferred.\n\n" +
            JSON.stringify(
              {
                top_differential: {
                  id: body.top_differential_id,
                  label: body.top_differential_label,
                },
                case_summary: body.case_summary ?? null,
                extracted_findings_summary: body.extracted_findings_summary ?? null,
                prior_therapies: body.prior_therapies ?? [],
                patient_age: body.patient_age ?? null,
                patient_sex: body.patient_sex ?? null,
                home_country: "Malaysia (KL)",
              },
              null,
              2,
            ),
        },
      ],
    });
    const raw = extractText(res.content);
    const parsed = safeParseJson<{ matches?: unknown; watchdog_note?: unknown }>(raw);
    const matches = Array.isArray(parsed?.matches) ? (parsed.matches as TrialMatch[]) : [];
    const watchdog_note =
      typeof parsed?.watchdog_note === "string"
        ? parsed.watchdog_note
        : "Point-in-time match. Watchdog cron re-runs weekly when patient subscribes (post-MVP).";
    return NextResponse.json({
      top_differential_id: body.top_differential_id,
      top_differential_label: body.top_differential_label,
      matches,
      watchdog_note,
      source: "opus-4.7",
      is_mock: false,
    } satisfies TrialMatchResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
