import Anthropic from "@anthropic-ai/sdk";

// Model tier:
//   OPUS — headline reasoning step (synthesise). Marketing claim "Built on Opus 4.7"
//          rests on this route. Don't downgrade.
//   SONNET — downstream agents (mimic check, drug discovery, trial match,
//            suggest tests). Quality is comparable for structured tasks at ~5× lower cost.
//   HAIKU — pure document parsing (ingest). PDF/image extraction doesn't need
//           heavy reasoning; ~40× cheaper than Opus.
export const OPUS_MODEL = "claude-opus-4-7";
export const SONNET_MODEL = "claude-sonnet-4-6";
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

// Kept as alias for compatibility — equals OPUS by default. Prefer the explicit
// tier constants above in new code.
export const DEFAULT_MODEL = OPUS_MODEL;

export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function safeParseJson<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    const match = s.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

export function extractText(content: Anthropic.ContentBlock[]): string {
  const textBlock = content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}
