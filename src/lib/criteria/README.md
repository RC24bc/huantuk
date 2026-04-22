# Classification criteria + evidence base

Each disease gets one JSON file. Each file holds both:

1. The **classification criteria** encoded for the scoring engine.
2. A `references[]` array — peer-reviewed citations the doctor can point to.

## Reference schema

```json
{
  "type": "classification_criteria | landmark_review | landmark_review_nejm | management_guideline | primer | trial_landmark_nejm | epidemiology_clinical | biomarker | pathogenesis_update | diagnostic_pathology | autoantibody_evidence | ...",
  "title": "Full article title",
  "authors": "First A, Second B, Third C, et al.",
  "journal": "N Engl J Med",
  "year": 2019,
  "volume": "71",
  "issue": "9",
  "pages": "1400-1412",
  "doi": "10.1002/art.40930",
  "pmid": "31385462",
  "also_published": "Ann Rheum Dis. 2019;78(9):1151-1159. ...",
  "why_it_matters": "One sentence on what this paper contributes to the differential — what the clinician would cite it for.",
  "verify_pending": false
}
```

## Journals prioritised

Seeded from the landmark literature a rheumatologist or internist would cite:

- **New England Journal of Medicine** (`N Engl J Med`) — landmark reviews and trials
- **The Lancet** — seminar reviews (RA, SLE)
- **Annals of the Rheumatic Diseases** (`Ann Rheum Dis`) — classification criteria and EULAR guidance
- **Arthritis & Rheumatology** (`Arthritis Rheumatol`) — ACR criteria and management statements
- **JAMA** — when a paper defines the field
- **Nature Reviews Rheumatology** (`Nat Rev Rheumatol`) — authoritative state-of-the-art
- **Nature Reviews Disease Primers** (`Nat Rev Dis Primers`) — comprehensive disease overviews
- **Lancet Neurology** / **Lancet Rheumatology** — subspecialty reviews
- **J Clin Invest / Blood / JCI** — landmark mechanistic papers

## Honesty caveat — important

These references were **seeded by Claude** from its training corpus. The titles, authors, journal+year+volume+pages are expected to be accurate for canonical papers — but:

- **DOIs and PMIDs may drift**: always verify against PubMed before quoting.
- Any reference with `"verify_pending": true` needs manual confirmation — typically because the exact volume/issue/pages wasn't something I was 100% sure of at seeding time.
- Run `scripts/verify-references.mjs` to batch-check every DOI/PMID against the NCBI E-utilities API.

We ship fewer, highly canonical citations rather than long lists of uncertain ones. Better to under-cite than to fabricate.

## Adding a new reference

1. Prefer **classification criteria / landmark review / primer / management guideline / key trial** types.
2. Always include a `why_it_matters` line — this is what the clinician reads.
3. If you're not sure of the DOI, set `"verify_pending": true` and leave the `doi` field out.
4. Run the verify script before committing.

## File naming convention

`<consortium>-<disease>-<year>.json` — e.g. `acr-eular-sle-2019.json`, `yamaguchi-aosd.json`. Classification criteria usually dictate the stem.
