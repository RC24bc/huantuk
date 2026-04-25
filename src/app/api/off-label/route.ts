import { NextRequest, NextResponse } from "next/server";
import { getClient, DEFAULT_MODEL, extractText, safeParseJson } from "@/lib/agents/anthropic";
import { OFFLABEL_SYSTEM_PROMPT } from "@/lib/agents/drug-discovery/prompts";
import { mockOffLabel } from "@/lib/agents/drug-discovery/mocks";
import type { OffLabelResponse, OffLabelCandidate } from "@/lib/agents/drug-discovery/types";

export const runtime = "nodejs";
export const maxDuration = 90;

type Body = {
  top_differential_id: string;
  top_differential_label: string;
  case_summary?: string;
  prior_therapies?: string[];
  extracted_findings_summary?: string;
};

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
    return NextResponse.json(mockOffLabel(body.top_differential_id));
  }

  try {
    const res = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4000,
      system: OFFLABEL_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "Discover off-label indications for this patient with Malaysian access pathway notes.\n\n" +
            JSON.stringify(
              {
                top_differential: {
                  id: body.top_differential_id,
                  label: body.top_differential_label,
                },
                case_summary: body.case_summary ?? null,
                extracted_findings_summary: body.extracted_findings_summary ?? null,
                prior_therapies: body.prior_therapies ?? [],
                jurisdiction: "Malaysia (with Singapore HSA / US Expanded Access / EU Compassionate Use as fallback access pathways)",
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
      ? (parsed.candidates as OffLabelCandidate[])
      : [];
    return NextResponse.json({
      top_differential_id: body.top_differential_id,
      top_differential_label: body.top_differential_label,
      candidates,
      source: "opus-4.7",
      is_mock: false,
    } satisfies OffLabelResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
