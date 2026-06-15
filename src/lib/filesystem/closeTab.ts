import { ask } from "@tauri-apps/plugin-dialog";
import { isTauriRuntime } from "$lib/platform/tauri";
import {
  fileState,
  hasAnyUnsavedTabs,
  isTabUnsaved,
  removeWorkspaceTab,
  switchWorkspaceTab,
  type WorkspaceTab,
} from "$lib/filesystem/fileState.svelte";
import { saveCurrentDocument } from "$lib/filesystem/saveFile";
import { t } from "$lib/i18n";

async function confirmDiscardTab(tab: WorkspaceTab): Promise<boolean> {
  const label = tab.document.filename;

  if (!isTauriRuntime()) {
    return window.confirm(t("closeTab.unsavedBrowser", { name: label }));
  }

  const shouldSave = await ask(t("closeTab.unsavedAsk", { name: label }), {
    title: t("common.appName"),
    kind: "warning",
    okLabel: t("common.save"),
    cancelLabel: t("common.dontSave"),
  });

  if (shouldSave) {
    if (tab.id !== fileState.activeTabId) {
      switchWorkspaceTab(tab.id);
    }

    await saveCurrentDocument();
    return !isTabUnsaved(tab);
  }

  return await ask(t("closeTab.discardAsk", { name: label }), {
    title: t("common.appName"),
    kind: "warning",
    okLabel: t("common.discard"),
    cancelLabel: t("common.cancel"),
  });
}

export async function closeWorkspaceTab(tabId: string, force = false): Promise<boolean> {
  const tab = fileState.tabs.find((item) => item.id === tabId);
  if (!tab) {
    return false;
  }

  if (!force && isTabUnsaved(tab)) {
    const canClose = await confirmDiscardTab(tab);
    if (!canClose) {
      return false;
    }
  }

  removeWorkspaceTab(tabId);
  return true;
}

export async function closeActiveWorkspaceTab(force = false): Promise<boolean> {
  if (!fileState.activeTabId) {
    return false;
  }

  return closeWorkspaceTab(fileState.activeTabId, force);
}

export async function closeOtherWorkspaceTabs(force = false): Promise<number> {
  const activeId = fileState.activeTabId;
  if (!activeId) {
    return 0;
  }

  let closed = 0;
  for (const tab of [...fileState.tabs]) {
    if (tab.id === activeId) {
      continue;
    }

    if (await closeWorkspaceTab(tab.id, force)) {
      closed += 1;
    }
  }

  return closed;
}

export async function closeAllWorkspaceTabs(force = false): Promise<number> {
  let closed = 0;

  while (fileState.tabs.length) {
    const tabId = fileState.activeTabId ?? fileState.tabs[0]?.id;
    if (!tabId) {
      break;
    }

    if (await closeWorkspaceTab(tabId, force)) {
      closed += 1;
    } else {
      break;
    }
  }

  return closed;
}

export function canCloseAppWithoutPrompt(): boolean {
  return !hasAnyUnsavedTabs();
}
