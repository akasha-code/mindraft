import { extractBlocksFromRaw } from "$lib/markdown/blockRanges";
import { autosaveState } from "$lib/stores/autosave.svelte";
import { fileState } from "$lib/filesystem/fileState.svelte";
import type { MarkdownBlock, MarkdownDocument } from "$lib/markdown/types";

const ANIMATION_MS = 720;

type SavedBlock = Omit<MarkdownBlock, "html">;

export const persistenceState = $state({
  animatingBlockIds: [] as string[],
});

let cachedSavedRaw = "";
let cachedSavedBlocks: SavedBlock[] = [];

function refreshSavedBlocksCache(document: MarkdownDocument): SavedBlock[] {
  const savedRaw = document.lastSavedRaw ?? "";

  if (savedRaw !== cachedSavedRaw) {
    cachedSavedRaw = savedRaw;
    cachedSavedBlocks = savedRaw ? extractBlocksFromRaw(savedRaw) : [];
  }

  return cachedSavedBlocks;
}

export function resetPersistenceState(): void {
  cachedSavedRaw = "";
  cachedSavedBlocks = [];
  persistenceState.animatingBlockIds = [];
}

export function hasUnsavedChangesFor(document: MarkdownDocument): boolean {
  if (!document.lastSavedRaw) {
    return document.dirty;
  }

  if (document.raw !== document.lastSavedRaw) {
    return true;
  }

  const savedBlocks = refreshSavedBlocksCache(document);
  return document.blocks.some((block, index) => {
    const savedBlock = savedBlocks[index];
    if (!savedBlock) {
      return true;
    }

    return block.raw !== savedBlock.raw;
  });
}

export function isBlockUnsaved(block: MarkdownBlock): boolean {
  if (autosaveState.enabled) {
    return false;
  }

  const document = fileState.document;
  if (!document?.lastSavedRaw) {
    return false;
  }

  const index = document.blocks.findIndex((item) => item.id === block.id);
  if (index === -1) {
    return false;
  }

  const savedBlocks = refreshSavedBlocksCache(document);
  const savedBlock = savedBlocks[index];

  if (!savedBlock) {
    return true;
  }

  return block.raw !== savedBlock.raw;
}

export function isBlockAnimating(block: MarkdownBlock): boolean {
  return persistenceState.animatingBlockIds.includes(block.id);
}

export function getUnsavedBlockStarts(): number[] {
  return (fileState.document?.blocks ?? [])
    .filter((block) => isBlockUnsaved(block))
    .map((block) => block.startOffset);
}

export function clearUnsavedBlocks(): number[] {
  return getUnsavedBlockStarts();
}

export function triggerSaveAnimation(savedStarts: number[]): void {
  const blocks = fileState.document?.blocks ?? [];
  persistenceState.animatingBlockIds = blocks
    .filter((block) => savedStarts.includes(block.startOffset))
    .map((block) => block.id);

  window.setTimeout(() => {
    persistenceState.animatingBlockIds = [];
  }, ANIMATION_MS);
}

export function hasUnsavedChanges(): boolean {
  const document = fileState.document;
  if (!document) {
    return false;
  }

  return hasUnsavedChangesFor(document);
}
