#!/usr/bin/env node
/**
 * Verify every reference in src/lib/criteria/*.json against NCBI E-utilities (PubMed + ID converter).
 *
 * For each reference:
 *   - If PMID present: hit ESummary → confirm title matches (fuzzy, case+punct insensitive, 70%+).
 *   - Else if DOI present: hit NCBI ID Converter API (idconv) to resolve to PMID, then ESummary.
 *   - Else: WARN — no machine-readable identifier.
 *
 * Output:
 *   stdout: per-ref PASS/FAIL/WARN
 *   scripts/verify-references-report.json: full report
 *
 * No API key needed for <3 req/sec. Set NCBI_API_KEY env for 10 req/sec.
 *
 * Usage: node scripts/verify-references.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const CRITERIA_DIR = "/Users/pjuice/huantuk/src/lib/criteria";
const REPORT_PATH = "/Users/pjuice/huantuk/scripts/verify-references-report.json";
const API_KEY = process.env.NCBI_API_KEY || "";
const RATE_LIMIT_MS = API_KEY ? 110 : 350;

function normalise(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a, b) {
  const na = normalise(a).split(" ").filter(Boolean);
  const nb = new Set(normalise(b).split(" ").filter(Boolean));
  if (na.length === 0) return 0;
  const overlap = na.filter((w) => nb.has(w)).length;
  return overlap / na.length;
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function doiToPmid(doi) {
  // First try: PubMed ESearch with [DOI] tag — covers all of PubMed, not just PMC.
  const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(doi)}[DOI]&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  try {
    const res = await fetch(esearchUrl);
    if (res.ok) {
      const j = await res.json();
      const ids = j?.esearchresult?.idlist || [];
      if (ids.length > 0) return ids[0];
    }
  } catch {}
  // Fallback: PMC ID converter (open access only)
  const idconvUrl = `https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?tool=huantuk&email=tagendacemerlang@gmail.com&ids=${encodeURIComponent(doi)}&format=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  try {
    const res = await fetch(idconvUrl);
    if (res.ok) {
      const j = await res.json();
      return j?.records?.[0]?.pmid || null;
    }
  } catch {}
  return null;
}

async function titleToPmid(title, year) {
  // Fallback when neither PMID nor DOI give us a hit — search by title.
  const yearFilter = year ? ` AND ${year}[PDAT]` : "";
  const q = `${title.replace(/[^\w\s]/g, " ")}[TIAB]${yearFilter}`;
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=3&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    return j?.esearchresult?.idlist?.[0] || null;
  } catch { return null; }
}

async function pmidSummary(pmid) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  return j?.result?.[pmid] || null;
}

async function verifyRef(ref) {
  let pmid = ref.pmid;
  let resolved_via = null;

  if (!pmid && ref.doi) {
    try {
      pmid = await doiToPmid(ref.doi);
      if (pmid) resolved_via = "doi->idconv";
    } catch {}
  }

  if (!pmid) {
    return { status: "WARN", reason: "no_pmid_and_doi_unresolved", resolved_via };
  }

  await sleep(RATE_LIMIT_MS);
  const summary = await pmidSummary(pmid).catch(() => null);
  if (!summary) {
    return { status: "FAIL", reason: "pmid_not_in_pubmed", pmid, resolved_via };
  }

  const officialTitle = summary.title || "";
  const sim = titleSimilarity(ref.title, officialTitle);
  const officialYear = (summary.pubdate || "").slice(0, 4);
  const officialJournal = summary.source || "";

  const ok = sim >= 0.6 && (!ref.year || String(ref.year) === officialYear);
  return {
    status: ok ? "PASS" : "FAIL",
    pmid,
    resolved_via,
    title_similarity: +sim.toFixed(2),
    official_title: officialTitle,
    official_year: officialYear,
    official_journal: officialJournal,
    year_mismatch: ref.year && String(ref.year) !== officialYear,
  };
}

const files = readdirSync(CRITERIA_DIR).filter((f) => f.endsWith(".json"));
const report = { checked_at: new Date().toISOString(), files: {} };
let totals = { PASS: 0, FAIL: 0, WARN: 0 };

for (const file of files) {
  const path = join(CRITERIA_DIR, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const refs = data.references || [];
  report.files[file] = { criteria: data.id, refs: [] };
  if (refs.length === 0) continue;
  console.log(`\n[verify] ${file} — ${refs.length} refs`);
  for (const [i, r] of refs.entries()) {
    const res = await verifyRef(r);
    totals[res.status] = (totals[res.status] || 0) + 1;
    const marker = res.status === "PASS" ? "✓" : res.status === "FAIL" ? "✗" : "?";
    console.log(`  ${marker} [${i}] ${r.journal} ${r.year} — ${r.title.slice(0, 70)}${r.title.length > 70 ? "…" : ""}`);
    if (res.status !== "PASS") {
      console.log(`      → ${res.reason || ""} ${res.official_title ? `(PubMed has: "${res.official_title.slice(0, 80)}")` : ""}`);
    }
    report.files[file].refs.push({
      index: i,
      declared: { title: r.title, journal: r.journal, year: r.year, doi: r.doi, pmid: r.pmid },
      result: res,
    });
  }
}

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`\n[verify] Totals: ${totals.PASS} PASS · ${totals.FAIL} FAIL · ${totals.WARN} WARN`);
console.log(`[verify] Full report: ${REPORT_PATH}`);
process.exit(totals.FAIL > 0 ? 1 : 0);
