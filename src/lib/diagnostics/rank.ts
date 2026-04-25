import type {
  CurrentDifferential,
  Recommendation,
  TestCatalog,
  TestEntry,
} from "./types";

const SAFETY_BOOST = 0.4;

export function deterministicRank(
  catalog: TestCatalog,
  topDifferentials: CurrentDifferential[],
  testsAlreadyDone: string[],
  limit = 5,
): Recommendation[] {
  const doneSet = new Set(testsAlreadyDone);
  const probByDx = new Map(topDifferentials.map((d) => [d.differential_id, d.posterior_probability]));

  const scored = catalog.tests
    .filter((t) => !doneSet.has(t.id))
    .map((t) => {
      let score = 0;
      const matched: Recommendation["discriminates_for_case"] = [];

      for (const d of t.discriminates) {
        const prob = probByDx.get(d.differential_id) ?? 0;
        if (prob > 0) {
          score += d.info_gain * prob;
          matched.push({
            differential_id: d.differential_id,
            differential_label: catalog.differentials_index[d.differential_id] ?? d.differential_id,
            direction: d.direction,
          });
        }
      }

      if (t.purpose === "treatment_safety" && topDifferentials.length > 0) {
        score += SAFETY_BOOST;
      }

      return { test: t, score, matched };
    })
    .filter((s) => s.score > 0 || s.test.purpose === "treatment_safety")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s, i) => entryToRecommendation(s.test, i + 1, s.score, s.matched));
}

function entryToRecommendation(
  t: TestEntry,
  rank: number,
  caseInfoGain: number,
  matched: Recommendation["discriminates_for_case"],
): Recommendation {
  return {
    test_id: t.id,
    short_name: t.short_name,
    rank,
    case_specific_info_gain: Math.round(caseInfoGain * 100) / 100,
    discriminates_for_case: matched,
    rationale: t.rationale,
    citation: t.citation,
    cost_myr_range: t.cost_myr_range,
    availability: t.availability,
    turnaround_days: t.turnaround_days,
    tier: t.tier,
  };
}
