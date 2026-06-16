import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { confirm, save } from "@tauri-apps/plugin-dialog";
import { autosaveState } from "$lib/stores/autosave.svelte";
import {
  downloadMarkdownFile,
  getBrowserFileHandle,
  saveDocumentAsInBrowser,
  saveDocumentInBrowser,
} from "$lib/filesystem/browserFile";
import {
  fileState,
  hasAnyUnsavedTabs,
  switchWorkspaceTab,
} from "$lib/filesystem/fileState.svelte";
import {
  clearUnsavedBlocks,
  getUnsavedBlockStarts,
  hasUnsavedChanges,
  hasUnsavedChangesFor,
  triggerSaveAnimation,
} from "$lib/filesystem/persistenceState.svelte";
import { rememberRecentFile } from "$lib/stores/recentFiles.svelte";
import { syncWorkspaceSession } from "$lib/filesystem/workspaceSession";
import { syncDiskSnapshotForActiveTab } from "$lib/filesystem/diskSnapshot";
import { t } from "$lib/i18n";
import { isTauriRuntime } from "$lib/platform/tauri";

function basenameFromPath(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

async function pickSavePath(suggestedName: string): Promise<string | null> {
  const selected = await save({
    defaultPath: suggestedName,
    filters: [
      {
        name: t("common.markdown"),
        extensions: ["md", "markdown"],
      },
    ],
  });

  return selected ?? null;
}

async function resolveSavePath(): Promise<string | null> {
  const document = fileState.document;
  if (!document) {
    return null;
  }

  if (document.path) {
    return document.path;
  }

  const suggestedName = document.filename.endsWith(".md")
    ? document.filename
    : `${document.filename}.md`;

  const selected = await pickSavePath(suggestedName);

  if (!selected) {
    return null;
  }

  document.path = selected;
  document.filename = basenameFromPath(selected);
  rememberRecentFile(selected, document.filename);
  return selected;
}

async function saveDocumentOnDisk(content: string, path: string): Promise<void> {
  await invoke("write_markdown_file", {
    path,
    content,
  });
}

export async function ensureDocumentOnDiskPath(): Promise<string> {
  if (!isTauriRuntime()) {
    throw new Error(t("errors.desktopOnly"));
  }

  const document = fileState.document;
  if (!document) {
    throw new Error(t("errors.noDocument"));
  }

  if (document.path) {
    return document.path;
  }

  const path = await resolveSavePath();
  if (!path) {
    throw new Error(t("errors.chooseSaveLocation"));
  }

  return path;
}

export async function saveCurrentDocument(): Promise<string | null> {
  const document = fileState.document;

  if (!document) {
    throw new Error(t("errors.noDocument"));
  }

  if (!document.dirty && !hasUnsavedChanges()) {
    return null;
  }

  const savedStarts = getUnsavedBlockStarts();

  if (!isTauriRuntime()) {
    const result = await saveDocumentInBrowser(document.raw, document.filename);

    if (!result.saved) {
      throw new Error(t("errors.saveCancelled"));
    }

    document.filename = result.filename;
    document.dirty = false;
    document.lastSavedRaw = document.raw;

    const activeTab = fileState.tabs.find((tab) => tab.id === fileState.activeTabId);
    if (activeTab && result.method !== "download") {
      activeTab.browserHandle = getBrowserFileHandle();
    }
    clearUnsavedBlocks();
    triggerSaveAnimation(savedStarts);
    syncWorkspaceSession();
    await syncDiskSnapshotForActiveTab();

    if (result.method === "download") {
      return t("save.downloadBrowser");
    }

    return null;
  }

  const path = document.path ?? (await resolveSavePath());
  if (!path) {
    throw new Error(t("errors.saveCancelled"));
  }

  await saveDocumentOnDisk(document.raw, path);

  clearUnsavedBlocks();
  document.dirty = false;
  document.lastSavedRaw = document.raw;
  document.path = path;
  triggerSaveAnimation(savedStarts);
  syncWorkspaceSession();
  await syncDiskSnapshotForActiveTab();
  return null;
}

export async function saveDocumentAs(): Promise<string | null> {
  const document = fileState.document;

  if (!document) {
    throw new Error(t("errors.noDocument"));
  }

  const savedStarts = getUnsavedBlockStarts();
  const suggestedName = document.filename.endsWith(".md")
    ? document.filename
    : `${document.filename}.md`;

  if (!isTauriRuntime()) {
    const result = await saveDocumentAsInBrowser(document.raw, suggestedName);

    if (!result.saved) {
      throw new Error(t("errors.saveCancelled"));
    }

    document.filename = result.filename;
    document.dirty = false;
    document.lastSavedRaw = document.raw;

    const activeTab = fileState.tabs.find((tab) => tab.id === fileState.activeTabId);
    if (activeTab && result.method !== "download") {
      activeTab.browserHandle = getBrowserFileHandle();
    }

    clearUnsavedBlocks();
    triggerSaveAnimation(savedStarts);
    syncWorkspaceSession();
    await syncDiskSnapshotForActiveTab();

    if (result.method === "download") {
      return t("save.downloadCopy");
    }

    return t("save.savedAs", { filename: result.filename });
  }

  const selected = await pickSavePath(suggestedName);
  if (!selected) {
    throw new Error(t("errors.saveCancelled"));
  }

  await saveDocumentOnDisk(document.raw, selected);

  document.path = selected;
  document.filename = basenameFromPath(selected);
  document.dirty = false;
  document.lastSavedRaw = document.raw;
  rememberRecentFile(selected, document.filename);
  clearUnsavedBlocks();
  triggerSaveAnimation(savedStarts);
  syncWorkspaceSession();
  await syncDiskSnapshotForActiveTab();

  return t("save.savedAs", { filename: document.filename });
}

export async function maybeAutoSaveAfterEdit(
  _blockId: string | null,
): Promise<void> {
  if (!fileState.document) {
    return;
  }

  fileState.document.dirty = true;

  if (!autosaveState.enabled) {
    return;
  }

  await saveCurrentDocument();
}

export async function finishAppClose(): Promise<void> {
  syncWorkspaceSession();

  try {
    await getCurrentWindow().destroy();
  } catch {
    // Fall through to hard exit below.
  }

  // destroy() can resolve without closing on some Windows/WebView2 builds.
  await invoke("exit_app");
}

async function askCloseDecision(
  messageKey: "closeApp.unsavedAsk" | "closeApp.discardAsk",
): Promise<boolean> {
  const message = t(messageKey);

  try {
    return await confirm(message, {
      title: t("common.appName"),
      kind: "warning",
    });
  } catch {
    return window.confirm(message);
  }
}

async function saveAllUnsavedTabs(): Promise<boolean> {
  for (const tab of [...fileState.tabs]) {
    if (!hasUnsavedChangesFor(tab.document)) {
      continue;
    }

    switchWorkspaceTab(tab.id);

    try {
      await saveCurrentDocument();
    } catch {
      return false;
    }

    if (hasUnsavedChangesFor(tab.document)) {
      return false;
    }
  }

  return true;
}

export async function tryAutosaveBeforeClose(): Promise<boolean> {
  if (!autosaveState.enabled) {
    return false;
  }

  try {
    return await saveAllUnsavedTabs();
  } catch {
    return false;
  }
}

export async function promptForAppClose(): Promise<boolean> {
  if (await tryAutosaveBeforeClose()) {
    return true;
  }

  const shouldSave = await askCloseDecision("closeApp.unsavedAsk");

  if (shouldSave) {
    return saveAllUnsavedTabs();
  }

  return askCloseDecision("closeApp.discardAsk");
}

export async function requestAppClose(force = false): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  if (force || !hasAnyUnsavedTabs()) {
    await finishAppClose();
    return;
  }

  if (await promptForAppClose()) {
    await finishAppClose();
  }
}
