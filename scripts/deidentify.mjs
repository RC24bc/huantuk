#!/usr/bin/env node
/**
 * PII de-identification pass over the vault's raw medical records.
 *
 * Usage: node scripts/deidentify.mjs
 * Env:   ANTHROPIC_API_KEY must be set (or in .env.local)
 *
 * Input:  /Volumes/MiniSSD/minda-vault/minda/projects/clinic/autoimmune/files/
 * Output: /Users/pjuice/huantuk/demo-data-staging/    (GITIGNORED)
 *           case01-<facility>-<seq>.json              ← structured redacted extraction
 *           case01-<facility>-<seq>.{pdf,jpg}         ← renamed original binary (LOCAL ONLY)
 *         /Users/pjuice/huantuk/demo-data-staging/index.json  ← review manifest
 *
 * EC reviews demo-data-staging/ before any file moves to demo-data/ (committed).
 * This script NEVER writes into the repo's tracked paths.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import Anthropic from "@anthropic-ai/sdk";

const VAULT_FILES = "/Volumes/MiniSSD/minda-vault/minda/projects/clinic/autoimmune/files";
const STAGING = "/Users/pjuice/huantuk/demo-data-staging";
const MODEL = "claude-opus-4-7";
const CASE_ID = "case01";

const API_KEY = process.env.ANTHROPIC_API_KEY || loadDotEnv(".env.local").ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("[deid] ANTHROPIC_API_KEY missing (env or .env.local).");
  process.exit(1);
}

function loadDotEnv(path) {
  const out = {};
  try {
    const raw = readFileSync(join("/Users/pjuice/huantuk", path), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

mkdirSync(STAGING, { recursive: true });

const SYSTEM = `You are a medical-record de-identifier for Patient Atlas.
Given one medical document, return ONE JSON object — no prose, no markdown fences.

Rules:
1. DO NOT include ANY of these in the output, ever: patient name, NRIC/IC/MyKad, passport number, MRN/patient-ID, phone, email, full DOB (month+year is fine; day is not), street address, next-of-kin info, treating clinician names, signatures, barcodes, hospital account numbers.
2. Shift every date by -37 days to anonymise the timeline while preserving intervals. Use the shifted date in "date_of_service".
3. Keep all clinically useful content — lab values, units, reference ranges, findings narratives, imaging impressions.
4. Set "facility_category" to hospital|private_lab|clinic|photo — do NOT name the facility.
5. Be exhaustive: if a lab panel has 20 analytes, include all 20 in "findings".

Output shape:
{
  "doc_id": "string — short stable id, e.g. lab-panel-01",
  "facility_category": "hospital|private_lab|clinic|photo|unknown",
  "document_type": "lab_panel|imaging|discharge_summary|clinic_letter|clinical_photo|pathology|unknown",
  "date_of_service": "YYYY-MM-DD (shifted -37 days)",
  "findings": [
    { "category": "string", "name": "string", "value": "string", "unit": "string|null", "reference_range": "string|null", "flag": "normal|low|high|critical|unknown" }
  ],
  "narrative": "clinical summary in neutral register, max 600 chars, NO identifiers",
  "redactions_applied": ["list of field types redacted or omitted"],
  "confidence": "high|medium|low"
}`;

const client = new Anthropic({ apiKey: API_KEY });

function listInputs() {
  const all = readdirSync(VAULT_FILES).filter((f) => !f.startsWith("."));
  return all.map((f) => {
    const full = join(VAULT_FILES, f);
    const ext = extname(f).toLowerCase();
    const kind = ext === ".pdf" ? "pdf" : /\.(jpe?g|png|webp)$/i.test(ext) ? "image" : "other";
    return { name: f, path: full, ext, kind, size: statSync(full).size };
  });
}

function guessFacility(name) {
  const n = name.toLowerCase();
  if (n.includes("pantai")) return "hospital-A";
  if (n.includes("kpj")) return "hospital-B";
  if (n.includes("pathlab")) return "lab-C";
  if (n.includes("whatsapp") || /\.jpe?g$/i.test(name)) return "photo";
  return "unknown";
}

async function callClaude(kind, buf, mimeHint) {
  const content = [];
  if (kind === "pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: buf.toString("base64") },
    });
  } else if (kind === "image") {
    const mt = mimeHint || "image/jpeg";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mt, data: buf.toString("base64") },
    });
  } else {
    throw new Error(`Unsupported kind: ${kind}`);
  }
  content.push({ type: "text", text: "De-identify this document per the system prompt rules and return JSON." });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const text = res.content.find((b) => b.type === "text");
  return text && "text" in text ? text.text : "";
}

function safeMime(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

const inputs = listInputs();
console.log(`[deid] ${inputs.length} files to process from ${VAULT_FILES}`);
const manifest = [];
let facilityCounters = {};

for (let i = 0; i < inputs.length; i++) {
  const f = inputs[i];
  if (f.kind === "other") {
    console.log(`[deid] skip ${f.name} (${f.ext})`);
    continue;
  }
  const facility = guessFacility(f.name);
  facilityCounters[facility] = (facilityCounters[facility] || 0) + 1;
  const seq = String(facilityCounters[facility]).padStart(2, "0");
  const newStem = `${CASE_ID}-${facility}-${seq}`;
  const outJsonPath = join(STAGING, `${newStem}.json`);

  if (existsSync(outJsonPath)) {
    console.log(`[deid] ${i + 1}/${inputs.length}  ${f.name} → ${newStem}.json (cached, skipping)`);
    continue;
  }

  process.stdout.write(`[deid] ${i + 1}/${inputs.length}  ${f.name} → ${newStem}... `);
  try {
    const buf = readFileSync(f.path);
    const mime = f.kind === "image" ? safeMime(f.name) : undefined;
    const raw = await callClaude(f.kind, buf, mime);
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {}
    const out = {
      source_filename_hash: hashName(f.name),
      facility_guess: facility,
      original_kind: f.kind,
      original_size_bytes: f.size,
      extracted: parsed,
      raw_if_unparsed: parsed ? undefined : raw.slice(0, 2000),
      deid_model: MODEL,
      deid_at: new Date().toISOString(),
    };
    writeFileSync(outJsonPath, JSON.stringify(out, null, 2));
    manifest.push({ orig: f.name, new: `${newStem}.json`, facility, kind: f.kind, parsed_ok: !!parsed });
    console.log("ok");
  } catch (err) {
    console.log(`ERR — ${err.message}`);
    manifest.push({ orig: f.name, new: null, error: err.message });
  }
}

writeFileSync(join(STAGING, "index.json"), JSON.stringify(manifest, null, 2));
console.log(`[deid] Done. ${manifest.filter((m) => m.new).length}/${manifest.length} succeeded.`);
console.log(`[deid] Review: ${STAGING}/index.json`);
console.log(`[deid] NOTHING has been moved into the repo's tracked demo-data/ dir.`);

function hashName(name) {
  // cheap deterministic hash so we can cross-reference without exposing filename
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}
