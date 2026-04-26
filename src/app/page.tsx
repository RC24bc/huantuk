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
      <HowItWorks />
      <RealCase />
      <TrySection />
      <NotADiagnosis />
      <ForDoctors />
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
          <Link href="/clinician" className="hover:text-stone-900">For doctors</Link>
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
          For people living with an undiagnosed autoimmune illness
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-stone-900">
          When five hospitals can&apos;t tell you what&apos;s wrong.
        </h1>
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-stone-600">
          Huantuk reads every report you&apos;ve ever had — across every clinic — and
          tells you, in plain English, what&apos;s most likely going on. Then it tells
          your doctor the single test that would settle it.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row gap-3">
          <Link
            href="/?case=iim-double-msa#start"
            className="inline-flex items-center justify-center rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-3 text-sm sm:text-base transition-colors"
          >
            Try a real Malaysian case →
          </Link>
          <UploadCTA>Drop your own reports</UploadCTA>
        </div>
        <p className="mt-5 text-sm text-stone-500">
          Built on Claude Opus 4.7 · Open source · No login · Private to your browser.
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
          line="people on Earth live with an autoimmune disease."
        />
        <Stat
          big="4+ years"
          line="is the average wait before a diagnosis is finally made."
        />
        <Stat
          big="30–50%"
          line="of patients stay uncured even on the standard textbook treatment."
        />
      </div>
      <p className="mt-6 text-xs text-stone-500">
        Source: Hayter &amp; Cook, <em>Autoimmunity Reviews</em>, 2012; subsequent
        EULAR/ACR registries.
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

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Drop your reports.",
      body: "Lab results, scans, hospital letters, even photos of a rash. Any clinic. Any order. PDFs and JPGs.",
    },
    {
      n: "02",
      title: "Claude reads everything.",
      body: "It builds your timeline, scores you against seven published checklists for autoimmune disease, and flags what's missing.",
    },
    {
      n: "03",
      title: "You get a plain-English answer.",
      body: "The most likely diagnoses, ranked. The single test that would tell us most. A printable note you can hand to your GP.",
    },
  ];

  return (
    <section className="bg-white border-y border-stone-200">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-prose mb-12">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
            How it works
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            From a folder of confusing reports to a clear next step.
          </h2>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((s) => (
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

function RealCase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
            Try it on a real case
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Five hospitals. Five months.
            <br />
            No diagnosis.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-600 max-w-prose">
            This is a real Malaysian patient case — the uncle of our founder, Dr
            Edwin Chua. We&apos;ve removed his name and IC. Eleven PDFs, twenty-nine
            clinical photos, three hospitals, five months of investigations, and
            still no answer.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-stone-600 max-w-prose">
            Watch Huantuk read all of it and reach a probable diagnosis in under{" "}
            <span className="font-semibold text-stone-900">eight seconds</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/?case=iim-double-msa#start"
              className="inline-flex items-center justify-center rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-3 text-sm sm:text-base transition-colors"
            >
              Run uncle&apos;s case →
            </Link>
            <UploadCTA>Or upload your own reports</UploadCTA>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm">
            <Image
              src="/redacted-pdf-stack.png"
              alt="A stack of redacted medical PDFs from KPJ, Pantai and Pathlab — uncle's real case (name and IC blacked out)."
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Real reports. Name and IC redacted before any of this ever leaves
            the family.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrySection() {
  return (
    <section id="start" className="bg-white border-y border-stone-200 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-prose mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-teal-700">
            Try it now
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Ready when you are.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-600">
            Drop your folder of reports below — or pick one of our demo cases to
            see how it works. Nothing is uploaded anywhere except Anthropic&apos;s
            API for the reading itself; we don&apos;t store your reports.
          </p>
        </div>

        <PatientAtlasShell />
      </div>
    </section>
  );
}

function NotADiagnosis() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 sm:p-10 max-w-prose mx-auto">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-900">
          Important
        </p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-stone-900">
          Huantuk doesn&apos;t diagnose you.
        </h2>
        <p className="mt-4 text-base sm:text-lg leading-relaxed text-stone-700">
          It explains your reports, finds the gaps, and tells your doctor which
          test would tell us most. Your treating doctor stays the prescriber.
          We&apos;re here to help you ask the right questions, not replace the
          consultation.
        </p>
      </div>
    </section>
  );
}

function ForDoctors() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-2xl bg-stone-900 text-stone-100 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="max-w-prose">
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
            You&apos;re a doctor?
          </h3>
          <p className="mt-2 text-stone-300 leading-relaxed">
            The clinical view shows the criteria scoring panel, mimic check,
            information-gain ranking on next investigations, and the drug
            repurposing / off-label / clinical-trial agents.
          </p>
        </div>
        <Link
          href="/clinician"
          className="shrink-0 inline-flex items-center justify-center rounded-md bg-white hover:bg-stone-200 text-stone-900 font-medium px-5 py-3 text-sm sm:text-base transition-colors"
        >
          Open clinician view →
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-stone-500">
        <p>
          Built on Claude Opus 4.7 · Cerebral Valley × Anthropic hackathon ·
          Open source (MIT)
        </p>
        <div className="flex gap-5">
          <a href="https://github.com/RC24bc/huantuk" className="hover:text-stone-900">
            github.com/RC24bc/huantuk
          </a>
          <Link href="/clinician" className="hover:text-stone-900">
            Clinician view
          </Link>
        </div>
      </div>
    </footer>
  );
}
