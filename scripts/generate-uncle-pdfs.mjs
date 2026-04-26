#!/usr/bin/env node
/**
 * Generate clean redacted PDFs for the phased uncle-IIM demo.
 *
 * Inputs: structured lab/clinical data (in this script — sourced from the case
 * description; no original PII reaches the binary).
 * Outputs: PDFs at /public/demo-uncle-iim/phase[1-3]/<slug>.pdf
 *
 * Each PDF mimics a typical Malaysian Premier Integrated Lab / KPJ / Pathlab
 * report header so the OBS recording feels real, but every identifying field
 * is REDACTED. PII never enters this file.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_ROOT = resolve(__dirname, "..", "public", "demo-uncle-iim");

const PALETTE = {
  navy: rgb(0.13, 0.21, 0.45),
  ink: rgb(0.12, 0.12, 0.12),
  muted: rgb(0.40, 0.40, 0.40),
  accent: rgb(0.62, 0.10, 0.10),
  rule: rgb(0.78, 0.78, 0.78),
};

/** Generic patient header — every report uses this. No real PII. */
const HEADER = {
  patient: "[REDACTED]",
  ic: "[REDACTED]",
  dob: "[REDACTED]",
  age_gender: "Adult / Male",
  mrn: "[REDACTED]",
  location: "Medical Ward A",
  case_id: "HUANTUK-DEMO-CASE-1",
};

/** Lab metadata. */
const LABS = {
  pantai: {
    facility: "PREMIER INTEGRATED LABS",
    sublabel: "(at Pantai Hospital)",
    address: "Reference Specialised Laboratory - Kuala Lumpur, Malaysia",
    requester: "[REDACTED] - Consultant Physician / Haematologist",
    location: "[REDACTED HOSPITAL]",
  },
  kpj: {
    facility: "KPJ INTEGRATED LABORATORY",
    sublabel: "(KPJ Healthcare Berhad)",
    address: "KPJ Reference Lab - Klang Valley, Malaysia",
    requester: "[REDACTED] - Internal Medicine",
    location: "[REDACTED HOSPITAL]",
  },
  pathlab: {
    facility: "PATHLAB DIAGNOSTIC SERVICES",
    sublabel: "(Specialised Immunology)",
    address: "Reference Immunology Lab - Petaling Jaya, Malaysia",
    requester: "[REDACTED] - Rheumatology",
    location: "[REDACTED HOSPITAL]",
  },
};

// -----------------------------------------------------------------------------
// drawing helpers
// -----------------------------------------------------------------------------

function drawHeader(page, lab, meta, fonts) {
  const { width, height } = page.getSize();
  const top = height - 40;

  // Lab name
  page.drawText(lab.facility, { x: 36, y: top, size: 14, font: fonts.bold, color: PALETTE.navy });
  page.drawText(lab.sublabel, { x: 36, y: top - 16, size: 9, font: fonts.regular, color: PALETTE.muted });
  page.drawText(lab.address, { x: 36, y: top - 28, size: 8, font: fonts.regular, color: PALETTE.muted });

  // Right-side report title
  page.drawText("LABORATORY REPORT", {
    x: width - 36 - fonts.bold.widthOfTextAtSize("LABORATORY REPORT", 12),
    y: top,
    size: 12,
    font: fonts.bold,
    color: PALETTE.ink,
  });
  page.drawText(`Page 1 of 1`, {
    x: width - 36 - fonts.regular.widthOfTextAtSize("Page 1 of 1", 8),
    y: top - 16,
    size: 8,
    font: fonts.regular,
    color: PALETTE.muted,
  });

  // Rule
  page.drawLine({
    start: { x: 36, y: top - 40 },
    end: { x: width - 36, y: top - 40 },
    thickness: 1.0,
    color: PALETTE.rule,
  });

  // Patient block
  let y = top - 58;
  const labelCol = 36;
  const valueCol = 130;
  const labelCol2 = 320;
  const valueCol2 = 400;

  const draw = (lbl, val, x, xv, yy) => {
    page.drawText(lbl, { x, y: yy, size: 9, font: fonts.regular, color: PALETTE.muted });
    page.drawText(val, { x: xv, y: yy, size: 9, font: fonts.bold, color: PALETTE.ink });
  };

  draw("Name", HEADER.patient, labelCol, valueCol, y);
  draw("Lab No", meta.lab_no ?? "[REDACTED]", labelCol2, valueCol2, y);
  y -= 13;
  draw("IC Number", HEADER.ic, labelCol, valueCol, y);
  draw("MRN", HEADER.mrn, labelCol2, valueCol2, y);
  y -= 13;
  draw("DOB", HEADER.dob, labelCol, valueCol, y);
  draw("Collected", meta.collected, labelCol2, valueCol2, y);
  y -= 13;
  draw("Age / Gender", HEADER.age_gender, labelCol, valueCol, y);
  draw("Reported", meta.reported, labelCol2, valueCol2, y);
  y -= 13;
  draw("Location", lab.location, labelCol, valueCol, y);
  draw("Case ID", HEADER.case_id, labelCol2, valueCol2, y);
  y -= 13;
  draw("Requester", lab.requester, labelCol, valueCol, y);
  y -= 18;

  // Rule
  page.drawLine({
    start: { x: 36, y },
    end: { x: width - 36, y },
    thickness: 0.6,
    color: PALETTE.rule,
  });

  return y - 20; // return next-y
}

