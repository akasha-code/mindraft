import {
  extractBlocksFromRaw,
  renderFrontmatterHtml,
} from "./blockRanges";
import { renderMarkdown } from "./renderMarkdown";
import type { MarkdownBlock, MarkdownDocument } from "./types";

async function renderBlockHtml(
  block: Omit<MarkdownBlock, "html">,
  filePath: string | null,
): Promise<string> {
  if (block.type === "frontmatter") {
    return renderFrontmatterHtml(block.raw);
  }

  return renderMarkdown(block.raw, filePath);
}

export async function createMarkdownDocument(
  raw: string,
  path: string | null = null,
  filename = "Untitled.md",
): Promise<MarkdownDocument> {
  const drafts = extractBlocksFromRaw(raw);
  const blocks: MarkdownBlock[] = await Promise.all(
    drafts.map(async (draft) => ({
      ...draft,
      html: await renderBlockHtml(draft, path),
    })),
  );

  const html = blocks.map((block) => block.html).join("\n");

  return {
    path,
    filename,
    raw,
    blocks,
    html,
    dirty: false,
    lastSavedRaw: raw,
  };
}
