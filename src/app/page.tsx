import Link from "next/link";
import Image from "next/image";
import PatientAtlasShell from "@/components/PatientAtlasShell";
import UploadCTA from "@/components/UploadCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <Header />
      <Hero />
      <StatStrip />
      <Workflow />
      <Pricing />
      <RealCase />
      <TrySection />
      <Disclaimer />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-stone-50/80 border-b border-stone-200">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Huantuk
        </Link>
        <nav className="flex items-center gap-5 text-sm text-stone-600">
          <a href="#workflow" className="hover:text-stone-900">Workflow</a>
          <a href="#pricing" className="hover:text-stone-900">Pricing</a>
          <a
            href="https://github.com/RC24bc/huantuk"
            className="hover:text-stone-900"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 sm:pt-28 pb-12">
      <div className="max-w-prose">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-medium mb-6">
          <span className="size-1.5 rounded-full bg-amber-500" />
          For doctors with patients undiagnosed after standard workup
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-stone-900">
          The 50-page folder you didn&apos;t have time to read.
        </h1>
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-stone-600">
          Huantuk reads it for you in 60 seconds — every PDF, every scan, every
          clinical photo — and gives back cited differentials, classification-criteria
          scores against seven published checklists, and the next test ranked by
          information gain. Built on Claude Opus 4.7.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3">
          <Link
            href="/?case=iim-double-msa#start"
            className="inline-flex items-center justify-center rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-3 text-sm sm:text-base transition-colors"
          >
            Run a real Malaysian case →
          </Link>
          <UploadCTA>Upload your patient&apos;s folder</UploadCTA>
        </div>
        <p className="mt-5 text-sm text-stone-500">
          $30 per case · No subscription · Decision support only · Open source
        </p>
      </div>
    </section>
  );
}

function StatStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Stat
          big="1 in 10"
          line="Malaysians live with an autoimmune condition. Most are seen by 3+ specialists before diagnosis."
        />
        <Stat
          big="4+ years"
          line="is the average diagnostic delay in autoimmune disease — five hospitals, no answer."
        />
        <Stat
          big="30–50%"
          line="of diagnosed patients remain refractory on guideline therapy. Standard care has nothing more to offer."
        />
      </div>
      <p className="mt-6 text-xs text-stone-500">
        Hayter &amp; Cook, <em>Autoimmunity Reviews</em>, 2012; subsequent
        EULAR/ACR registries; Malaysian Society of Rheumatology, 2024.
      </p>
    </section>
  );
}

function Stat({ big, line }: { big: string; line: string }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-7">
      <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-teal-700">
        {big}
      </p>
      <p className="mt-3 text-base text-stone-700 leading-relaxed">{line}</p>
    </div>
  );
}

