import { NextRequest, NextResponse } from "next/server";

/**
 * Live PubMed query for "latest evidence-based medicine updates" panel
 * shown to clinicians (mode=doctor) when a top differential reaches confidence.
 *
 * Uses E-utilities: esearch (term → PMIDs) → esummary (PMIDs → metadata).
 * No auth required. Capped to last 18 months and 6 results.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

type EbmRecord = {
  pmid: string;
  title: string;
  authors: string;
  source: string;
  pubdate: string;
  doi?: string;
  url: string;
};

type EbmResponse = {
  query: string;
  results: EbmRecord[];
  total_count: number;
};

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL = "huantuk";
const EMAIL = "huantuk@vercel.app";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { diagnosis_label?: string; max_results?: number };
  try {
    body = (await req.json()) as { diagnosis_label?: string; max_results?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const label = (body.diagnosis_label ?? "").trim();
  if (!label) {
    return NextResponse.json({ error: "diagnosis_label is required" }, { status: 400 });
  }
  const max = Math.min(Math.max(body.max_results ?? 5, 1), 6);

  // Restrict to last 18 months + reviews/RCTs/guidelines for "latest EBM" feel
  const term = `${label}[Title/Abstract] AND ("last 18 months"[PDat]) AND (Review[ptyp] OR "Randomized Controlled Trial"[ptyp] OR Guideline[ptyp] OR "Practice Guideline"[ptyp] OR "Systematic Review"[ptyp])`;

  try {
    // Step 1: esearch
    const esearchUrl =
      `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}` +
      `&retmax=${max}&retmode=json&sort=pub_date&tool=${TOOL}&email=${EMAIL}`;

    const sRes = await fetch(esearchUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!sRes.ok) {
      return NextResponse.json(
        { error: `PubMed esearch failed: ${sRes.status}` },
        { status: 502 },
      );
    }
    const sJson = (await sRes.json()) as {
      esearchresult?: { idlist?: string[]; count?: string };
    };
    const ids = sJson.esearchresult?.idlist ?? [];
    const total = parseInt(sJson.esearchresult?.count ?? "0", 10);

    if (ids.length === 0) {
      // Fallback: relax filter — drop date and ptyp restriction, top 5 by date
      const fallbackTerm = `${label}[Title/Abstract]`;
      const fbUrl =
        `${EUTILS}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(fallbackTerm)}` +
        `&retmax=${max}&retmode=json&sort=pub_date&tool=${TOOL}&email=${EMAIL}`;
      const fbRes = await fetch(fbUrl, { headers: { Accept: "application/json" } });
      if (fbRes.ok) {
        const fbJson = (await fbRes.json()) as {
          esearchresult?: { idlist?: string[]; count?: string };
        };
        const fbIds = fbJson.esearchresult?.idlist ?? [];
        if (fbIds.length > 0) {
          const records = await fetchSummaries(fbIds);
          return NextResponse.json({
            query: label,
            results: records,
            total_count: parseInt(fbJson.esearchresult?.count ?? "0", 10),
          } satisfies EbmResponse);
        }
      }
      return NextResponse.json({
        query: label,
        results: [],
        total_count: 0,
      } satisfies EbmResponse);
    }

    const records = await fetchSummaries(ids);
    return NextResponse.json({
      query: label,
      results: records,
      total_count: total,
    } satisfies EbmResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}

async function fetchSummaries(ids: string[]): Promise<EbmRecord[]> {
  const url =
    `${EUTILS}/esummary.fcgi?db=pubmed&id=${ids.join(",")}` +
    `&retmode=json&tool=${TOOL}&email=${EMAIL}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    result?: Record<string, unknown>;
  };
  const result = json.result ?? {};
  const records: EbmRecord[] = [];
  for (const id of ids) {
    const r = result[id] as
      | {
          uid?: string;
          title?: string;
          authors?: { name: string; authtype: string }[];
          source?: string;
          pubdate?: string;
          articleids?: { idtype: string; value: string }[];
        }
      | undefined;
    if (!r) continue;
    const authorList = (r.authors ?? [])
      .filter((a) => a.authtype === "Author")
      .map((a) => a.name);
    const authors = formatAuthors(authorList);
    const doi = r.articleids?.find((a) => a.idtype === "doi")?.value;
    records.push({
      pmid: r.uid ?? id,
      title: (r.title ?? "").replace(/\.$/, ""),
      authors,
      source: r.source ?? "",
      pubdate: r.pubdate ?? "",
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${r.uid ?? id}/`,
    });
  }
  return records;
}

function formatAuthors(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= 3) return names.join(", ");
  return `${names[0]} et al.`;
}
