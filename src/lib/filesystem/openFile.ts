import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  clearBrowserFileHandle,
  getBrowserFileHandle,
  pickMarkdownInBrowser,
  supportsOpenFilePicker,
} from "$lib/filesystem/browserFile";
import { isTauriRuntime } from "$lib/platform/tauri";
import { rememberRecentFile } from "$lib/stores/recentFiles.svelte";
import { loadMarkdownFile } from "./fileState.svelte";

type FileContent = {
  path: string;
  filename: string;
  content: string;
};

function openMarkdownViaInputPicker(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown,text/plain";
    input.style.display = "none";

    input.addEventListener("change", async () => {
      input.remove();
      const file = input.files?.[0];

      if (!file) {
        resolve(false);
        return;
      }

      try {
        clearBrowserFileHandle();
        const content = await file.text();
        await loadMarkdownFile(null, file.name, content);
        resolve(true);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });

    input.addEventListener("cancel", () => {
      input.remove();
      resolve(false);
    });

    document.body.appendChild(input);
    input.click();
  });
}

async function openMarkdownViaBrowserPicker(): Promise<boolean> {
  if (!supportsOpenFilePicker()) {
    return openMarkdownViaInputPicker();
  }

  const picked = await pickMarkdownInBrowser();

  if (!picked) {
    return false;
  }

  await loadMarkdownFile(null, picked.filename, picked.content, getBrowserFileHandle());
  return true;
}

export async function openMarkdownDialog(): Promise<boolean> {
  if (!isTauriRuntime()) {
    return openMarkdownViaBrowserPicker();
  }

  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Markdown",
        extensions: ["md", "markdown"],
      },
    ],
  });

  if (selected === null || Array.isArray(selected)) {
    return false;
  }

  return openMarkdownPath(selected);
}

export async function openMarkdownPath(path: string): Promise<boolean> {
  if (!isTauriRuntime()) {
    throw new Error(
      "La ruta de archivo solo está disponible en la app de escritorio.",
    );
  }

  try {
    clearBrowserFileHandle();
    const file = await invoke<FileContent>("read_markdown_file", { path });
    await loadMarkdownFile(file.path, file.filename, file.content);
    rememberRecentFile(file.path, file.filename);
    return true;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
}
