import { createMarkdownDocument } from "$lib/markdown/parseMarkdown";
import type { MarkdownDocument } from "$lib/markdown/types";
import {
  initializeNavigation,
  resetNavigation,
} from "$lib/navigation/documentState.svelte";
import {
  clearBrowserFileHandle,
  getBrowserFileHandle,
  setBrowserFileHandle,
} from "$lib/filesystem/browserFile";
import { resetEditState } from "$lib/editing/editState.svelte";
import {
  hasUnsavedChangesFor,
  resetPersistenceState,
} from "$lib/filesystem/persistenceState.svelte";
import { resetSearchState } from "$lib/search/searchState.svelte";
import { renderMarkdown } from "$lib/markdown/renderMarkdown";
import { syncWorkspaceSession } from "$lib/filesystem/workspaceSession";
import { syncDiskSnapshotForTab } from "$lib/filesystem/diskSnapshot";

export type WorkspaceTab = {
  id: string;
  document: MarkdownDocument;
  browserHandle: FileSystemFileHandle | null;
};

export const fileState = $state<{
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  document: MarkdownDocument | null;
  loading: boolean;
  error: string | null;
}>({
  tabs: [],
  activeTabId: null,
  document: null,
  loading: false,
  error: null,
});

function createTabId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function tabIdentity(path: string | null, filename: string): string {
  return path ?? `name:${filename.toLowerCase()}`;
}

function findTabByIdentity(path: string | null, filename: string): WorkspaceTab | undefined {
  const identity = tabIdentity(path, filename);
  return fileState.tabs.find(
    (tab) => tabIdentity(tab.document.path, tab.document.filename) === identity,
  );
}

function persistActiveTabBrowserHandle(): void {
  if (!fileState.activeTabId) {
    return;
  }

  const active = fileState.tabs.find((tab) => tab.id === fileState.activeTabId);
  if (active) {
    active.browserHandle = getBrowserFileHandle();
  }
}

function activateTab(tab: WorkspaceTab): void {
  persistActiveTabBrowserHandle();
  resetEditState();
  resetPersistenceState();
  resetSearchState();
  setBrowserFileHandle(tab.browserHandle);
  fileState.activeTabId = tab.id;
  fileState.document = tab.document;
  initializeNavigation();
  syncWorkspaceSession();
  void syncDiskSnapshotForTab(tab);
}

export function getOpenTabs(): WorkspaceTab[] {
  return fileState.tabs;
}

export function switchWorkspaceTab(tabId: string): void {
  if (tabId === fileState.activeTabId) {
    return;
  }

  const tab = fileState.tabs.find((item) => item.id === tabId);
  if (!tab) {
    return;
  }

  activateTab(tab);
}

export function switchToNextTab(): void {
  if (!fileState.tabs.length || !fileState.activeTabId) {
    return;
  }

  const index = fileState.tabs.findIndex((tab) => tab.id === fileState.activeTabId);
  if (index === -1) {
    return;
  }

  const nextIndex = (index + 1) % fileState.tabs.length;
  switchWorkspaceTab(fileState.tabs[nextIndex].id);
}

export function switchToPreviousTab(): void {
  if (!fileState.tabs.length || !fileState.activeTabId) {
    return;
  }

  const index = fileState.tabs.findIndex((tab) => tab.id === fileState.activeTabId);
  if (index === -1) {
    return;
  }

  const previousIndex =
    (index - 1 + fileState.tabs.length) % fileState.tabs.length;
  switchWorkspaceTab(fileState.tabs[previousIndex].id);
}

export function reorderWorkspaceTabs(fromIndex: number, toIndex: number): void {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= fileState.tabs.length ||
    toIndex >= fileState.tabs.length
  ) {
    return;
  }

  const [moved] = fileState.tabs.splice(fromIndex, 1);
  fileState.tabs.splice(toIndex, 0, moved);
  syncWorkspaceSession();
}

export function hasAnyUnsavedTabs(): boolean {
  return fileState.tabs.some((tab) => hasUnsavedChangesFor(tab.document));
}

export function removeWorkspaceTab(tabId: string): void {
  const index = fileState.tabs.findIndex((tab) => tab.id === tabId);
  if (index === -1) {
    return;
  }

  fileState.tabs.splice(index, 1);

  if (fileState.activeTabId !== tabId) {
    return;
  }

  if (!fileState.tabs.length) {
    fileState.activeTabId = null;
    fileState.document = null;
    clearBrowserFileHandle();
    resetNavigation();
    resetEditState();
    resetPersistenceState();
    resetSearchState();
    syncWorkspaceSession();
    return;
  }

  const nextIndex = Math.min(index, fileState.tabs.length - 1);
  activateTab(fileState.tabs[nextIndex]);
}

export async function loadMarkdownFile(
  path: string | null,
  filename: string,
  raw: string,
  browserHandle: FileSystemFileHandle | null = null,
): Promise<void> {
  const existing = findTabByIdentity(path, filename);
  if (existing) {
    switchWorkspaceTab(existing.id);
    return;
  }

  fileState.loading = true;
  fileState.error = null;

  try {
    if (path) {
      clearBrowserFileHandle();
    }

    const document = await createMarkdownDocument(raw, path, filename);
    const tab: WorkspaceTab = {
      id: createTabId(),
      document,
      browserHandle: path ? null : browserHandle,
    };

    fileState.tabs.push(tab);
    activateTab(tab);
    syncWorkspaceSession();
  } catch (error) {
    fileState.error =
      error instanceof Error ? error.message : "Failed to load markdown file";
    if (!fileState.tabs.length) {
      fileState.document = null;
      fileState.activeTabId = null;
      resetNavigation();
      resetEditState();
      resetPersistenceState();
      resetSearchState();
    }
  } finally {
    fileState.loading = false;
  }
}

export async function refreshDocumentHtml(): Promise<void> {
  if (!fileState.document) {
    return;
  }

  fileState.document.html = await renderMarkdown(
    fileState.document.raw,
    fileState.document.path,
  );
}

export function clearDocument(): void {
  fileState.tabs = [];
  fileState.activeTabId = null;
  fileState.document = null;
  fileState.error = null;
  clearBrowserFileHandle();
  resetNavigation();
  resetEditState();
  resetPersistenceState();
  resetSearchState();
  syncWorkspaceSession();
}

export function clearFileError(): void {
  fileState.error = null;
}

export function isTabUnsaved(tab: WorkspaceTab): boolean {
  return hasUnsavedChangesFor(tab.document);
}
