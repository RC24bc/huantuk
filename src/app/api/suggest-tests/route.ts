import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import catalogJson from "@/lib/diagnostics/test-catalog.json";
import { deterministicRank } from "@/lib/diagnostics/rank";
import type {
  Recommendation,
  SuggestRequest,
  SuggestResponse,
  TestCatalog,
} from "@/lib/diagnostics/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Sonnet 4.6 — ranks next investigations by expected information gain.
// Test catalog + differential context is structured; Sonnet handles it
// at ~5× lower cost than Opus.
const MODEL = "claude-sonnet-4-6";
const CATALOG = catalogJson as unknown as TestCatalog;

const SYSTEM = `You are a senior internist + rheumatologist serving as the "what's missing" reasoner inside Patient Atlas (clinical decision support, not a diagnostic device).

You receive (a) the case's current top differentials with posterior probabilities, (b) a structured catalog of diagnostic tests with their discriminating power per differential, and (c) the list of tests already done.

Your job: re-rank the top 5 most informative untested next tests, give each a ONE-SENTENCE clinical rationale tailored to this case, and write a 2-sentence overall reasoning summary.

Strict rules:
- Output JSON only, no markdown fences, no prose outside JSON.
- Never include patient identifiers in your output.
- Reason about discriminating value (how much does this test shift the posterior across the top differentials?), not just availability or cost.
- Boost any "purpose: treatment_safety" tests if a treatment decision is imminent.
- Use the catalog tests verbatim — do not invent tests.

Output shape (no extra keys):
{
  "recommendations": [
    {
      "test_id": "string (must match catalog id)",
      "rank": 1,
      "case_specific_info_gain": 0.0–1.0,
      "rationale": "one clinical sentence, max 200 chars, tailored to the case"
    }
  ],
  "reasoning_summary": "two sentences max, plain register"
}`;

export async function POST(req: NextRequest) {
  let body: SuggestRequest;
  try {
    body = (await req.json()) as SuggestRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.top_differentials) || body.top_differentials.length === 0) {
    return NextResponse.json({ error: "top_differentials required" }, { status: 400 });
  }

  const testsDone = body.tests_already_done ?? [];
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const recs = deterministicRank(CATALOG, body.top_differentials, testsDone);
    const resp: SuggestResponse = {
      recommendations: recs,
      reasoning_summary: "Deterministic ranking only (ANTHROPIC_API_KEY not configured). Tests ranked by Σ(info_gain × posterior_probability) across top differentials.",
      source: "deterministic-fallback",
    };
    return NextResponse.json(resp);
  }

  const seedRecs = deterministicRank(CATALOG, body.top_differentials, testsDone, 8);

  const userPayload = {
    extracted_findings_summary: body.extracted_findings_summary ?? null,
    top_differentials: body.top_differentials.map((d) => ({
      differential_id: d.differential_id,
      differential_label: CATALOG.differentials_index[d.differential_id] ?? d.differential_id,
      posterior_probability: d.posterior_probability,
    })),
    tests_already_done: testsDone,
    candidate_tests: seedRecs.map((r) => {
      const t = CATALOG.tests.find((x) => x.id === r.test_id);
      return {
        id: r.test_id,
        short_name: r.short_name,
        category: t?.category,
        tier: r.tier,
        cost_myr_range: r.cost_myr_range,
        availability: r.availability,
        turnaround_days: r.turnaround_days,
        purpose: t?.purpose ?? "diagnosis",
        discriminates: t?.discriminates,
        triggers: t?.triggers,
        rationale_default: r.rationale,
      };
    }),
  };

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Re-rank the candidate tests for this case and explain in case-specific language.\n\n${JSON.stringify(userPayload, null, 2)}`,
        },
      ],
    });

    const textBlock = res.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const parsed = safeParse(raw);

    if (!parsed || !Array.isArray(parsed.recommendations)) {
      const fallback: SuggestResponse = {
        recommendations: deterministicRank(CATALOG, body.top_differentials, testsDone),
        reasoning_summary: "Opus response was unparseable; deterministic ranking returned.",
        source: "deterministic-fallback",
      };
      return NextResponse.json(fallback);
    }

    const merged = mergeOpusWithCatalog(parsed.recommendations, CATALOG);

    const resp: SuggestResponse = {
      recommendations: merged.slice(0, 5),
      reasoning_summary: typeof parsed.reasoning_summary === "string" ? parsed.reasoning_summary : "",
      source: "opus-4.7",
    };
    return NextResponse.json(resp);
  } catch (err: unknown) {
    const fallback: SuggestResponse = {
      recommendations: deterministicRank(CATALOG, body.top_differentials, testsDone),
      reasoning_summary: `Opus call failed (${err instanceof Error ? err.message : String(err)}); deterministic ranking returned.`,
      source: "deterministic-fallback",
    };
    return NextResponse.json(fallback);
  }
}

function safeParse(s: string): { recommendations?: unknown; reasoning_summary?: unknown } | null {
  try {
    return JSON.parse(s);
  } catch {
    const match = s.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

type OpusRec = { test_id?: unknown; rank?: unknown; case_specific_info_gain?: unknown; rationale?: unknown };

function mergeOpusWithCatalog(opusRecs: unknown[], catalog: TestCatalog): Recommendation[] {
  const merged: Recommendation[] = [];
  for (const r of opusRecs) {
    if (!r || typeof r !== "object") continue;
    const rec = r as OpusRec;
    const id = typeof rec.test_id === "string" ? rec.test_id : null;
    if (!id) continue;
    const t = catalog.tests.find((x) => x.id === id);
    if (!t) continue;
    merged.push({
      test_id: t.id,
      short_name: t.short_name,
      rank: typeof rec.rank === "number" ? rec.rank : merged.length + 1,
      case_specific_info_gain:
        typeof rec.case_specific_info_gain === "number"
          ? Math.round(rec.case_specific_info_gain * 100) / 100
          : 0,
      discriminates_for_case: t.discriminates.map((d) => ({
        differential_id: d.differential_id,
        differential_label: catalog.differentials_index[d.differential_id] ?? d.differential_id,
        direction: d.direction,
      })),
      rationale: typeof rec.rationale === "string" ? rec.rationale : t.rationale,
      citation: t.citation,
      cost_myr_range: t.cost_myr_range,
      availability: t.availability,
      turnaround_days: t.turnaround_days,
      tier: t.tier,
    });
  }
  return merged.sort((a, b) => a.rank - b.rank);
}
