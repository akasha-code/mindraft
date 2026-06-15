import type { MarkdownBlock } from "$lib/markdown/types";

export type SearchMatchOptions = {
  caseSensitive: boolean;
  useRegex: boolean;
};

export type SearchMatch = {
  blockId: string;
  start: number;
  end: number;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(query: string, options: SearchMatchOptions): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (options.useRegex) {
      return new RegExp(trimmed, options.caseSensitive ? "g" : "gi");
    }

    return new RegExp(
      escapeRegExp(trimmed),
      options.caseSensitive ? "g" : "gi",
    );
  } catch {
    return null;
  }
}

export function findMatchesInBlocks(
  blocks: MarkdownBlock[],
  query: string,
  options: SearchMatchOptions = { caseSensitive: false, useRegex: false },
): SearchMatch[] {
  const pattern = buildPattern(query, options);
  if (!pattern) {
    return [];
  }

  const matches: SearchMatch[] = [];

  for (const block of blocks) {
    pattern.lastIndex = 0;
    let match = pattern.exec(block.raw);

    while (match) {
      if (match[0].length === 0) {
        pattern.lastIndex += 1;
        match = pattern.exec(block.raw);
        continue;
      }

      matches.push({
        blockId: block.id,
        start: match.index,
        end: match.index + match[0].length,
      });
      match = pattern.exec(block.raw);
    }
  }

  return matches;
}
