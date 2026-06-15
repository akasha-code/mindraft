import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { t } from "$lib/i18n";
import { isTauriRuntime } from "$lib/platform/tauri";

type SaveResult = {
  saved: boolean;
  filename: string;
};

type SaveFilter = {
  name: string;
  extensions: string[];
};

function basenameFromPath(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function mimeTypeForExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "html":
      return "text/html";
    default:
      return "application/octet-stream";
  }
}

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandle>;
};

async function saveBlobInBrowser(
  blob: Blob,
  suggestedName: string,
  filters: SaveFilter[],
): Promise<SaveResult> {
  const pickerWindow = window as FilePickerWindow;

  if (pickerWindow.showSaveFilePicker) {
    try {
      const [primaryFilter] = filters;
      const handle = await pickerWindow.showSaveFilePicker!({
        suggestedName,
        types: [
          {
            description: primaryFilter?.name ?? t("common.file"),
            accept: Object.fromEntries(
              (primaryFilter?.extensions ?? ["bin"]).map((extension) => [
                mimeTypeForExtension(extension),
                [`.${extension}`],
              ]),
            ),
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { saved: true, filename: handle.name };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { saved: false, filename: suggestedName };
      }

      throw error instanceof Error
        ? error
        : new Error(t("errors.saveBlobBrowser"));
    }
  }

  downloadBlob(blob, suggestedName);
  return { saved: true, filename: suggestedName };
}

export async function saveBlobWithDialog(
  blob: Blob,
  suggestedName: string,
  filters: SaveFilter[],
  defaultPath?: string | null,
): Promise<SaveResult> {
  if (isTauriRuntime()) {
    const selected = await save({
      defaultPath: defaultPath ?? suggestedName,
      filters,
    });

    if (!selected) {
      return { saved: false, filename: suggestedName };
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    await invoke("write_binary_file", {
      path: selected,
      contents: bytes,
    });

    return { saved: true, filename: basenameFromPath(selected) };
  }

  return saveBlobInBrowser(blob, suggestedName, filters);
}