function Workflow() {
  const items = [
    {
      n: "01",
      title: "Unified case timeline",
      body:
        "Drag PDFs from any clinic, scans, lab panels, even WhatsApp clinical photos. Huantuk extracts every relevant finding, pins it chronologically, and groups by organ system.",
    },
    {
      n: "02",
      title: "Cited differential reasoning",
      body:
        "Top 5 differentials with calibrated posterior probabilities, supporting and contradicting findings, and 1–3 primary-source citations from the published literature. Never invented citations.",
    },
    {
      n: "03",
      title: "Classification criteria scorecards",
      body:
        "Yamaguchi AOSD · 2017 EULAR/ACR IIM · 2019 ACR/EULAR SLE · 2010 ACR/EULAR RA · 2022 ACR/EULAR AAV · 2019 ACR/EULAR IgG4-RD · 2016 ACR/EULAR Sjögren's. Met / unmet / unknown — never guessed.",
    },
    {
      n: "04",
      title: "Autoimmune mimic check",
      body:
        "For each top differential, Huantuk surfaces the non-autoimmune mimics that cluster around it (infection, malignancy, drug-induced) and the discriminating test for each.",
    },
    {
      n: "05",
      title: "Next-investigation ranking",
      body:
        "The five highest-information-gain tests for the case in front of you, weighed against patient context. So your next order is the test that actually moves the diagnosis.",
    },
    {
      n: "06",
      title: "Drug repurposing + off-label + trial matching",
      body:
        "When standard care has run out: three agents return cited drug-repurposing candidates, off-label options, and currently-recruiting trials — with Malaysian access pathways (DCA, Singapore HSA, US Expanded Access, EU Compassionate Use).",
    },
  ];

  return (
    <section id="workflow" className="bg-white border-y border-stone-200 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-prose mb-12">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
            What you get per case
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Six outputs. One workflow. Sixty seconds.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            Drop the folder. Huantuk runs the chain end-to-end. Every output is
            cited, every uncertainty is flagged, every recommendation is yours
            to override.
          </p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl border border-stone-200 p-6 sm:p-7 bg-stone-50"
            >
              <div className="text-sm font-mono text-teal-700">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold leading-snug">
                {s.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-stone-600">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20 sm:py-24 scroll-mt-20">
      <div className="max-w-prose mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
          Pricing
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
          $30 per case. No subscription.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-stone-600">
          One folder of reports → full Huantuk output: timeline, differentials,
          criteria scorecards, mimic check, next-investigation ranking, and (on
          request) drug repurposing. Pay as you consult.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PricingCard
          tone="primary"
          name="Per case"
          price="$30"
          unit="per case"
          features={[
            "Unlimited document upload per case",
            "Full diagnostic synthesis (Workflow 1)",
            "Drug repurposing on request (Workflow 2)",
            "Cited handoff letter for the next clinician",
            "Pay only when you run a case",
          ]}
          cta={{ href: "/?case=iim-double-msa#start", label: "Try a case →" }}
        />
        <PricingCard
          name="Clinic plan"
          price="Coming"
          unit="post-hackathon"
          features={[
            "Volume pricing for ≥10 cases / month",
            "Shared case library across your team",
            "Mediviron home-phlebotomy integration",
            "Tagenda Cemerlang drug-import bind",
            "Priority Opus 4.7 capacity",
          ]}
          cta={null}
        />
        <PricingCard
          name="Patient (future)"
          price="Free"
          unit="referred by clinic"
          features={[
            "Patient-facing intake by referral",
            "Forwards report to treating doctor",
            "Same engine, doctor-mediated only",
            "Never auto-prescribes",
            "Released after rheumatologist sign-off pipeline",
          ]}
          cta={null}
        />
      </div>

      <p className="mt-8 text-sm text-stone-500 max-w-prose">
        During the Cerebral Valley × Anthropic hackathon submission, billing is
        not yet wired. Run as many cases as you need to evaluate. Stripe
        integration ships post-judging.
      </p>
    </section>
  );
}

function PricingCard({
  tone,
  name,
  price,
  unit,
  features,
  cta,
}: {
  tone?: "primary";
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: { href: string; label: string } | null;
}) {
  const card =
    tone === "primary"
      ? "border-teal-600 bg-white ring-1 ring-teal-600/20 shadow-sm"
      : "border-stone-200 bg-white";
  return (
    <div className={`rounded-2xl border p-6 sm:p-7 flex flex-col ${card}`}>
      <p className="text-sm font-medium uppercase tracking-wider text-stone-500">
        {name}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-stone-900">
          {price}
        </p>
        <p className="text-sm text-stone-500">{unit}</p>
      </div>
      <ul className="mt-5 space-y-2 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex gap-2 text-sm text-stone-700 leading-relaxed">
            <span aria-hidden className="text-teal-700 mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-3 text-sm transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function RealCase() {
  return (
    <section className="bg-white border-y border-stone-200">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
              Real Malaysian case
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
              Five hospitals. Five months.
              <br />
              No diagnosis.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-stone-600 max-w-prose">
              Adult male, mid-60s. Pantai, KPJ, Pathlab. ANA negative. CK normal.
              Eleven PDFs and 29 clinical photos later, still no answer. Then
              the inflammatory-myopathy panel comes back: <strong>anti-NXP2 positive AND anti-HMGCR positive</strong>.
              Two myositis-specific antibodies. Normal CK. Atypical for either alone.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-stone-600 max-w-prose">
              Watch Huantuk read the full folder, score the EULAR/ACR 2017 IIM
              criteria, surface paraneoplastic risk, and rank the next test —
              in <span className="font-semibold text-stone-900">eight seconds</span>.
            </p>
            <p className="mt-3 text-sm text-stone-500 max-w-prose">
              Patient name and IC redacted before any data leaves the family.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?case=iim-double-msa#start"
                className="inline-flex items-center justify-center rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-3 text-sm sm:text-base transition-colors"
              >
                Run this case →
              </Link>
              <UploadCTA>Or upload your own folder</UploadCTA>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm">
              <Image
                src="/redacted-pdf-stack.png"
                alt="Stack of redacted medical PDFs from KPJ, Pantai and Pathlab — anti-NXP2 + anti-HMGCR IIM case (name and IC blacked out)."
                width={1920}
                height={1080}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrySection() {
  return (
    <section id="start" className="mx-auto max-w-5xl px-6 py-20 sm:py-24 scroll-mt-20">
      <div className="max-w-prose mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
          Run a case
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
          Drop the folder. Get the synthesis.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-stone-600">
          Pick one of the five demo presets to see the workflow without the API
          spend, or upload a real folder. Reports are sent to Anthropic for
          reading only — Huantuk does not store them.
        </p>
      </div>

      <PatientAtlasShell />
    </section>
  );
}

function Disclaimer() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 sm:p-10 max-w-prose mx-auto">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-900">
          Regulatory framing
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-stone-900">
          Clinical decision support. Not a diagnostic device.
        </h2>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-stone-700">
          Huantuk synthesises evidence and surfaces options. It does not
          prescribe, it does not diagnose, and it does not replace the
          consultation. Output is intended for use by registered medical
          practitioners only. The treating doctor remains the prescriber.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-stone-500">
        <p>
          Built on Claude Opus 4.7 + Sonnet 4.6 + Haiku 4.5 · Cerebral Valley ×
          Anthropic hackathon · MIT
        </p>
        <div className="flex gap-5">
          <a href="https://github.com/RC24bc/huantuk" className="hover:text-stone-900">
            github.com/RC24bc/huantuk
          </a>
          <a href="#pricing" className="hover:text-stone-900">
            Pricing
          </a>
        </div>
      </div>
    </footer>
  );
}
