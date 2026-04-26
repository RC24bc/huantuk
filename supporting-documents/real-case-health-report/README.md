# Real Case Health Reports — Test Inputs for Judges

A complete real-world test case: **50 redacted health reports** from a real
inflammatory myopathy (IIM) patient at three different Malaysian healthcare
providers. Use these to exercise Huantuk end-to-end.

## How to use

1. Open the live app: <https://huantuk.vercel.app>
2. Drop one or more files from `pdfs/` or `images/` onto the dropzone (or click upload).
3. Watch Huantuk extract findings, rank differentials, score classification criteria,
   suggest next tests, and (if you continue to drug discovery) propose repurposed
   drugs / off-label options / clinical trials — all with citations.

## What's in this set

```
pdfs/    11 PDFs   — typeset lab reports (full multi-page panels)
images/  39 JPEGs  — phone photos of additional reports
```

### `pdfs/` (11 files, 81 pages total)

Multi-page lab reports from three providers across the patient's diagnostic journey:

| File | Source | Pages | Notes |
|---|---|---|---|
| 01–03 | Hospital A — Pantai Hospital Ipoh | 29 | Discharge summary + admission labs (Apr 7–10) |
| 04–08 | Hospital B — KPJ | 33 | Tumour markers, hepatitis/syphilis, urinalysis |
| 09–11 | Third lab — Pathlab | 19 | Myositis 18-AG panel, skin biopsy |

The myositis panel inside `09-third-lab-report-1.pdf` is the diagnostic pivot — anti-NXP2 and anti-HMGCR positivity drove the IIM differential.

### `images/` (39 files)

Phone snapshots of supporting reports the patient brought in:
- `01–29-photo-2026-04-15.jpeg` — admission-week photos (echocardiogram, bone marrow aspiration, microbiology cultures, fluid analyses)
- `30–39-photo-2026-04-25.jpeg` — 2-week follow-up bloods (FBC + LFT + RFT + IIM panel + urine FEME)

## Privacy

Patient name, IC, date of birth, MRN, lab numbers, barcode, and treating-clinician names have all been blackout-redacted. PDFs were redacted via text-search redaction (PyMuPDF) — the underlying glyphs are erased, not just visually covered. JPEGs were redacted via OCR-anchored visual blackout. Only de-identified clinical content remains.

A pre-commit `.githooks/pre-commit` PII guardrail blocks any file matching identifier fingerprints, so this folder ships clean by construction.

## File counts

| | Files | Total pages of clinical data |
|---|---:|---:|
| PDFs | 11 | 81 |
| JPEGs | 39 | 39 |
| **Total** | **50** | **120** |
