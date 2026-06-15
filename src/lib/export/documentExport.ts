import katexCss from "katex/dist/katex.min.css?raw";
import { downloadMarkdownFile } from "$lib/filesystem/browserFile";
import { fileState } from "$lib/filesystem/fileState.svelte";
import { saveBlobWithDialog } from "$lib/export/saveExportBlob";
import { t } from "$lib/i18n";
import type { MarkdownDocument } from "$lib/markdown/types";

const EXPORT_STYLES = `
  :root { color-scheme: light; }
  body {
    margin: 0;
    padding: 2rem 1.5rem;
    background: #fff;
    color: #1a1a18;
    font-family: "Source Serif 4", Georgia, serif;
    line-height: 1.72;
    font-size: 11pt;
  }
  .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
    font-family: Inter, "Segoe UI", sans-serif;
    line-height: 1.22;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 1.4rem 0 0.6rem;
  }
  .markdown-body h1 { font-size: 1.75rem; margin-top: 0; }
  .markdown-body h2 { font-size: 1.35rem; }
  .markdown-body h3 { font-size: 1.12rem; }
  .markdown-body p, .markdown-body ul, .markdown-body ol, .markdown-body blockquote, .markdown-body pre, .markdown-body table {
    margin: 0 0 0.75rem;
  }
  .markdown-body pre, .markdown-body code {
    font-family: "JetBrains Mono", Consolas, monospace;
    font-size: 0.88em;
  }
  .markdown-body pre {
    padding: 0.75rem 0.9rem;
    border-radius: 0.4rem;
    background: #f3f3f1;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .markdown-body blockquote {
    padding-left: 0.9rem;
    border-left: 3px solid #d8d8d4;
    color: #5f5f5a;
  }
  .markdown-body table { border-collapse: collapse; width: 100%; }
  .markdown-body th, .markdown-body td {
    border: 1px solid #e2e2de;
    padding: 0.35rem 0.55rem;
    text-align: left;
  }
  .markdown-body img {
    max-width: 100%;
    height: auto;
  }
  .markdown-body svg {
    max-width: 100%;
    height: auto;
  }
  @media print {
    body { padding: 0; }
  }
`;

const PDF_EXPORT_STYLES = `${EXPORT_STYLES}\n${katexCss}`;

function requireDocument(): NonNullable<typeof fileState.document> {
  const document = fileState.document;
  if (!document) {
    throw new Error(t("errors.noDocument"));
  }

  return document;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildRenderedBody(document: MarkdownDocument): string {
  return document.blocks.map((block) => block.html).join("\n");
}

function collectLiveRenderedBody(document: MarkdownDocument): string {
  return document.blocks
    .map((block) => {
      const liveBlock = window.document.querySelector<HTMLElement>(
        `[data-block-id="${block.id}"] .md-block__content.markdown-body`,
      );

      return liveBlock?.innerHTML ?? block.html;
    })
    .join("\n");
}

export function buildStandaloneHtml(document: MarkdownDocument): string {
  const title = escapeHtml(document.filename);
  const body = buildRenderedBody(document);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${EXPORT_STYLES}\n${katexCss}</style>
</head>
<body>
  <article class="markdown-body">
${body}
  </article>
</body>
</html>`;
}

function buildMarkdownPrintHtml(document: MarkdownDocument): string {
  const title = escapeHtml(document.filename);
  const content = escapeHtml(document.raw);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 1.5rem;
      font-family: "JetBrains Mono", Consolas, monospace;
      font-size: 10pt;
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>${content}</body>
</html>`;
}

function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function htmlFilename(filename: string): string {
  const base = filename.replace(/\.(md|markdown)$/i, "");
  return `${base}.html`;
}

function pdfFilename(filename: string): string {
  const base = filename.replace(/\.(md|markdown)$/i, "");
  return `${base}.pdf`;
}

function defaultPdfPath(document: MarkdownDocument): string | null {
  if (!document.path) {
    return null;
  }

  return document.path.replace(/\.(md|markdown)$/i, ".pdf");
}

function openPrintWindow(html: string, title: string, autoPrint: boolean): void {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    throw new Error(t("errors.printWindow"));
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;

  if (autoPrint) {
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function createPdfMount(bodyHtml: string): HTMLElement {
  const mount = window.document.createElement("div");
  mount.style.position = "fixed";
  mount.style.left = "-10000px";
  mount.style.top = "0";
  mount.style.width = "210mm";
  mount.style.background = "#fff";
  mount.style.color = "#1a1a18";

  const style = window.document.createElement("style");
  style.textContent = PDF_EXPORT_STYLES;
  mount.appendChild(style);

  const article = window.document.createElement("article");
  article.className = "markdown-body";
  article.innerHTML = bodyHtml;
  mount.appendChild(article);

  window.document.body.appendChild(mount);
  return mount;
}

async function renderPdfBlob(target: HTMLElement): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const pdfBlob = await html2pdf()
    .set({
      margin: [12, 12, 12, 12],
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(target)
    .outputPdf("blob");

  if (!(pdfBlob instanceof Blob)) {
    throw new Error(t("errors.exportPdfInvalid"));
  }

  return pdfBlob;
}

export function printRenderedDocument(): string {
  window.print();
  return t("export.printRendered");
}

export function printMarkdownDocument(): string {
  const document = requireDocument();
  openPrintWindow(buildMarkdownPrintHtml(document), document.filename, true);
  return t("export.printMarkdown");
}

export function exportDocumentAsHtmlFile(): string {
  const document = requireDocument();
  const html = buildStandaloneHtml(document);
  downloadTextFile(html, htmlFilename(document.filename), "text/html");
  return t("export.htmlExported", { name: htmlFilename(document.filename) });
}

export async function exportDocumentAsPdf(): Promise<string> {
  const document = requireDocument();
  const suggestedName = pdfFilename(document.filename);
  const bodyHtml = collectLiveRenderedBody(document);
  const mount = createPdfMount(bodyHtml);
  const target = mount.querySelector("article");

  if (!target) {
    mount.remove();
    throw new Error(t("errors.exportPrepare"));
  }

  try {
    await waitForImages(target);
    const pdfBlob = await renderPdfBlob(target);
    const result = await saveBlobWithDialog(
      pdfBlob,
      suggestedName,
      [{ name: t("common.pdf"), extensions: ["pdf"] }],
      defaultPdfPath(document),
    );

    if (!result.saved) {
      return t("export.pdfCancelled");
    }

    return t("export.pdfSaved", { name: result.filename });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `${t("errors.exportPdf")}: ${error.message}`
        : t("errors.exportPdf"),
    );
  } finally {
    mount.remove();
  }
}

export function exportDocumentAsMarkdownFile(): string {
  const document = requireDocument();
  downloadMarkdownFile(document.raw, document.filename);
  return t("export.markdownExported", { name: document.filename });
}
