import AppShell from "@/components/AppShell";
import type { Mode, View } from "@/lib/persona";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const modeRaw = typeof sp.mode === "string" ? sp.mode : undefined;
  const tabRaw =
    typeof sp.tab === "string" ? sp.tab : typeof sp.view === "string" ? sp.view : undefined;
  const initialMode: Mode = modeRaw === "patient" ? "patient" : "doctor";
  const initialView: View = tabRaw === "cure" ? "cure" : "diagnosis";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <AppShell initialMode={initialMode} initialView={initialView} />
    </div>
  );
}
