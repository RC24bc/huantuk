import Link from "next/link";
import PatientAtlasShell from "@/components/PatientAtlasShell";

export default function ClinicianHome() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <Link href="/" className="hover:opacity-80">Huantuk</Link>
              <span className="text-zinc-400 mx-2">·</span>
              <span>Clinician view</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Diagnostic synthesis + personalised drug discovery for autoimmune cases that don&apos;t fit the textbook
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-50">Patient view</Link>
            <a
              href="https://github.com/RC24bc/huantuk"
              className="hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              github →
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            For doctors treating patients whose symptoms remain unexplained after investigations.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Upload the full folder — lab panels, imaging reports, clinic letters, clinical photos — from any combination of hospitals. Huantuk builds a unified case object, scores the patient against published classification criteria (Yamaguchi AOSD, EULAR/ACR IIM, SLE, RA, AAV, IgG4-RD, Sjögren&apos;s), screens for autoimmune mimics, ranks the next highest-information-gain investigations, and — when standard care has been exhausted — surfaces drug repurposing, off-label and clinical-trial candidates with citations and Malaysian access pathways.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 max-w-2xl">
            Clinical decision support. Not a diagnostic device. The treating doctor remains the prescriber.
          </p>
        </section>

        <PatientAtlasShell />

        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Feature
            title="Diagnostic Synthesizer"
            body="Heterogeneous PDFs merged into one case. Cited differential reasoning. Criteria scored. Mimics flagged."
          />
          <Feature
            title="What's missing"
            body="Opus 4.7 ranks the next 5 tests with highest information gain — so doctors order the test that actually moves the diagnosis."
          />
          <Feature
            title="Drug Repurposing + Off-Label"
            body="When standard care runs out: existing drugs whose mechanism plausibly addresses this patient&apos;s phenotype, with Malaysian access pathways."
          />
          <Feature
            title="Trial Matching"
            body="Currently enrolling trials globally — flight cost from KL, inclusion match reasoning, exclusion concerns flagged for clinician review."
          />
        </section>

        <footer className="mt-20 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
          Built on Claude Opus 4.7 · Cerebral Valley × Anthropic hackathon · Open source (MIT)
        </footer>
      </main>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