function drawSectionTitle(page, text, y, fonts) {
  page.drawText(text.toUpperCase(), { x: 36, y, size: 11, font: fonts.bold, color: PALETTE.navy });
  page.drawLine({
    start: { x: 36, y: y - 4 },
    end: { x: 559, y: y - 4 },
    thickness: 0.4,
    color: PALETTE.rule,
  });
  return y - 18;
}

function drawTableHeader(page, y, fonts) {
  page.drawText("TEST", { x: 36, y, size: 8, font: fonts.bold, color: PALETTE.muted });
  page.drawText("RESULT", { x: 280, y, size: 8, font: fonts.bold, color: PALETTE.muted });
  page.drawText("UNIT", { x: 360, y, size: 8, font: fonts.bold, color: PALETTE.muted });
  page.drawText("REF RANGE", { x: 430, y, size: 8, font: fonts.bold, color: PALETTE.muted });
  page.drawText("FLAG", { x: 530, y, size: 8, font: fonts.bold, color: PALETTE.muted });
  page.drawLine({
    start: { x: 36, y: y - 3 },
    end: { x: 559, y: y - 3 },
    thickness: 0.3,
    color: PALETTE.rule,
  });
  return y - 14;
}

function drawRow(page, row, y, fonts) {
  const isAbnormal = row.flag && row.flag !== "";
  const colour = isAbnormal ? PALETTE.accent : PALETTE.ink;
  page.drawText(row.test, { x: 36, y, size: 9, font: fonts.regular, color: PALETTE.ink });
  page.drawText(String(row.result ?? ""), {
    x: 280,
    y,
    size: 9,
    font: isAbnormal ? fonts.bold : fonts.regular,
    color: colour,
  });
  page.drawText(row.unit ?? "", { x: 360, y, size: 9, font: fonts.regular, color: PALETTE.muted });
  page.drawText(row.ref ?? "", { x: 430, y, size: 9, font: fonts.regular, color: PALETTE.muted });
  if (isAbnormal) {
    page.drawText(row.flag, { x: 530, y, size: 9, font: fonts.bold, color: PALETTE.accent });
  }
  return y - 13;
}

function drawWrapped(page, text, x, y, opts, fonts) {
  const maxWidth = opts.maxWidth ?? 523;
  const size = opts.size ?? 9;
  const font = opts.font ?? fonts.regular;
  const colour = opts.colour ?? PALETTE.ink;
  const lineHeight = opts.lineHeight ?? size * 1.4;
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    const wWidth = font.widthOfTextAtSize(trial, size);
    if (wWidth > maxWidth) {
      page.drawText(line, { x, y: cursorY, size, font, color: colour });
      cursorY -= lineHeight;
      line = w;
    } else {
      line = trial;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cursorY, size, font, color: colour });
    cursorY -= lineHeight;
  }
  return cursorY;
}

