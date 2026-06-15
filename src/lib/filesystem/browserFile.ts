import { t } from "$lib/i18n";

let activeHandle: FileSystemFileHandle | null = null;

type PickerType = {
  description: string;
  accept: Record<string, string[]>;
};

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: PickerType[];
  }) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    types?: PickerType[];
  }) => Promise<FileSystemFileHandle[]>;
};

function getFilePickerWindow(): FilePickerWindow | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window as FilePickerWindow;
}

export function supportsOpenFilePicker(): boolean {
  return Boolean(getFilePickerWindow()?.showOpenFilePicker);
}

export function getBrowserFileHandle(): FileSystemFileHandle | null {
  return activeHandle;
}

export function setBrowserFileHandle(handle: FileSystemFileHandle | null): void {
  activeHandle = handle;
}

export function clearBrowserFileHandle(): void {
  activeHandle = null;
}

function supportsSaveFilePicker(): boolean {
  return Boolean(getFilePickerWindow()?.showSaveFilePicker);
}

function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadMarkdownFile(content: string, filename: string): void {
  downloadMarkdown(content, filename);
}

async function writeToHandle(
  handle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function saveDocumentInBrowser(
  content: string,
  filename: string,
): Promise<{ saved: boolean; filename: string; method: "handle" | "picker" | "download" }> {
  const handle = activeHandle;

  if (handle) {
    await writeToHandle(handle, content);
    return { saved: true, filename: handle.name, method: "handle" };
  }

  if (supportsSaveFilePicker()) {
    try {
      const pickerWindow = getFilePickerWindow();
      const picked = await pickerWindow!.showSaveFilePicker!({
        suggestedName: filename.endsWith(".md") ? filename : `${filename}.md`,
        types: [
          {
            description: t("common.markdown"),
            accept: {
              "text/markdown": [".md", ".markdown"],
            },
          },
        ],
      });

      await writeToHandle(picked, content);
      activeHandle = picked;
      return { saved: true, filename: picked.name, method: "picker" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { saved: false, filename, method: "picker" };
      }

      throw error instanceof Error
        ? error
        : new Error(t("errors.saveBrowser"));
    }
  }

  downloadMarkdown(content, filename);
  return { saved: true, filename, method: "download" };
}

export async function saveDocumentAsInBrowser(
  content: string,
  filename: string,
): Promise<{ saved: boolean; filename: string; method: "handle" | "picker" | "download" }> {
  if (supportsSaveFilePicker()) {
    try {
      const pickerWindow = getFilePickerWindow();
      const picked = await pickerWindow!.showSaveFilePicker!({
        suggestedName: filename.endsWith(".md") ? filename : `${filename}.md`,
        types: [
          {
            description: t("common.markdown"),
            accept: {
              "text/markdown": [".md", ".markdown"],
            },
          },
        ],
      });

      await writeToHandle(picked, content);
      activeHandle = picked;
      return { saved: true, filename: picked.name, method: "picker" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { saved: false, filename, method: "picker" };
      }

      throw error instanceof Error
        ? error
        : new Error(t("errors.saveBrowser"));
    }
  }

  downloadMarkdown(content, filename);
  return { saved: true, filename, method: "download" };
}

export type BrowserOpenedFile = {
  filename: string;
  content: string;
};

export async function pickMarkdownInBrowser(): Promise<BrowserOpenedFile | null> {
  const pickerWindow = getFilePickerWindow();

  if (!pickerWindow?.showOpenFilePicker) {
    return null;
  }

  try {
    const [handle] = await pickerWindow.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: t("common.markdown"),
          accept: {
            "text/markdown": [".md", ".markdown"],
            "text/plain": [".md", ".markdown"],
          },
        },
      ],
    });

    const file = await handle.getFile();
    activeHandle = handle;

    return {
      filename: file.name,
      content: await file.text(),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }

    throw error instanceof Error
      ? error
      : new Error(t("errors.openBrowser"));
  }
}
