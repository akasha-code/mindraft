import { fileState } from "$lib/filesystem/fileState.svelte";
import { isInsertMode } from "$lib/editing/editState.svelte";

const FOCUS_IDLE_MS = 2800;

export const navigationState = $state({
  activeBlockId: null as string | null,
});

let focusTimer: number | undefined;

function clearFocusTimer(): void {
  if (focusTimer) {
    clearTimeout(focusTimer);
    focusTimer = undefined;
  }
}

function scheduleFocusClear(): void {
  clearFocusTimer();
  focusTimer = window.setTimeout(() => {
    if (!isInsertMode()) {
      navigationState.activeBlockId = null;
    }
    focusTimer = undefined;
  }, FOCUS_IDLE_MS);
}

export function resetNavigation(): void {
  clearFocusTimer();
  navigationState.activeBlockId = null;
}

export function focusBlock(blockId: string | null): void {
  navigationState.activeBlockId = blockId;

  if (blockId && !isInsertMode()) {
    scheduleFocusClear();
    return;
  }

  clearFocusTimer();
}

export function releaseBlockFocus(): void {
  if (!isInsertMode()) {
    scheduleFocusClear();
  }
}

export function setActiveBlock(blockId: string | null): void {
  focusBlock(blockId);
}

export function initializeNavigation(): void {
  resetNavigation();
}

function getReferenceIndex(): number {
  const blocks = fileState.document?.blocks ?? [];
  if (!blocks.length) {
    return -1;
  }

  if (!navigationState.activeBlockId) {
    return 0;
  }

  const index = blocks.findIndex(
    (block) => block.id === navigationState.activeBlockId,
  );
  return index === -1 ? 0 : index;
}

export function selectNextBlock(): void {
  const blocks = fileState.document?.blocks ?? [];
  if (!blocks.length) {
    return;
  }

  const index = getReferenceIndex();
  const nextIndex = Math.min(index + 1, blocks.length - 1);
  focusBlock(blocks[nextIndex].id);
}

export function selectPreviousBlock(): void {
  const blocks = fileState.document?.blocks ?? [];
  if (!blocks.length) {
    return;
  }

  const index = getReferenceIndex();
  const previousIndex = Math.max(index - 1, 0);
  focusBlock(blocks[previousIndex].id);
}

export function selectFirstBlock(): void {
  const firstBlock = fileState.document?.blocks[0];
  focusBlock(firstBlock?.id ?? null);
}

export function selectLastBlock(): void {
  const blocks = fileState.document?.blocks ?? [];
  const lastBlock = blocks.at(-1);
  focusBlock(lastBlock?.id ?? null);
}

export function getActiveBlockMeta(): {
  index: number;
  total: number;
  type: string;
} | null {
  const blocks = fileState.document?.blocks ?? [];
  if (!blocks.length || !navigationState.activeBlockId) {
    return null;
  }

  const index = blocks.findIndex(
    (block) => block.id === navigationState.activeBlockId,
  );

  if (index === -1) {
    return null;
  }

  const block = blocks[index];

  return {
    index: index + 1,
    total: blocks.length,
    type: block?.type ?? "unknown",
  };
}
