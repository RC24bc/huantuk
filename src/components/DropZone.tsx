"use client";

import { useCallback, useRef, useState } from "react";

export type ExtractedDoc = {
  filename: string;
  status: "pending" | "extracting" | "done" | "error";
  error?: string;
  summary?: string;
  extracted?: unknown;
};

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
        update((prev) => prev.map((d, j) => (j === idx ? { ...d, status: "extracting" } : d)));
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await fetch("/api/ingest", { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
          update((prev) =>
            prev.map((d, j) =>
              j === idx
                ? { ...d, status: "done", summary: json.summary, extracted: json.extracted }
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
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {docs.length > 0 && (
        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {docs.map((d, i) => (
            <li key={i} className="flex items-start justify-between p-4 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{d.filename}</p>
                {d.summary && <p className="text-xs text-zinc-500 mt-1 line-clamp-3">{d.summary}</p>}
                {d.error && <p className="text-xs text-red-600 mt-1">{d.error}</p>}
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
