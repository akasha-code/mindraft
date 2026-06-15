import { describe, expect, it } from "vitest";
import { getDocumentStats } from "../../src/lib/document/stats";

describe("getDocumentStats", () => {
  it("counts words and estimates reading time", () => {
    const stats = getDocumentStats("one two three four five six seven eight nine ten");

    expect(stats.words).toBe(10);
    expect(stats.characters).toBeGreaterThan(0);
    expect(stats.readingMinutes).toBeGreaterThanOrEqual(1);
  });
});
