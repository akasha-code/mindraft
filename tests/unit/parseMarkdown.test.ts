import { describe, expect, it } from "vitest";
import { extractBlocksFromRaw } from "../../src/lib/markdown/blockRanges";

describe("extractBlocksFromRaw", () => {
  it("extracts headings and paragraphs as separate blocks", () => {
    const raw = "# Hello\n\nWorld";
    const blocks = extractBlocksFromRaw(raw);

    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks.some((block) => block.type === "heading")).toBe(true);
    expect(blocks.some((block) => block.type === "paragraph")).toBe(true);
  });
});
