import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// Haiku 4.5 — PDF/image parsing into structured findings. ~40× cheaper than Opus
// and indistinguishable for this extraction step in our internal eval.
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You are a clinical documentation parser for Patient Atlas.
You read a single medical document (hospital report, lab panel, imaging report, clinic letter, or clinical photo) and return a compact structured summary for downstream diagnostic reasoning.

Rules:
- DO NOT echo or retain patient identifiers (name, NRIC/IC, MyKad, passport, MRN, phone, full DOB, address, treating clinician names). If any are present, redact to "[REDACTED]".
- Output strict JSON only, no markdown fences, no prose outside the JSON.
- Shape:
  {
    "facility_type": "hospital|lab|clinic|photo|unknown",
    "document_type": "lab_panel|imaging|discharge_summary|clinic_letter|clinical_photo|unknown",
    "date_of_service": "YYYY-MM-DD|unknown",
    "findings": [ { "category": "string", "name": "string", "value": "string", "unit": "string|null", "reference_range": "string|null", "flag": "normal|low|high|critical|unknown" } ],
    "narrative": "one-paragraph clinical summary in neutral register, max 400 chars",
    "redactions_applied": ["list of field types redacted"]
  }`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const bytes = Buffer.from(await file.arrayBuffer());
  const b64 = bytes.toString("base64");

  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = [];
  if (mime === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: b64 },
    });
  } else if (mime.startsWith("image/")) {
    const mediaType = (mime === "image/jpg" ? "image/jpeg" : mime) as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: b64 },
    });
  } else {
    return NextResponse.json({ error: `Unsupported media type: ${mime}` }, { status: 400 });
  }
  content.push({ type: "text", text: "Parse this document and return the JSON described in the system prompt." });

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
    const textBlock = res.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    let parsed: unknown = null;
    try { parsed = JSON.parse(raw); } catch { /* leave null */ }
    const summary = parsed && typeof parsed === "object" && "narrative" in parsed
      ? (parsed as { narrative?: string }).narrative ?? raw.slice(0, 300)
      : raw.slice(0, 300);
    return NextResponse.json({
      filename: file.name,
      size: bytes.length,
      mime,
      extracted: parsed,
      summary,
      raw,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
