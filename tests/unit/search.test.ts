import { describe, expect, it } from "vitest";
import { findMatchesInBlocks } from "../../src/lib/search/findMatches";
import type { MarkdownBlock } from "../../src/lib/markdown/types";

const blocks: MarkdownBlock[] = [
  {
    id: "a",
    type: "paragraph",
    startOffset: 0,
    endOffset: 11,
    raw: "Hello world",
    html: "<p>Hello world</p>",
  },
  {
    id: "b",
    type: "paragraph",
    startOffset: 12,
    endOffset: 22,
    raw: "hello again",
    html: "<p>hello again</p>",
  },
];

describe("findMatches", () => {
  it("finds case-insensitive matches by default", () => {
    const matches = findMatchesInBlocks(blocks, "hello");
    expect(matches).toHaveLength(2);
  });
});
