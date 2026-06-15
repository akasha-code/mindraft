import { invoke } from "@tauri-apps/api/core";
import { type WorkspaceTab } from "$lib/filesystem/fileState.svelte";
import { isTauriRuntime } from "$lib/platform/tauri";

type FileContent = {
  path: string;
  filename: string;
  content: string;
};

export function getSnapshotKey(tab: WorkspaceTab): string | null {
  if (tab.document.path) {
    return `path:${tab.document.path}`;
  }

  if (tab.browserHandle) {
    return `handle:${tab.id}`;
  }

  return null;
}

export async function readTabContent(tab: WorkspaceTab): Promise<string | null> {
  if (isTauriRuntime() && tab.document.path) {
    const file = await invoke<FileContent>("read_markdown_file", {
      path: tab.document.path,
    });
    return file.content;
  }

  if (tab.browserHandle) {
    const file = await tab.browserHandle.getFile();
    return file.text();
  }

  return null;
}

export async function readTabModifiedMs(tab: WorkspaceTab): Promise<number | null> {
  if (isTauriRuntime() && tab.document.path) {
    const metadata = await invoke<{ modifiedMs: number }>(
      "get_markdown_file_metadata",
      {
        path: tab.document.path,
      },
    );
    return metadata.modifiedMs;
  }

  if (tab.browserHandle) {
    const file = await tab.browserHandle.getFile();
    return file.lastModified;
  }

  return null;
}

export async function readTabFromDisk(
  tab: WorkspaceTab,
): Promise<{ content: string; path: string | null; filename: string }> {
  if (isTauriRuntime() && tab.document.path) {
    const file = await invoke<FileContent>("read_markdown_file", {
      path: tab.document.path,
    });
    return {
      content: file.content,
      path: file.path,
      filename: file.filename,
    };
  }

  if (tab.browserHandle) {
    const file = await tab.browserHandle.getFile();
    return {
      content: await file.text(),
      path: tab.document.path,
      filename: file.name,
    };
  }

  throw new Error("No se puede recargar este documento.");
}
