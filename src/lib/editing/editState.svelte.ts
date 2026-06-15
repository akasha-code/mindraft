import type { AppMode } from "$lib/markdown/types";
import { commitBlockEdit } from "$lib/markdown/applyBlockEdit";
import {
  focusBlock,
  navigationState,
} from "$lib/navigation/documentState.svelte";
import { fileState } from "$lib/filesystem/fileState.svelte";

export const editState = $state({
  mode: "normal" as AppMode,
  editingBlockId: null as string | null,
  draftContent: null as string | null,
});

export function resetEditState(): void {
  editState.mode = "normal";
  editState.editingBlockId = null;
  editState.draftContent = null;
}

export function enterInsertMode(): boolean {
  if (editState.mode === "insert") {
    return true;
  }

  if (!fileState.document || !navigationState.activeBlockId) {
    return false;
  }

  const block = fileState.document.blocks.find(
    (item) => item.id === navigationState.activeBlockId,
  );

  editState.mode = "insert";
  editState.editingBlockId = navigationState.activeBlockId;
  editState.draftContent = block?.raw ?? null;
  return true;
}

function getDraftForEditingBlock(): string {
  const blockId = editState.editingBlockId;
  if (!blockId) {
    return "";
  }

  return (
    editState.draftContent ??
    fileState.document?.blocks.find((block) => block.id === blockId)?.raw ??
    ""
  );
}

export async function confirmInsertMode(newBlockRaw: string): Promise<void> {
  const blockId = editState.editingBlockId;
  if (!blockId) {
    exitInsertMode();
    return;
  }

  const result = await commitBlockEdit(blockId, newBlockRaw);
  focusBlock(result.activeBlockId);
  exitInsertMode();
}

export async function navigateWhileInserting(
  navigate: () => void,
): Promise<void> {
  if (!isInsertMode()) {
    navigate();
    return;
  }

  const blockId = editState.editingBlockId;
  if (blockId) {
    const result = await commitBlockEdit(blockId, getDraftForEditingBlock());
    focusBlock(result.activeBlockId);
  }

  navigate();

  const nextBlockId = navigationState.activeBlockId;
  if (!nextBlockId) {
    exitInsertMode();
    return;
  }

  const nextBlock = fileState.document?.blocks.find(
    (block) => block.id === nextBlockId,
  );

  editState.mode = "insert";
  editState.editingBlockId = nextBlockId;
  editState.draftContent = nextBlock?.raw ?? null;
}

export function exitInsertMode(): void {
  editState.mode = "normal";
  editState.editingBlockId = null;
  editState.draftContent = null;
}

export function isInsertMode(): boolean {
  return editState.mode === "insert";
}

export function setDraftContent(content: string): void {
  if (isInsertMode()) {
    editState.draftContent = content;
  }
}
