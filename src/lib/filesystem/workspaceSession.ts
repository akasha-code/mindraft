import { openMarkdownPath } from "$lib/filesystem/openFile";
import { loadMarkdownFile } from "$lib/filesystem/fileState.svelte";
import {
  fileState,
  switchWorkspaceTab,
  type WorkspaceTab,
} from "$lib/filesystem/fileState.svelte";
import { appStorageKey, readStorageWithMigration, writeStorage } from "$lib/constants/storage";
import { isTauriRuntime } from "$lib/platform/tauri";

const STORAGE_KEY = appStorageKey("workspace-v2");
const LEGACY_STORAGE_KEY = appStorageKey("workspace-v1");

type BrowserStoredTab = {
  filename: string;
  raw: string;
};

type StoredSession = {
  activePath: string | null;
  paths: string[];
  browserTabs: BrowserStoredTab[];
  activeBrowserFilename: string | null;
};

function emptySession(): StoredSession {
  return {
    activePath: null,
    paths: [],
    browserTabs: [],
    activeBrowserFilename: null,
  };
}

function readStoredSession(): StoredSession | null {
  return readStorageWithMigration<StoredSession>(
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    (raw) => {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      return {
        activePath: parsed.activePath ?? null,
        paths: Array.isArray(parsed.paths)
          ? parsed.paths.filter((path) => typeof path === "string" && path.length > 0)
          : [],
        browserTabs: Array.isArray(parsed.browserTabs)
          ? parsed.browserTabs.filter(
              (tab) =>
                tab &&
                typeof tab.filename === "string" &&
                typeof tab.raw === "string",
            )
          : [],
        activeBrowserFilename: parsed.activeBrowserFilename ?? null,
      };
    },
  );
}

function findTabByPath(path: string): WorkspaceTab | undefined {
  return fileState.tabs.find((tab) => tab.document.path === path);
}

function findTabByFilename(filename: string): WorkspaceTab | undefined {
  return fileState.tabs.find(
    (tab) => !tab.document.path && tab.document.filename === filename,
  );
}

export function syncWorkspaceSession(): void {
  const paths = fileState.tabs
    .map((tab) => tab.document.path)
    .filter((path): path is string => Boolean(path));

  const browserTabs = fileState.tabs
    .filter((tab) => !tab.document.path)
    .map((tab) => ({
      filename: tab.document.filename,
      raw: tab.document.raw,
    }));

  const payload: StoredSession = {
    activePath: fileState.document?.path ?? null,
    paths,
    browserTabs,
    activeBrowserFilename:
      fileState.document?.path == null ? fileState.document?.filename ?? null : null,
  };

  writeStorage(STORAGE_KEY, JSON.stringify(payload));
}

export async function restoreWorkspaceSessionIfEmpty(): Promise<void> {
  if (fileState.tabs.length > 0) {
    return;
  }

  const session = readStoredSession();
  if (!session) {
    return;
  }

  if (isTauriRuntime()) {
    for (const path of session.paths) {
      try {
        await openMarkdownPath(path);
      } catch {
        // Skip missing files.
      }
    }

    if (session.activePath) {
      const tab = findTabByPath(session.activePath);
      if (tab) {
        switchWorkspaceTab(tab.id);
      }
    }

    return;
  }

  for (const tab of session.browserTabs) {
    await loadMarkdownFile(null, tab.filename, tab.raw);
  }

  if (session.activeBrowserFilename) {
    const tab = findTabByFilename(session.activeBrowserFilename);
    if (tab) {
      switchWorkspaceTab(tab.id);
    }
  }
}

export function clearWorkspaceSession(): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