function drawFooter(page, fonts) {
  const { width } = page.getSize();
  const footer = "ELECTRONIC VALIDATED REPORT - NO SIGNATURE REQUIRED - Demo / training copy — all identifying data redacted.";
  page.drawLine({
    start: { x: 36, y: 50 },
    end: { x: width - 36, y: 50 },
    thickness: 0.3,
    color: PALETTE.rule,
  });
  page.drawText(footer, { x: 36, y: 38, size: 7, font: fonts.regular, color: PALETTE.muted });
  page.drawText("HUANTUK - DEMO PATIENT FILE — NOT FOR CLINICAL USE", {
    x: 36,
    y: 28,
    size: 7,
    font: fonts.bold,
    color: PALETTE.accent,
  });
}

// -----------------------------------------------------------------------------
// report builders
// -----------------------------------------------------------------------------

async function newDoc() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };
  return { pdf, page, fonts };
}

async function build(filename, fn) {
  const { pdf, page, fonts } = await newDoc();
  fn(page, fonts);
  drawFooter(page, fonts);
  const bytes = await pdf.save();
  const path = resolve(OUT_ROOT, filename);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  console.log(`✓ ${filename}`);
}

function addRows(page, rows, y, fonts) {
  for (const r of rows) {
    if (r === "BREAK") {
      y -= 5;
      continue;
    }
    if (typeof r === "string") {
      page.drawText(r, { x: 36, y, size: 9, font: fonts.italic, color: PALETTE.muted });
      y -= 14;
      continue;
    }
    y = drawRow(page, r, y, fonts);
  }
  return y;
}

// =============================================================================
// PHASE 1 — admission week (07-09 Apr 2026)
// =============================================================================

