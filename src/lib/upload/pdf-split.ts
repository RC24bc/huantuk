import { PDFDocument } from "pdf-lib";

export type SplitResult =
  | { kind: "ok"; parts: File[] }
  | { kind: "single-page-too-large"; size: number }
  | { kind: "not-pdf" }
  | { kind: "error"; message: string };

// Vercel serverless body limit is 4.5 MB. Target chunks <=4 MB so multipart
// boundary + form overhead leaves comfortable margin.
const TARGET_CHUNK_BYTES = 4 * 1024 * 1024;

export async function splitPdfIfNeeded(file: File, maxBytes: number): Promise<SplitResult> {
  if (file.size <= maxBytes) return { kind: "ok", parts: [file] };
  if (file.type !== "application/pdf") return { kind: "not-pdf" };

  try {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pageCount = src.getPageCount();
    if (pageCount <= 1) return { kind: "single-page-too-large", size: file.size };

    const baseName = file.name.replace(/\.pdf$/i, "");

    // Start with the proportional estimate, grow chunk count if any chunk
    // serializes larger than TARGET_CHUNK_BYTES (heterogeneous page sizes).
    let chunks = Math.max(2, Math.ceil(file.size / TARGET_CHUNK_BYTES));
    while (chunks <= pageCount) {
      const pagesPerChunk = Math.ceil(pageCount / chunks);
      const parts: File[] = [];
      let allFit = true;

      for (let start = 0; start < pageCount; start += pagesPerChunk) {
        const end = Math.min(start + pagesPerChunk, pageCount);
        const sub = await PDFDocument.create();
        const indices = Array.from({ length: end - start }, (_, k) => start + k);
        const copied = await sub.copyPages(src, indices);
        copied.forEach((p) => sub.addPage(p));
        const bytes = await sub.save();
        if (bytes.byteLength > TARGET_CHUNK_BYTES) {
          allFit = false;
          break;
        }
        parts.push(
          new File([new Uint8Array(bytes)], `${baseName} (part ${parts.length + 1}).pdf`, {
            type: "application/pdf",
          }),
        );
      }

      if (allFit) {
        return { kind: "ok", parts: parts.map(renameWithTotal) };
      }
      chunks++;
    }

    return { kind: "error", message: "Could not split PDF into chunks under 4 MB. Compress and retry." };
  } catch (err: unknown) {
    return { kind: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

function renameWithTotal(file: File, _i: number, arr: File[]): File {
  const total = arr.length;
  const m = file.name.match(/^(.*) \(part (\d+)\)\.pdf$/i);
  if (!m) return file;
  return new File([file], `${m[1]} (part ${m[2]}/${total}).pdf`, { type: file.type });
}
