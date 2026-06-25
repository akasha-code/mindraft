import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { canCloseAppWithoutPrompt } from "$lib/filesystem/closeTab";
import { openMarkdownPath } from "$lib/filesystem/openFile";
import {
  finishAppClose,
  promptForAppClose,
} from "$lib/filesystem/saveFile";
import { syncWorkspaceSession } from "$lib/filesystem/workspaceSession";
import { t } from "$lib/i18n";
import { isTauriRuntime } from "$lib/platform/tauri";

async function openFileFromLaunchArgs(
  path: string,
  onStatus: (message: string | null) => void,
): Promise<void> {
  try {
    await openMarkdownPath(path);
  } catch (error) {
    onStatus(error instanceof Error ? error.message : t("errors.openFile"));
  }
}

export async function initAppLifecycle(
  onStatus: (message: string | null) => void,
): Promise<(() => void) | undefined> {
  if (!isTauriRuntime()) {
    return undefined;
  }

  const unlisteners: Array<() => void> = [];

  const openFromArgsUnlisten = await listen<string>(
    "open-file-from-args",
    (event) => {
      void openFileFromLaunchArgs(event.payload, onStatus);
    },
  );
  unlisteners.push(openFromArgsUnlisten);

  const pendingPath = await invoke<string | null>("take_startup_file_path");
  if (pendingPath) {
    await openFileFromLaunchArgs(pendingPath, onStatus);
  }

  const window = getCurrentWindow();

  const closeUnlisten = await window.onCloseRequested(async (event) => {
    // Always intercept: we close explicitly via destroy()/exit_app (reliable on Windows).
    event.preventDefault();

    try {
      syncWorkspaceSession();

      if (canCloseAppWithoutPrompt()) {
        await finishAppClose();
        return;
      }

      if (await promptForAppClose()) {
        await finishAppClose();
      }
    } catch (error) {
      onStatus(error instanceof Error ? error.message : t("errors.closeApp"));

      if (canCloseAppWithoutPrompt()) {
        await finishAppClose();
      }
    }
  });
  unlisteners.push(closeUnlisten);

  const dragUnlisten = await window.onDragDropEvent((event) => {
    if (event.payload.type !== "drop") {
      return;
    }

    const markdownPath = event.payload.paths.find((path) =>
      /\.(md|markdown)$/i.test(path),
    );

    if (!markdownPath) {
      onStatus(t("errors.markdownOnly"));
      return;
    }

    void openMarkdownPath(markdownPath).catch((error) => {
      onStatus(error instanceof Error ? error.message : t("errors.openFile"));
    });
  });
  unlisteners.push(dragUnlisten);

  return () => {
    for (const unlisten of unlisteners) {
      unlisten();
    }
  };
}
