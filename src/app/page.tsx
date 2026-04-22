import DropZone from "@/components/DropZone";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Patient Atlas</h1>
            <p className="text-sm text-zinc-500">Huantuk — post-workup diagnostic synthesis for baffling cases</p>
          </div>
          <a
            href="https://github.com/RC24bc/huantuk"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            github.com/RC24bc/huantuk →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            For doctors treating patients whose symptoms remain unexplained after investigations.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Upload the full folder — lab panels, imaging reports, clinic letters, clinical photos — from any combination of hospitals. Patient Atlas builds a unified longitudinal timeline, scores the case against published classification criteria (Yamaguchi, EULAR/ACR IIM, SLICC, IgG4-RD, ANCA-associated vasculitis, Sjögren&apos;s), and generates a handoff letter in the receiving specialist&apos;s register.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4 max-w-2xl">
            Decision support for clinicians. Not a diagnostic device. Not patient-facing.
          </p>
        </section>

        <DropZone />

        <section className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Feature
            title="Longitudinal timeline"
            body="Heterogeneous PDFs + images merged into one time-keyed view grouped by organ system."
          />
          <Feature
            title="Criteria scoring"
            body="Met / unmet / unknown against each of seven published classification criteria sets."
          />
          <Feature
            title="Honest re-weighting"
            body="The differential shifts visibly as new labs arrive; we flag the single next test with highest information gain."
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
