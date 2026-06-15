import { describe, expect, it } from "vitest";
import { replaceBlockInRaw } from "../../src/lib/markdown/replaceBlock";

describe("replaceBlockInRaw", () => {
  it("replaces a block slice in the document raw text", () => {
    const raw = "# Title\n\nParagraph one.\n\nParagraph two.";
    const next = replaceBlockInRaw(raw, 9, 25, "Updated paragraph.");

    expect(next).toContain("Updated paragraph.");
    expect(next).toContain("# Title");
    expect(next).toContain("Paragraph two.");
  });
});
