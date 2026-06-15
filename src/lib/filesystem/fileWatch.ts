import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  dismissExternalFileChange,
  externalChangeState,
  markExternalFileChange,
} from "$lib/filesystem/externalChange.svelte";
import {
  clearDiskSnapshots,
  getDiskSnapshot,
  setDiskSnapshot,
  syncDiskSnapshotForActiveTab,
  syncDiskSnapshotForTab,
} from "$lib/filesystem/diskSnapshot";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { hasUnsavedChangesFor } from "$lib/filesystem/persistenceState.svelte";
import {
  getSnapshotKey,
  readTabContent,
  readTabModifiedMs,
} from "$lib/filesystem/fileRead";
import { reloadActiveDocumentFromDisk } from "$lib/filesystem/reloadDocument";
import { isTauriRuntime } from "$lib/platform/tauri";

const POLL_INTERVAL_MS = 4000;

let pollTimer: number | undefined;
let eventUnlisten: UnlistenFn | undefined;
let watching = false;
let watchedPath: string | null = null;

async function handleExternalContentChange(): Promise<void> {
  if (externalChangeState.pending || !fileState.document) {
    return;
  }

  const tab = fileState.tabs.find((item) => item.id === fileState.activeTabId);
  if (!tab) {
    return;
  }

  const key = getSnapshotKey(tab);
  if (!key) {
    return;
  }

  let remoteContent: string | null;
  let modifiedMs: number | null;

  try {
    remoteContent = await readTabContent(tab);
    modifiedMs = await readTabModifiedMs(tab);
  } catch {
    return;
  }

  if (remoteContent === null || modifiedMs === null) {
    return;
  }

  setDiskSnapshot(key, modifiedMs);

  if (remoteContent === tab.document.raw) {
    tab.document.lastSavedRaw = remoteContent;
    tab.document.dirty = false;
    return;
  }

  markExternalFileChange(
    tab.document.filename,
    hasUnsavedChangesFor(tab.document),
  );
}

async function checkActiveTabForExternalChanges(): Promise<void> {
  if (externalChangeState.pending || !fileState.document) {
    return;
  }

  const tab = fileState.tabs.find((item) => item.id === fileState.activeTabId);
  if (!tab) {
    return;
  }

  const key = getSnapshotKey(tab);
  if (!key) {
    return;
  }

  const previous = getDiskSnapshot(key);
  if (!previous) {
    await syncDiskSnapshotForTab(tab);
    return;
  }

  let modifiedMs: number | null;
  try {
    modifiedMs = await readTabModifiedMs(tab);
  } catch {
    return;
  }

  if (modifiedMs === null || modifiedMs === previous.modifiedMs) {
    return;
  }

  await handleExternalContentChange();
}

async function syncNativeWatchPath(): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  const path = fileState.document?.path ?? null;
  if (path === watchedPath) {
    return;
  }

  watchedPath = path;
  await invoke("set_markdown_file_watch", { path });
  await syncDiskSnapshotForActiveTab();
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

function startPolling(): void {
  stopPolling();
  pollTimer = window.setInterval(() => {
    void checkActiveTabForExternalChanges();
  }, POLL_INTERVAL_MS);
}

export function initFileWatch(): () => void {
  if (watching || typeof window === "undefined") {
    return () => undefined;
  }

  watching = true;
  startPolling();

  const pollSyncTimer = window.setInterval(() => {
    void syncNativeWatchPath();
  }, 1500);

  void (async () => {
    await syncNativeWatchPath();

    if (isTauriRuntime()) {
      eventUnlisten = await listen<string>("markdown-file-changed", () => {
        void handleExternalContentChange();
      });
    }
  })();

  return () => {
    watching = false;
    stopPolling();
    clearInterval(pollSyncTimer);
    clearDiskSnapshots();
    watchedPath = null;
    void eventUnlisten?.();
    eventUnlisten = undefined;

    if (isTauriRuntime()) {
      void invoke("set_markdown_file_watch", { path: null });
    }
  };
}

export async function reloadExternalChange(): Promise<void> {
  await reloadActiveDocumentFromDisk(true);
  dismissExternalFileChange();
  await syncDiskSnapshotForActiveTab();
  await syncNativeWatchPath();
}

export async function keepExternalChange(): Promise<void> {
  dismissExternalFileChange();
  await syncDiskSnapshotForActiveTab();
}
