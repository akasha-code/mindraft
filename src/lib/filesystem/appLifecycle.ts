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

export async function initAppLifecycle(
  onStatus: (message: string | null) => void,
): Promise<(() => void) | undefined> {
  if (!isTauriRuntime()) {
    return undefined;
  }

  const unlisteners: Array<() => void> = [];

  const startupUnlisten = await listen<string>("startup-open-file", (event) => {
    void openMarkdownPath(event.payload).catch((error) => {
      onStatus(error instanceof Error ? error.message : t("errors.openFile"));
    });
  });
  unlisteners.push(startupUnlisten);

  const window = getCurrentWindow();

  const closeUnlisten = await window.onCloseRequested(async (event) => {
    try {
      syncWorkspaceSession();

      if (canCloseAppWithoutPrompt()) {
        // No preventDefault: Tauri destroys the window when the handler finishes.
        return;
      }

      event.preventDefault();

      if (await promptForAppClose()) {
        await finishAppClose();
      }
    } catch (error) {
      event.preventDefault();
      onStatus(error instanceof Error ? error.message : t("errors.closeApp"));
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
