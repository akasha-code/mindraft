import { t } from "$lib/i18n";

type BrowserAssetDirectoryWindow = Window & {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
};

let directoryHandle: FileSystemDirectoryHandle | null = null;
const blobUrlCache = new Map<string, string>();

function getPickerWindow(): BrowserAssetDirectoryWindow | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window as BrowserAssetDirectoryWindow;
}

export function supportsBrowserAssetDirectory(): boolean {
  return Boolean(getPickerWindow()?.showDirectoryPicker);
}

export function clearBrowserAssetDirectory(): void {
  for (const url of blobUrlCache.values()) {
    URL.revokeObjectURL(url);
  }

  blobUrlCache.clear();
  directoryHandle = null;
}

export async function pickBrowserAssetDirectory(): Promise<boolean> {
  const pickerWindow = getPickerWindow();
  if (!pickerWindow?.showDirectoryPicker) {
    return false;
  }

  try {
    directoryHandle = await pickerWindow.showDirectoryPicker();
    blobUrlCache.clear();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }

    throw error instanceof Error
      ? error
      : new Error(t("errors.imageFolder"));
  }
}

async function findFileInDirectory(
  dir: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<File | null> {
  const parts = relativePath.split(/[/\\]/).filter(Boolean);
  let current: FileSystemDirectoryHandle = dir;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const isLast = index === parts.length - 1;

    if (isLast) {
      try {
        const handle = await current.getFileHandle(part);
        return handle.getFile();
      } catch {
        return null;
      }
    }

    try {
      current = await current.getDirectoryHandle(part);
    } catch {
      return null;
    }
  }

  return null;
}

export async function resolveBrowserImageUrl(relativePath: string): Promise<string | null> {
  if (!directoryHandle) {
    return null;
  }

  const normalized = relativePath.replace(/^\.\//, "");
  const cached = blobUrlCache.get(normalized);
  if (cached) {
    return cached;
  }

  const file = await findFileInDirectory(directoryHandle, normalized);
  if (!file) {
    return null;
  }

  const url = URL.createObjectURL(file);
  blobUrlCache.set(normalized, url);
  return url;
}

export function hasBrowserAssetDirectory(): boolean {
  return Boolean(directoryHandle);
}

export function documentUsesRelativeImages(raw: string): boolean {
  return /!\[[^\]]*\]\((?!https?:|data:|mailto:|tel:|\/\/|tauri:|asset:|blob:)[^)]+\)/i.test(
    raw,
  );
}
