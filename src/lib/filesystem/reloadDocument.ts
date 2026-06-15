import { invoke } from "@tauri-apps/api/core";
import { createMarkdownDocument } from "$lib/markdown/parseMarkdown";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { readTabFromDisk } from "$lib/filesystem/fileRead";
import { syncDiskSnapshotForTab } from "$lib/filesystem/diskSnapshot";
import { resetEditState } from "$lib/editing/editState.svelte";
import {
  hasUnsavedChangesFor,
  resetPersistenceState,
} from "$lib/filesystem/persistenceState.svelte";
import { resetSearchState } from "$lib/search/searchState.svelte";
import { initializeNavigation } from "$lib/navigation/documentState.svelte";
import { syncWorkspaceSession } from "$lib/filesystem/workspaceSession";

export async function reloadActiveDocumentFromDisk(force = false): Promise<void> {
  const tab = fileState.tabs.find((item) => item.id === fileState.activeTabId);
  if (!tab) {
    throw new Error("No hay documento abierto.");
  }

  if (!force && hasUnsavedChangesFor(tab.document)) {
    throw new Error("Hay cambios locales sin guardar.");
  }

  const { content, path, filename } = await readTabFromDisk(tab);
  const document = await createMarkdownDocument(content, path, filename);
  tab.document = document;

  if (fileState.activeTabId === tab.id) {
    fileState.document = document;
    resetEditState();
    resetPersistenceState();
    resetSearchState();
    initializeNavigation();
  }

  await syncDiskSnapshotForTab(tab);
  syncWorkspaceSession();
}
