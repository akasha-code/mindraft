import type { MarkdownBlock } from "$lib/markdown/types";
import { focusBlock } from "$lib/navigation/documentState.svelte";

export type DocumentHeading = {
  id: string;
  blockId: string;
  level: number;
  text: string;
};

function stripMarkdownInline(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`>#]/g, "")
    .trim();
}

export function extractHeadings(blocks: MarkdownBlock[]): DocumentHeading[] {
  const headings: DocumentHeading[] = [];

  for (const block of blocks) {
    if (block.type !== "heading") {
      continue;
    }

    const match = block.raw.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    headings.push({
      id: block.id,
      blockId: block.id,
      level: match[1].length,
      text: stripMarkdownInline(match[2]),
    });
  }

  return headings;
}

export function jumpToHeading(
  headings: DocumentHeading[],
  query: string,
): DocumentHeading | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || !headings.length) {
    return null;
  }

  const exact = headings.find((heading) => heading.text.toLowerCase() === trimmed);
  if (exact) {
    focusBlock(exact.blockId);
    scrollToBlock(exact.blockId);
    return exact;
  }

  const partial = headings.find((heading) =>
    heading.text.toLowerCase().includes(trimmed),
  );

  if (partial) {
    focusBlock(partial.blockId);
    scrollToBlock(partial.blockId);
    return partial;
  }

  return null;
}

export function scrollToBlock(blockId: string): void {
  window.requestAnimationFrame(() => {
    document
      .querySelector(`[data-block-id="${blockId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
