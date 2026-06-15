import type { AppMode } from "$lib/markdown/types";
import {
  closeActiveWorkspaceTab,
  closeAllWorkspaceTabs,
  closeOtherWorkspaceTabs,
} from "$lib/filesystem/closeTab";
import { createNewDocument } from "$lib/filesystem/newDocument";
import { openMarkdownDialog } from "$lib/filesystem/openFile";
import {
  switchToNextTab,
  switchToPreviousTab,
} from "$lib/filesystem/fileState.svelte";
import {
  requestAppClose,
  saveCurrentDocument,
  saveDocumentAs,
} from "$lib/filesystem/saveFile";
import { extractHeadings, jumpToHeading } from "$lib/navigation/headings";
  import { fileState } from "$lib/filesystem/fileState.svelte";
  import { searchState } from "$lib/search/searchState.svelte";
  import { t } from "$lib/i18n";

export const commandState = $state({
  active: false,
  buffer: "",
});

export const headingPickerState = $state({
  open: false,
});

export function enterCommandMode(): void {
  commandState.active = true;
  commandState.buffer = "";
}

export function exitCommandMode(): void {
  commandState.active = false;
  commandState.buffer = "";
}

export function isCommandMode(): boolean {
  return commandState.active;
}

export function openHeadingPicker(): void {
  headingPickerState.open = true;
}

export function closeHeadingPicker(): void {
  headingPickerState.open = false;
}

function normalizeCommand(raw: string): { command: string; args: string } {
  const trimmed = raw.trim().replace(/^:/, "");
  const [command = "", ...rest] = trimmed.split(/\s+/);
  return {
    command: command.toLowerCase(),
    args: rest.join(" ").trim(),
  };
}

export async function executeCommandBuffer(): Promise<string | null> {
  const { command, args } = normalizeCommand(commandState.buffer);
  exitCommandMode();

  try {
    switch (command) {
      case "w":
        await saveCurrentDocument();
        return null;
      case "saveas":
      case "wa":
        return await saveDocumentAs();
      case "new":
        await createNewDocument();
        return t("commands.newDocument");
      case "e":
        await openMarkdownDialog();
        return null;
      case "tabclose":
        await closeActiveWorkspaceTab();
        return null;
      case "tabonly":
        await closeOtherWorkspaceTabs();
        return t("commands.closeOtherTabs");
      case "tabcloseall":
        await closeAllWorkspaceTabs();
        return t("commands.closeAllTabs");
      case "bn":
      case "tabn":
        switchToNextTab();
        return null;
      case "bp":
      case "tabp":
        switchToPreviousTab();
        return null;
      case "h":
      case "heading": {
        if (!args) {
          openHeadingPicker();
          return null;
        }

        const headings = extractHeadings(fileState.document?.blocks ?? []);
        const target = jumpToHeading(headings, args);
        return target ? null : t("commands.headingNotFound", { name: args });
      }
      case "q":
        await requestAppClose(false);
        return null;
      case "wq":
      case "x":
        await saveCurrentDocument();
        await requestAppClose(true);
        return null;
      case "q!":
        await requestAppClose(true);
        return null;
      default:
        return command ? t("commands.unknown", { name: command }) : null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : t("errors.executeCommand");
  }
}

export function getAppModeForStatus(
  insertMode: boolean,
): AppMode | "normal-unsaved" | "search" {
  if (searchState.active) {
    return "search";
  }

  if (commandState.active) {
    return "command";
  }

  if (insertMode) {
    return "insert";
  }

  return "normal";
}

export function getStatusModeLabel(insertMode: boolean): string {
  const mode = getAppModeForStatus(insertMode);

  switch (mode) {
    case "command":
      return t("statusbar.modes.command");
    case "insert":
      return t("statusbar.modes.insert");
    case "search":
      return t("statusbar.modes.search");
    default:
      return t("statusbar.modes.normal");
  }
}
