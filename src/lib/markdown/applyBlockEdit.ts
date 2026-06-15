import { createMarkdownDocument } from "$lib/markdown/parseMarkdown";
import { replaceBlockInRaw } from "$lib/markdown/replaceBlock";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { maybeAutoSaveAfterEdit } from "$lib/filesystem/saveFile";
import {
  searchState,
  updateSearchMatches,
} from "$lib/search/searchState.svelte";

export async function commitBlockEdit(
  blockId: string,
  newBlockRaw: string,
): Promise<{ changed: boolean; activeBlockId: string | null }> {
  const document = fileState.document;
  if (!document) {
    return { changed: false, activeBlockId: null };
  }

  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);
  const block = document.blocks[blockIndex];

  if (!block) {
    return { changed: false, activeBlockId: null };
  }

  if (newBlockRaw === block.raw) {
    return { changed: false, activeBlockId: blockId };
  }

  const anchorOffset = block.startOffset;
  const nextRaw = replaceBlockInRaw(
    document.raw,
    block.startOffset,
    block.endOffset,
    newBlockRaw,
  );

  const updated = await createMarkdownDocument(
    nextRaw,
    document.path,
    document.filename,
  );

  updated.dirty = true;
  updated.lastSavedRaw = document.lastSavedRaw;

  fileState.document = updated;

  const activeTab = fileState.tabs.find((tab) => tab.id === fileState.activeTabId);
  if (activeTab) {
    activeTab.document = updated;
  }

  const matchedBlock =
    updated.blocks.find((item) => item.startOffset === anchorOffset) ??
    updated.blocks[Math.min(blockIndex, updated.blocks.length - 1)];

  const activeBlockId = matchedBlock?.id ?? null;
  await maybeAutoSaveAfterEdit(activeBlockId);

  if (searchState.active) {
    updateSearchMatches(searchState.query);
  }

  return {
    changed: true,
    activeBlockId,
  };
}
