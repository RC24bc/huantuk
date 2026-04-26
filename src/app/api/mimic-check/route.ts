import { NextRequest, NextResponse } from "next/server";
import {
  MIMIC_SYSTEM_PROMPT,
  deterministicMimics,
  type MimicCheckResponse,
  type MimicHit,
} from "@/lib/agents/mimic-detector";
import { getClient, SONNET_MODEL, extractText, safeParseJson } from "@/lib/agents/anthropic";
import type { DifferentialReasoning } from "@/lib/diagnostics/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  case_summary?: string;
  differentials: DifferentialReasoning[];
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const differentials = Array.isArray(body.differentials) ? body.differentials : [];
  if (differentials.length === 0) {
    return NextResponse.json({ error: "differentials required" }, { status: 400 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json(deterministicMimics(differentials));
  }

  const userPayload = {
    case_summary: body.case_summary ?? null,
    top_differentials: differentials.map((d) => ({
      differential_id: d.differential_id,
      label: d.differential_label,
      posterior: d.posterior_probability,
      key_evidence: d.key_evidence,
    })),
  };

  try {
    const res = await client.messages.create({
      model: SONNET_MODEL,
      max_tokens: 2500,
      system: MIMIC_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content:
            "Screen for autoimmune mimics in this case. Return strict JSON.\n\n" +
            JSON.stringify(userPayload, null, 2),
        },
      ],
    });
    const raw = extractText(res.content);
    const parsed = safeParseJson<{ hits?: unknown; reassuring_note?: unknown }>(raw);
    if (!parsed) {
      return NextResponse.json({
        hits: [],
        reassuring_note: "Mimic detector output was unparseable.",
        source: "opus-4.7",
      } satisfies MimicCheckResponse);
    }
    const hits = Array.isArray(parsed.hits) ? (parsed.hits as MimicHit[]) : [];
    const reassuring_note =
      typeof parsed.reassuring_note === "string" ? parsed.reassuring_note : undefined;
    return NextResponse.json({
      hits,
      reassuring_note,
      source: "opus-4.7",
    } satisfies MimicCheckResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
