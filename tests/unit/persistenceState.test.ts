import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  });
});

import { hasUnsavedChangesFor } from "../../src/lib/filesystem/persistenceState.svelte";
import type { MarkdownDocument } from "../../src/lib/markdown/types";

function makeDocument(
  raw: string,
  overrides: Partial<MarkdownDocument> = {},
): MarkdownDocument {
  return {
    path: null,
    filename: "test.md",
    raw,
    blocks: [],
    html: "",
    dirty: false,
    lastSavedRaw: raw,
    ...overrides,
  };
}

describe("hasUnsavedChangesFor", () => {
  it("returns false when raw matches lastSavedRaw even if blocks differ", () => {
    const document = makeDocument("# Hello\n\nWorld", {
      blocks: [
        {
          id: "different-id",
          type: "heading",
          startOffset: 0,
          endOffset: 7,
          raw: "# Hello",
          html: "<h1>Hello</h1>",
        },
      ],
    });

    expect(hasUnsavedChangesFor(document)).toBe(false);
  });

  it("returns true when raw differs from lastSavedRaw", () => {
    const document = makeDocument("# Hello", {
      lastSavedRaw: "# Hi",
      dirty: true,
    });

    expect(hasUnsavedChangesFor(document)).toBe(true);
  });

  it("returns dirty state when there is no lastSavedRaw", () => {
    expect(hasUnsavedChangesFor(makeDocument("draft", { lastSavedRaw: undefined, dirty: true }))).toBe(
      true,
    );
    expect(hasUnsavedChangesFor(makeDocument("draft", { lastSavedRaw: undefined, dirty: false }))).toBe(
      false,
    );
  });
});
