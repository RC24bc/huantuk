"use client";

import { useCallback, useRef, useState } from "react";

// Vercel serverless functions cap request bodies at 4.5 MB. Reject above this
// before the upload starts so the user sees a useful message instead of the
// platform's plain-text 413, which crashes res.json() with "Unexpected token 'R'".
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 + 256 * 1024; // 4.25 MB safety margin under Vercel's 4.5 MB limit

export type ExtractedDoc = {
  filename: string;
  status: "pending" | "extracting" | "done" | "error";
  error?: string;
  summary?: string;
  extracted?: unknown;
};

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function parseIngestResponse(res: Response): Promise<{ ok: true; data: { summary?: string; extracted?: unknown } } | { ok: false; error: string }> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (res.status === 413 || /too large|payload|request body/i.test(text)) {
      return { ok: false, error: "PDF exceeds Vercel's 4.5 MB upload limit. Split or compress the file and try again." };
    }
    return { ok: false, error: `Server returned ${res.status} ${res.statusText || ""}`.trim() };
  }
  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data ? String((data as { error: unknown }).error) : `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true, data: (data ?? {}) as { summary?: string; extracted?: unknown } };
}

type Props = {
  onDocsChange?: (docs: ExtractedDoc[]) => void;
};

export default function DropZone({ onDocsChange }: Props) {
  const [docs, setDocs] = useState<ExtractedDoc[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (next: ExtractedDoc[] | ((prev: ExtractedDoc[]) => ExtractedDoc[])) => {
      setDocs((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        onDocsChange?.(value);
        return value;
      });
    },
    [onDocsChange],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const incoming: ExtractedDoc[] = Array.from(files).map((f) => ({
        filename: f.name,
        status: "pending",
      }));
      let baseLen = 0;
      update((prev) => {
        baseLen = prev.length;
        return [...prev, ...incoming];
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const idx = baseLen + i;

        if (file.size > MAX_UPLOAD_BYTES) {
          update((prev) =>
            prev.map((d, j) =>
              j === idx
                ? {
                    ...d,
                    status: "error",
                    error: `File is ${formatMb(file.size)} — exceeds Vercel's 4.5 MB upload limit. Split into smaller PDFs (e.g. one per visit) or compress and retry.`,
                  }
                : d,
            ),
          );
          continue;
        }

        update((prev) => prev.map((d, j) => (j === idx ? { ...d, status: "extracting" } : d)));
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/ingest", { method: "POST", body: form });
          const parsed = await parseIngestResponse(res);
          if (!parsed.ok) throw new Error(parsed.error);
          update((prev) =>
            prev.map((d, j) =>
              j === idx
                ? { ...d, status: "done", summary: parsed.data.summary, extracted: parsed.data.extracted }
                : d,
            ),
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          update((prev) => prev.map((d, j) => (j === idx ? { ...d, status: "error", error: msg } : d)));
        }
      }
    },
    [update],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={
          "rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors " +
          (dragging
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-50 dark:bg-zinc-900"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500")
        }
      >
        <p className="text-base font-medium mb-1">Drop the folder of documents here</p>
        <p className="text-sm text-zinc-500">PDFs, JPEGs, PNGs · any facility · any order</p>
        <input
          id="huantuk-file-input"
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {docs.some((d) => d.status === "error") && (
        <div role="alert" className="mt-4 rounded-md border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-900 p-4">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            We couldn&apos;t read one or more of those files.
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            Specific errors are shown next to each file below. PDFs larger than 4.5 MB exceed the upload limit — split them (one visit / one report per file) or compress and retry. If every file is failing with the same backend error, the server is likely missing an API key — let your operator know.
          </p>
        </div>
      )}

      {docs.length > 0 && (
        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {docs.map((d, i) => (
            <li key={i} className="flex items-start justify-between p-4 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.filename}</p>
                {d.summary && <p className="text-xs text-zinc-500 mt-1 line-clamp-3">{d.summary}</p>}
                {d.error && <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-mono">{d.error}</p>}
              </div>
              <StatusBadge status={d.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ExtractedDoc["status"] }) {
  const styles: Record<ExtractedDoc["status"], string> = {
    pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
    extracting: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  };
  const labels: Record<ExtractedDoc["status"], string> = {
    pending: "queued",
    extracting: "extracting…",
    done: "done",
    error: "error",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