async function p1_fbc_admission() {
  await build("phase1/01-pantai-fbc-admission-2026-04-07.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394097",
      collected: "07.04.2026 18:57",
      reported: "07.04.2026 20:14",
    }, fonts);
    y = drawSectionTitle(page, "Haematology — Full Blood Count", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      { test: "Haemoglobin", result: "9.4", unit: "g/dL", ref: "13.0-18.0", flag: "L" },
      { test: "Red Blood Cell", result: "3.71", unit: "x10^12/L", ref: "4.50-6.50", flag: "L" },
      { test: "Red Cell Distribution Width", result: "16.1", unit: "%", ref: "<14.3", flag: "H" },
      { test: "Packed Cell Volume", result: "30", unit: "%", ref: "40-54", flag: "L" },
      { test: "Mean Cell Volume", result: "80", unit: "fL", ref: "76-96" },
      { test: "Mean Cell Haemoglobin", result: "25", unit: "pg", ref: "28-34", flag: "L" },
      { test: "MCHC", result: "32", unit: "g/dL", ref: "30-36" },
      "BREAK",
      { test: "White Blood Cell", result: "19.5", unit: "x10^9/L", ref: "4.0-11.0", flag: "H" },
      { test: "Neutrophils %", result: "79.3", unit: "%", ref: "40.0-75.0", flag: "H" },
      { test: "Lymphocytes %", result: "12.6", unit: "%", ref: "20.0-45.0", flag: "L" },
      { test: "Monocytes %", result: "3.8", unit: "%", ref: "2.0-10.0" },
      { test: "Eosinophils %", result: "4.1", unit: "%", ref: "0.0-6.0" },
      { test: "Basophils %", result: "0.2", unit: "%", ref: "0.0-1.0" },
      "BREAK",
      { test: "Neutrophils #", result: "15.5", unit: "x10^9/L", ref: "2.0-7.5", flag: "H" },
      { test: "Lymphocytes #", result: "2.5", unit: "x10^9/L", ref: "1.5-4.5" },
      { test: "Monocytes #", result: "0.7", unit: "x10^9/L", ref: "0.2-0.8" },
      { test: "Eosinophils #", result: "0.80", unit: "x10^9/L", ref: "0.04-0.40", flag: "H" },
      { test: "Basophils #", result: "0.0", unit: "x10^9/L" },
      "BREAK",
      { test: "Platelet", result: "657", unit: "x10^9/L", ref: "150-400", flag: "H" },
      { test: "Erythrocyte Sedimentation Rate", result: "118", unit: "mm/hr", ref: "<31", flag: "H" },
      "BREAK",
      { test: "Lactate Dehydrogenase", result: "180", unit: "U/L", ref: "120-246" },
      { test: "Creatine Kinase", result: "34", unit: "U/L", ref: "46-171", flag: "L" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Hypochromic microcytic anaemia with neutrophilia, peripheral eosinophilia and reactive thrombocytosis. Markedly elevated ESR. Creatine kinase NORMAL — atypical for classical inflammatory myopathy. Please correlate clinically.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p1_bma() {
  await build("phase1/02-pantai-bone-marrow-aspiration-2026-04-08.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394342",
      collected: "08.04.2026 15:10",
      reported: "09.04.2026 14:38",
    }, fonts);
    y = drawSectionTitle(page, "Haematology — Bone Marrow Aspiration", y, fonts);
    y = addRows(page, [
      "Indication: Pyrexia of unknown origin, high ESR/CRP, anaemia, high platelet/WBC/globulin, low albumin. Rule out infection / haematological malignancy / myeloproliferative neoplasm.",
      "BREAK",
      { test: "Site of Marrow Aspiration", result: "Right PSIS" },
      { test: "Cellularity", result: "Normocellular marrow" },
      { test: "Erythropoiesis", result: "Reduced but normoblastic" },
      { test: "Myelopoiesis", result: "Active, orderly maturation. No increase in blasts." },
      { test: "Megakaryopoiesis", result: "Adequate" },
      { test: "Plasma cells", result: "2% (no abnormal clumps)" },
      "BREAK",
      "Marrow Differential Count:",
      { test: "  Erythroid Precursors", result: "16%" },
      { test: "  Blasts", result: "0%" },
      { test: "  Myelo/Metamyelocytes", result: "20%" },
      { test: "  Neutrophils", result: "48%" },
      { test: "  Lymphocytes", result: "9%" },
      { test: "  Eosinophils", result: "5%" },
      { test: "  Plasma Cells", result: "2%" },
      "BREAK",
      { test: "Iron Stores", result: "Plentiful" },
      { test: "Peripheral Blood Film", result: "Mild hypochromic anaemia, mild rouleaux, neutrophilia, thrombocytosis." },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Conclusion: Normocellular marrow with mildly reduced erythropoiesis, active myelopoiesis and megakaryopoiesis. Features SUGGESTIVE OF REACTIVE MARROW. No evidence of haematological malignancy or myeloproliferative neoplasm. Please correlate with clinical and other relevant investigations.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p1_cultures() {
  await build("phase1/03-pantai-cultures-2026-04-07.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394099",
      collected: "07.04.2026 18:57",
      reported: "09.04.2026 11:54",
    }, fonts);
    y = drawSectionTitle(page, "Microbiology — Cultures", y, fonts);
    y = addRows(page, [
      "Urine — Microscopy:",
      { test: "  RBC", result: "Nil" },
      { test: "  WBC", result: "Nil" },
      { test: "  Epithelial cells", result: "Nil" },
      { test: "  Bacteria", result: "Nil" },
      { test: "Urine Culture", result: "No growth obtained" },
      "BREAK",
      { test: "Blood Culture & Sensitivity", result: "NO GROWTH after 5 days incubation" },
      { test: "Bone Marrow Culture", result: "NO GROWTH after 5 days incubation" },
      { test: "AFB smear (Auramine, bone marrow)", result: "No AFB observed (x40 objective)" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Comment: Routine bacterial and mycobacterial cultures negative. No infective source identified.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p1_troponin_quantiferon() {
  await build("phase1/04-pantai-troponin-quantiferon-2026-04-08.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394445",
      collected: "08-09.04.2026",
      reported: "09.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Biochemistry — Troponin & TB Screen", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      { test: "High Sensitivity Troponin I", result: "5.9", unit: "ng/L", ref: "<25.7" },
      "BREAK",
      "Quantiferon-TB Gold Plus:",
      { test: "  TB1-Nil", result: "0.000", unit: "IU/mL" },
      { test: "  TB2-Nil", result: "0.000", unit: "IU/mL" },
      { test: "  Mitogen-Nil", result: "0.02", unit: "IU/mL", flag: "L" },
      { test: "  Nil control", result: "0.05", unit: "IU/mL" },
      { test: "  Result", result: "INDETERMINATE (low mitogen)", flag: "*" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Comment: Troponin within normal limits — myocardial injury unlikely. Quantiferon indeterminate due to low mitogen response (consistent with severe systemic inflammation suppressing T-cell readout). Repeat after acute illness has settled if active TB still suspected on clinical grounds.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p1_skin_findings() {
  await build("phase1/05-clinical-photo-summary-2026-04-15.pdf", (page, fonts) => {
    let y = drawHeader(page, { ...LABS.pantai, requester: "[REDACTED] - Dermatology consult" }, {
      lab_no: "PHOTO-SET-A",
      collected: "15.04.2026",
      reported: "15.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Clinical Photography — Skin & Joint", y, fonts);
    y = addRows(page, [
      "Photograph set A (10 images, dermatology consult, fingers / dorsa of hands / forearms):",
      "BREAK",
      { test: "Periungual / nailfold", result: "Erythema and ragged cuticles bilaterally" },
      { test: "MCP and PIP joints", result: "Mild erythematous papules over knuckles (Gottron-like)" },
      { test: "Forearm / dorsa", result: "Faint violaceous patches consistent with shawl distribution" },
      { test: "Palms", result: "No 'mechanic's hands' fissuring at this time" },
      { test: "Heliotrope", result: "Trace periorbital duskiness, not florid" },
      { test: "Calcinosis", result: "None palpable on examination" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Photographs show subtle dermatomyositis-spectrum cutaneous findings — Gottron-like papules, possible shawl-distribution erythema and periungual erythema. Heliotrope is borderline. Recommend autoimmune myopathy serology and skin biopsy if rash persists.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

// =============================================================================
// PHASE 2 — chemistry, exclusions, ANA workup (08-12 Apr 2026)
// =============================================================================

async function p2_lft_rft() {
  await build("phase2/06-pantai-lft-rft-2026-04-07.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394097-B",
      collected: "07.04.2026",
      reported: "07.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Biochemistry — Liver & Renal Function", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      "Liver Function:",
      { test: "  Total Protein", result: "86", unit: "g/L", ref: "57-82", flag: "H" },
      { test: "  Albumin", result: "23", unit: "g/L", ref: "34-50", flag: "L" },
      { test: "  Globulin", result: "63", unit: "g/L", ref: "20-42", flag: "H" },
      { test: "  Albumin/Globulin ratio", result: "0.37", unit: "", ref: "1.0-2.0", flag: "L" },
      { test: "  Alkaline Phosphatase", result: "122", unit: "U/L", ref: "46-116", flag: "H" },
      { test: "  AST", result: "64", unit: "U/L", ref: "<34", flag: "H" },
      { test: "  ALT", result: "29", unit: "U/L", ref: "10-49" },
      { test: "  GGT", result: "21", unit: "U/L", ref: "<73" },
      { test: "  Bilirubin (total)", result: "6.2", unit: "umol/L", ref: "<22" },
      { test: "  FIB-4 score", result: "1.12", unit: "", ref: "<1.30 (low risk)" },
      "BREAK",
      "Renal Function:",
      { test: "  Sodium", result: "134", unit: "mmol/L", ref: "136-145", flag: "L" },
      { test: "  Potassium", result: "4.1", unit: "mmol/L", ref: "3.5-5.1" },
      { test: "  Chloride", result: "99", unit: "mmol/L", ref: "98-109" },
      { test: "  Urea Nitrogen", result: "7.7", unit: "mmol/L", ref: "3.2-8.2" },
      { test: "  Creatinine", result: "101", unit: "umol/L", ref: "65-104" },
      { test: "  eGFR (CKD-EPI)", result: "68", unit: "mL/min/1.73m^2", ref: ">90", flag: "L" },
      { test: "  Uric Acid", result: "0.31", unit: "mmol/L", ref: "0.22-0.55" },
      { test: "  Glucose (random)", result: "5.8", unit: "mmol/L", ref: "<7.7" },
      { test: "  Calcium (corrected)", result: "2.44", unit: "mmol/L", ref: "2.18-2.60" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Marked polyclonal hyperglobulinaemia with reversed albumin/globulin ratio (0.37) — classic systemic-inflammation signature. Mild AST elevation without ALT rise — suggestive of muscle / skeletal source rather than hepatocellular. CKD stage 3a (eGFR 68). FIB-4 low-risk for advanced fibrosis.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p2_followup_fbc_apttp() {
  await build("phase2/07-pantai-fbc-coag-day2-2026-04-08.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394318",
      collected: "08.04.2026 15:10",
      reported: "08.04.2026 16:46",
    }, fonts);
    y = drawSectionTitle(page, "Haematology — Day 2 FBC & Coagulation", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      { test: "Haemoglobin", result: "11.0", unit: "g/dL", ref: "13.0-18.0", flag: "L" },
      { test: "Red Cell Distribution Width", result: "15.9", unit: "%", ref: "<14.3", flag: "H" },
      { test: "Packed Cell Volume", result: "35", unit: "%", ref: "40-54", flag: "L" },
      { test: "White Blood Cell", result: "14.6", unit: "x10^9/L", ref: "4.0-11.0", flag: "H" },
      { test: "Neutrophils %", result: "90.4", unit: "%", ref: "40-75", flag: "H" },
      { test: "Platelet", result: "694", unit: "x10^9/L", ref: "150-400", flag: "H" },
      "BREAK",
      "Coagulation:",
      { test: "  Prothrombin Time (PT)", result: "13.6", unit: "sec", ref: "9.6-12.2", flag: "H" },
      { test: "  INR", result: "1.4", unit: "", ref: "0.9-1.2", flag: "H" },
      { test: "  APTT", result: "33.8", unit: "sec", ref: "21.0-36.0" },
      { test: "  Reticulocyte", result: "1.3", unit: "%", ref: "0.5-2.5" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Persistent leucocytosis with neutrophilia and reactive thrombocytosis on Day 2. Mild PT/INR prolongation typical of acute-phase response with low albumin. Reticulocyte response not yet developed — anaemia remains hypoproliferative.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p2_tumour_markers() {
  await build("phase2/08-kpj-tumour-markers-2026-04-10.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.kpj, {
      lab_no: "KPJ-TM-2026-04-10-9912",
      collected: "10.04.2026",
      reported: "11.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Tumour Markers — Paraneoplastic Screen", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      { test: "AFP (Alpha-Fetoprotein)", result: "<1.3", unit: "ug/L", ref: "<7.0" },
      { test: "CEA", result: "0.6", unit: "ug/L", ref: "<5.0 (non-smoker)" },
      { test: "CA 19-9", result: "14.4", unit: "U/mL", ref: "<37" },
      { test: "PSA (total)", result: "1.51", unit: "ng/mL", ref: "<4.0" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: All standard tumour markers within normal limits. Negative paraneoplastic screen does NOT exclude occult malignancy — anti-NXP2 dermatomyositis carries a 15-30% adult cancer association regardless of marker levels. Recommend age-appropriate cancer screening (colonoscopy, low-dose chest CT, abdominal/pelvic imaging) regardless.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p2_hep_syph_ana() {
  await build("phase2/09-kpj-hepatitis-syphilis-ana-2026-04-10.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.kpj, {
      lab_no: "KPJ-IM-2026-04-10-7741",
      collected: "10.04.2026",
      reported: "11.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Infective & Connective-Tissue Screen", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      "Hepatitis & Syphilis Screen:",
      { test: "  HBsAg", result: "Non-reactive" },
      { test: "  Anti-HBs (immunity)", result: "Non-immune (low surface antibody)", flag: "*" },
      { test: "  Anti-HCV", result: "Non-reactive" },
      { test: "  Treponema pallidum Ab (TPHA)", result: "Non-reactive" },
      "BREAK",
      "Connective-Tissue Screen:",
      { test: "  Antinuclear Antibody (ANA, Hep-2)", result: "NEGATIVE" },
      { test: "  Anti-double-stranded DNA", result: "<10", unit: "IU/mL", ref: "<25 (negative)" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Infective screen negative. ANA negative — reduces classical SLE / drug-induced lupus likelihood, but does NOT exclude myositis-spectrum disease (myositis-specific antibodies are not detected by routine ANA assays). Recommend dedicated myositis-specific antibody panel.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p2_urinalysis() {
  await build("phase2/10-pantai-urinalysis-2026-04-08.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0394318-U",
      collected: "08.04.2026",
      reported: "08.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Urinalysis", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      { test: "Protein", result: "1+", flag: "H" },
      { test: "Glucose", result: "Trace" },
      { test: "Urobilinogen", result: "16.0", unit: "umol/L", ref: "<8.0", flag: "H" },
      { test: "Blood / haematuria", result: "Negative" },
      { test: "RBC casts", result: "None" },
      { test: "WBC / leukocytes", result: "Negative" },
      { test: "Nitrites", result: "Negative" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: Mild proteinuria (1+) and trace glycosuria — likely acute-phase / steroid-related rather than glomerular nephritis. No casts or active sediment to suggest lupus nephritis.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

// =============================================================================
// PHASE 3 — definitive: 18-marker myositis panel + biopsy + follow-up
// =============================================================================

async function p3_myositis_panel() {
  await build("phase3/11-pathlab-myositis-18ag-panel-2026-04-15.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pathlab, {
      lab_no: "PL-MYO-2026-04-15-002",
      collected: "12.04.2026",
      reported: "15.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Inflammatory Myopathy Autoimmune Profile (18-marker)", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      "Myositis-Specific Antibodies (MSA):",
      { test: "  Anti-NXP2", result: "POSITIVE", flag: "POS" },
      { test: "  Anti-HMGCR", result: "POSITIVE", flag: "POS" },
      { test: "  Anti-Jo-1", result: "Negative" },
      { test: "  Anti-MDA5", result: "Negative" },
      { test: "  Anti-TIF1g", result: "Negative" },
      { test: "  Anti-SAE1", result: "Negative" },
      { test: "  Anti-SRP", result: "Negative" },
      { test: "  Anti-Mi-2 (a + b)", result: "Negative" },
      { test: "  Anti-PL-7", result: "Negative" },
      { test: "  Anti-PL-12", result: "Negative" },
      { test: "  Anti-EJ", result: "Negative" },
      { test: "  Anti-OJ", result: "Negative" },
      "BREAK",
      "Myositis-Associated Antibodies (MAA):",
      { test: "  Anti-Ku", result: "Negative" },
      { test: "  Anti-Scl100 / Anti-Scl75", result: "Negative" },
      { test: "  Anti-Ro52", result: "Negative" },
      { test: "  Anti-cN-1A (NT5C1A)", result: "Negative" },
    ], y, fonts);
    y -= 6;
    drawWrapped(
      page,
      "RESULT: Dual myositis-specific antibody positivity — Anti-NXP2 AND Anti-HMGCR — with ALL other 16 markers negative. This combination is uncommon but recognised. Anti-NXP2 is associated with adult dermatomyositis, calcinosis, and a 15-30% paraneoplastic risk; Anti-HMGCR is associated with immune-mediated necrotising myopathy (often statin-triggered, but ~40% are statin-naive). Creatine kinase can normalise rapidly with treatment, which may explain the currently normal CK on this case. Recommend: muscle biopsy if not yet performed; comprehensive age-appropriate cancer screening; consider whole-body PET-CT.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p3_followup_fbc() {
  await build("phase3/12-pantai-followup-fbc-lft-2026-04-21.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pantai, {
      lab_no: "10L0395112",
      collected: "21.04.2026",
      reported: "21.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "2-Week Outpatient Follow-up", y, fonts);
    y = drawTableHeader(page, y, fonts);
    y = addRows(page, [
      "Haematology (vs admission values):",
      { test: "  Haemoglobin", result: "10.7 (was 9.4)", unit: "g/dL", ref: "13.0-18.0", flag: "L" },
      { test: "  Red Cell Distribution Width", result: "19.0 (was 16.1)", unit: "%", ref: "<14.3", flag: "H" },
      { test: "  White Blood Cell", result: "16.3 (was 19.5)", unit: "x10^9/L", ref: "4-11", flag: "H" },
      { test: "  Neutrophils #", result: "10.9 (was 15.5)", unit: "x10^9/L", ref: "2-7.5", flag: "H" },
      { test: "  Eosinophils #", result: "0.11 (was 0.80)", unit: "x10^9/L", ref: "0.04-0.40" },
      { test: "  Platelet", result: "405 (was 657)", unit: "x10^9/L", ref: "150-400" },
      { test: "  ESR", result: "28 (was 118)", unit: "mm/hr", ref: "<31" },
      "BREAK",
      "Liver Function:",
      { test: "  Total Protein", result: "67 (was 86)", unit: "g/L", ref: "57-82" },
      { test: "  Albumin", result: "30 (was 23)", unit: "g/L", ref: "34-50", flag: "L" },
      { test: "  Globulin", result: "37 (was 63)", unit: "g/L", ref: "20-42" },
      { test: "  Albumin/Globulin ratio", result: "0.81 (was 0.37)", unit: "", ref: "1.0-2.0", flag: "L" },
      { test: "  AST", result: "18 (was 64)", unit: "U/L", ref: "<34" },
      { test: "  ALT", result: "20 (was 29)", unit: "U/L", ref: "10-49" },
      "BREAK",
      "Renal & Glucose:",
      { test: "  Creatinine", result: "108 (was 101)", unit: "umol/L", ref: "65-104", flag: "H" },
      { test: "  eGFR", result: "63 (was 68)", unit: "mL/min/1.73m^2", ref: ">90", flag: "L" },
      { test: "  Glucose", result: "7.7 (was 5.8)", unit: "mmol/L", ref: "<7.7", flag: "H" },
      { test: "  Creatine Kinase", result: "34 -> 34", unit: "U/L", ref: "46-171" },
    ], y, fonts);
    y -= 8;
    drawWrapped(
      page,
      "Impression: MARKED treatment response across inflammatory markers (ESR 118->28, WBC, neutrophils, platelets, globulin, AST all normalising or markedly improved). Albumin recovering. Glucose now in IFG range — likely steroid-induced. Renal function mildly worse — monitor. Creatine kinase remains normal throughout (consistent with HMGCR-IMNM treated early).",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

async function p3_skin_biopsy() {
  await build("phase3/13-pathlab-skin-biopsy-2026-04-18.pdf", (page, fonts) => {
    let y = drawHeader(page, LABS.pathlab, {
      lab_no: "PL-HISTO-2026-04-18-114",
      collected: "16.04.2026",
      reported: "18.04.2026",
    }, fonts);
    y = drawSectionTitle(page, "Histopathology — Skin Biopsy (left dorsum hand, MCP region)", y, fonts);
    y = addRows(page, [
      { test: "Specimen", result: "Punch biopsy 4 mm, dorsal MCP" },
      { test: "Epidermis", result: "Mild interface dermatitis with vacuolar degeneration of basal keratinocytes" },
      { test: "Dermis", result: "Sparse perivascular lymphocytic infiltrate; mild dermal mucin deposition" },
      { test: "DIF (direct immunofluorescence)", result: "Granular IgG/IgM at dermo-epidermal junction" },
      { test: "Special stains", result: "PAS — no fungal elements; Alcian blue — mucin positive" },
    ], y, fonts);
    y -= 6;
    drawWrapped(
      page,
      "Conclusion: Histopathology compatible with DERMATOMYOSITIS spectrum. Interface dermatitis with dermal mucin and granular junctional immunoreactant deposition is characteristic. Combined with serology (Anti-NXP2 + Anti-HMGCR positive on the 18-marker panel) and clinical photographs, the picture supports an overlap inflammatory myopathy with dermatomyositis features.",
      36, y, { font: fonts.italic, colour: PALETTE.ink }, fonts,
    );
  });
}

// =============================================================================
// run
// =============================================================================

const builders = [
  p1_fbc_admission,
  p1_bma,
  p1_cultures,
  p1_troponin_quantiferon,
  p1_skin_findings,
  p2_lft_rft,
  p2_followup_fbc_apttp,
  p2_tumour_markers,
  p2_hep_syph_ana,
  p2_urinalysis,
  p3_myositis_panel,
  p3_followup_fbc,
  p3_skin_biopsy,
];

for (const b of builders) {
  await b();
}
console.log(`\nDone — ${builders.length} redacted PDFs generated under ${OUT_ROOT}`);
