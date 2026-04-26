import { NextRequest, NextResponse } from "next/server";
import { getClient, SONNET_MODEL, extractText, safeParseJson } from "@/lib/agents/anthropic";
import { REPURPOSE_SYSTEM_PROMPT } from "@/lib/agents/drug-discovery/prompts";
import { mockRepurpose } from "@/lib/agents/drug-discovery/mocks";
import type { RepurposeResponse, RepurposingCandidate } from "@/lib/agents/drug-discovery/types";

export const runtime = "nodejs";
export const maxDuration = 90;

type Body = {
  top_differential_id: string;
  top_differential_label: string;
  case_summary?: string;
  prior_therapies?: string[];
  extracted_findings_summary?: string;
  register?: "doctor" | "patient";
};

const PATIENT_PREFIX = `\n\nADDITIONAL REGISTER RULE: The reader is a patient with no medical training (~14-year-old reading level). For each candidate, the "approved_indication" and "proposed_mechanism_in_case" fields MUST be in plain English. Translate every medical term in brackets the first time it appears (e.g. "polyarthritis (many joints inflamed)"). Drug names stay in their generic international form. Reasoning steps and safety flags must be patient-readable. References stay in clinical form (your treating doctor reads those).`;

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
    return NextResponse.json(mockRepurpose(body.top_differential_id));
  }

  const register = body.register === "patient" ? "patient" : "doctor";
  const system =
    REPURPOSE_SYSTEM_PROMPT + (register === "patient" ? PATIENT_PREFIX : "");

  try {
    const res = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      system,
      messages: [
        {
          role: "user",
          content:
            "Propose drug repurposing candidates for this patient.\n\n" +
            JSON.stringify(
              {
                top_differential: {
                  id: body.top_differential_id,
                  label: body.top_differential_label,
                },
                case_summary: body.case_summary ?? null,
                extracted_findings_summary: body.extracted_findings_summary ?? null,
                prior_therapies: body.prior_therapies ?? [],
              },
              null,
              2,
            ),
        },
      ],
    });
    const raw = extractText(res.content);
    const parsed = safeParseJson<{ candidates?: unknown }>(raw);
    const candidates = Array.isArray(parsed?.candidates)
      ? (parsed.candidates as RepurposingCandidate[])
      : [];
    return NextResponse.json({
      top_differential_id: body.top_differential_id,
      top_differential_label: body.top_differential_label,
      candidates,
      source: "opus-4.7",
      is_mock: false,
    } satisfies RepurposeResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
