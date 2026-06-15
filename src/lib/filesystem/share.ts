import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  downloadMarkdownFile,
  getBrowserFileHandle,
} from "$lib/filesystem/browserFile";
import { buildStandaloneHtml } from "$lib/export/documentExport";
import { ensureDocumentOnDiskPath } from "$lib/filesystem/saveFile";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { t } from "$lib/i18n";
import { isTauriRuntime } from "$lib/platform/tauri";

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy copy.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) {
    throw new Error(t("errors.clipboard"));
  }
}

function requireDocument(): NonNullable<typeof fileState.document> {
  const document = fileState.document;
  if (!document) {
    throw new Error(t("errors.noDocument"));
  }

  return document;
}

function requireDocumentDiskPath(): string {
  const document = requireDocument();

  if (!document.path) {
    throw new Error(t("save.saveFirst"));
  }

  return document.path;
}

function buildShareHtml(document: NonNullable<typeof fileState.document>): string {
  return buildStandaloneHtml(document);
}

function parentDirectoryFromPath(path: string): string {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.join("/") || path;
}

function pathToFileUrl(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }

  return normalized.startsWith("/") ? `file://${normalized}` : `file:///${normalized}`;
}

export async function copyDocumentAsMarkdown(): Promise<string> {
  const document = requireDocument();
  await copyText(document.raw);
  return t("share.copyMarkdown");
}

export async function copyDocumentAsHtml(): Promise<string> {
  const document = requireDocument();
  await copyText(buildShareHtml(document));
  return t("share.copyHtml");
}

async function revealDocumentInFolderBrowser(
  document: NonNullable<typeof fileState.document>,
): Promise<string> {
  if (document.path) {
    const directoryUrl = pathToFileUrl(parentDirectoryFromPath(document.path));
    window.open(directoryUrl, "_blank", "noopener,noreferrer");
    return t("share.revealBrowserTab");
  }

  downloadMarkdownFile(document.raw, document.filename);

  if (getBrowserFileHandle()) {
    return t("share.revealBrowserDownload", { name: document.filename });
  }

  return t("share.revealBrowserDownloads", { name: document.filename });
}

async function openDocumentInExternalEditorBrowser(
  document: NonNullable<typeof fileState.document>,
): Promise<string> {
  if (getBrowserFileHandle()) {
    downloadMarkdownFile(document.raw, document.filename);
    return t("share.externalBrowserHandle", { name: document.filename });
  }

  downloadMarkdownFile(document.raw, document.filename);
  return t("share.externalBrowserDownload", { name: document.filename });
}

async function openDocumentOnDesktop(filePath: string, content: string): Promise<string> {
  await invoke("write_markdown_file", {
    path: filePath,
    content,
  });

  try {
    return await invoke<string>("open_markdown_externally", { path: filePath });
  } catch {
    await openPath(filePath);
    return t("share.openedDefaultApp");
  }
}

async function revealOnDesktop(filePath: string): Promise<string> {
  try {
    return await invoke<string>("reveal_markdown_in_folder", { path: filePath });
  } catch {
    try {
      await openPath(parentDirectoryFromPath(filePath));
      return t("share.revealFolderManager");
    } catch {
      const directoryUrl = pathToFileUrl(parentDirectoryFromPath(filePath));
      await openPath(directoryUrl);
      return t("share.revealFolderBrowser");
    }
  }
}

export async function revealDocumentInFolder(): Promise<string> {
  const document = requireDocument();

  if (!isTauriRuntime()) {
    return revealDocumentInFolderBrowser(document);
  }

  const path = requireDocumentDiskPath();
  return revealOnDesktop(path);
}

export async function openDocumentInExternalEditor(): Promise<string> {
  const document = requireDocument();

  if (!isTauriRuntime()) {
    return openDocumentInExternalEditorBrowser(document);
  }

  const path = await ensureDocumentOnDiskPath();
  return openDocumentOnDesktop(path, document.raw);
}

export function canRevealInFolder(): boolean {
  if (!fileState.document) {
    return false;
  }

  if (isTauriRuntime()) {
    return Boolean(fileState.document.path);
  }

  return true;
}

export function canOpenInExternalEditor(): boolean {
  return Boolean(fileState.document);
}

export function getRevealInFolderHint(): string | undefined {
  if (!fileState.document) {
    return t("share.openDocumentFirst");
  }

  if (isTauriRuntime() && !fileState.document.path) {
    return t("share.revealSaveFirst");
  }

  if (!isTauriRuntime()) {
    return fileState.document.path
      ? t("share.revealBrowserHint")
      : t("share.revealBrowserPathHint");
  }

  return undefined;
}

export function getExternalEditorHint(): string | undefined {
  if (!fileState.document) {
    return t("share.openDocumentFirst");
  }

  if (!isTauriRuntime()) {
    return t("share.externalBrowserHint");
  }

  if (!fileState.document.path) {
    return t("share.externalSaveFirstHint");
  }

  return undefined;
}
