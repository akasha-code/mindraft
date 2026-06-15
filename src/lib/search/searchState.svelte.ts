import type { MarkdownBlock } from "$lib/markdown/types";
import { commitBlockEdit } from "$lib/markdown/applyBlockEdit";
import { focusBlock } from "$lib/navigation/documentState.svelte";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { t } from "$lib/i18n";
import {
  findMatchesInBlocks,
  type SearchMatch,
} from "$lib/search/findMatches";

export type { SearchMatch } from "$lib/search/findMatches";

export const searchOptions = $state({
  caseSensitive: false,
  useRegex: false,
});

export const searchState = $state({
  active: false,
  query: "",
  replaceQuery: "",
  replaceMode: false,
  matches: [] as SearchMatch[],
  currentIndex: -1,
});

export function findMatches(blocks: MarkdownBlock[], query: string): SearchMatch[] {
  return findMatchesInBlocks(blocks, query, searchOptions);
}

export function resetSearchState(): void {
  searchState.active = false;
  searchState.query = "";
  searchState.replaceQuery = "";
  searchState.replaceMode = false;
  searchState.matches = [];
  searchState.currentIndex = -1;
}

export function enterSearchMode(initialQuery = "", replaceMode = false): void {
  searchState.active = true;
  searchState.replaceMode = replaceMode;
  searchState.query = initialQuery;
  updateSearchMatches(initialQuery);
}

export function exitSearchMode(): void {
  resetSearchState();
}

export function toggleSearchCaseSensitive(): void {
  searchOptions.caseSensitive = !searchOptions.caseSensitive;
  if (searchState.active) {
    updateSearchMatches(searchState.query);
  }
}

export function toggleSearchRegex(): void {
  searchOptions.useRegex = !searchOptions.useRegex;
  if (searchState.active) {
    updateSearchMatches(searchState.query);
  }
}

export function toggleReplaceMode(): void {
  searchState.replaceMode = !searchState.replaceMode;
}

export function updateSearchMatches(query: string): void {
  searchState.query = query;
  searchState.matches = findMatches(fileState.document?.blocks ?? [], query);
  searchState.currentIndex = searchState.matches.length ? 0 : -1;
  focusCurrentMatch(false);
}

export function focusCurrentMatch(scroll = true): void {
  const match = searchState.matches[searchState.currentIndex];
  if (!match) {
    return;
  }

  focusBlock(match.blockId);

  if (!scroll) {
    return;
  }

  window.requestAnimationFrame(() => {
    document
      .querySelector(`[data-block-id="${match.blockId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function selectNextMatch(backward = false): void {
  if (!searchState.matches.length) {
    return;
  }

  const total = searchState.matches.length;
  searchState.currentIndex = backward
    ? (searchState.currentIndex - 1 + total) % total
    : (searchState.currentIndex + 1) % total;

  focusCurrentMatch();
}

export function getSearchStatusLabel(): string | null {
  if (!searchState.active || !searchState.query.trim()) {
    return null;
  }

  if (!searchState.matches.length) {
    return searchOptions.useRegex ? t("search.noMatchesRegex") : t("search.noMatches");
  }

  const flags = [
    searchOptions.caseSensitive ? "Aa" : null,
    searchOptions.useRegex ? ".*" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const suffix = flags ? ` · ${flags}` : "";
  return `${searchState.currentIndex + 1}/${searchState.matches.length}${suffix}`;
}

export async function replaceCurrentMatch(): Promise<boolean> {
  const match = searchState.matches[searchState.currentIndex];
  const block = fileState.document?.blocks.find((item) => item.id === match?.blockId);

  if (!match || !block) {
    return false;
  }

  const nextBlockRaw =
    block.raw.slice(0, match.start) +
    searchState.replaceQuery +
    block.raw.slice(match.end);

  await commitBlockEdit(block.id, nextBlockRaw);
  updateSearchMatches(searchState.query);
  return true;
}

export async function replaceAllMatches(): Promise<number> {
  const document = fileState.document;
  if (!document || !searchState.matches.length) {
    return 0;
  }

  const grouped = new Map<string, SearchMatch[]>();
  for (const match of searchState.matches) {
    const list = grouped.get(match.blockId) ?? [];
    list.push(match);
    grouped.set(match.blockId, list);
  }

  let replaced = 0;

  for (const [blockId, matches] of grouped) {
    const block = document.blocks.find((item) => item.id === blockId);
    if (!block) {
      continue;
    }

    const sorted = [...matches].sort((a, b) => b.start - a.start);
    let nextRaw = block.raw;

    for (const match of sorted) {
      nextRaw =
        nextRaw.slice(0, match.start) +
        searchState.replaceQuery +
        nextRaw.slice(match.end);
      replaced += 1;
    }

    await commitBlockEdit(blockId, nextRaw);
  }

  updateSearchMatches(searchState.query);
  return replaced;
}

export function highlightSearchText(text: string, blockId: string): string {
  const query = searchState.query.trim();
  if (!searchState.active || !query) {
    return escapeHtml(text);
  }

  const blockMatches = searchState.matches.filter((match) => match.blockId === blockId);
  if (!blockMatches.length) {
    return escapeHtml(text);
  }

  let result = "";
  let cursor = 0;

  for (const match of blockMatches) {
    if (match.start < cursor) {
      continue;
    }

    result += escapeHtml(text.slice(cursor, match.start));

    const isCurrent =
      searchState.matches[searchState.currentIndex]?.blockId === blockId &&
      searchState.matches[searchState.currentIndex]?.start === match.start;

    result += `<mark class="search-mark${isCurrent ? " search-mark--current" : ""}">${escapeHtml(text.slice(match.start, match.end))}</mark>`;
    cursor = match.end;
  }

  result += escapeHtml(text.slice(cursor));
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
