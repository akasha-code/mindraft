import type { Content, Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { MarkdownBlock, MarkdownBlockType } from "./types";

type BlockDraft = Omit<MarkdownBlock, "html">;

const FRONTMATTER_PATTERN = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function nodeToBlockType(node: Content): MarkdownBlockType {
  switch (node.type) {
    case "heading":
      return "heading";
    case "paragraph":
      return "paragraph";
    case "list":
      return "list";
    case "blockquote":
      return "blockquote";
    case "code":
      return "code";
    case "table":
      return "table";
    case "thematicBreak":
      return "thematicBreak";
    case "html":
      return "html";
    default:
      return "unknown";
  }
}

function splitFrontmatter(raw: string): {
  frontmatter: string | null;
  bodyOffset: number;
} {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: null, bodyOffset: 0 };
  }

  return {
    frontmatter: match[0],
    bodyOffset: match[0].length,
  };
}

export function parseMarkdownAst(raw: string): Root {
  const { bodyOffset } = splitFrontmatter(raw);
  const body = raw.slice(bodyOffset);
  const processor = unified().use(remarkParse).use(remarkGfm);
  return processor.parse(body) as Root;
}

export function extractBlocksFromRaw(raw: string): BlockDraft[] {
  const blocks: BlockDraft[] = [];
  const { frontmatter, bodyOffset } = splitFrontmatter(raw);

  if (frontmatter) {
    blocks.push({
      id: "block-0-frontmatter",
      type: "frontmatter",
      startOffset: 0,
      endOffset: frontmatter.length,
      raw: frontmatter,
    });
  }

  const ast = parseMarkdownAst(raw);

  for (const [index, node] of ast.children.entries()) {
    const start = (node.position?.start.offset ?? 0) + bodyOffset;
    const end = (node.position?.end.offset ?? start) + bodyOffset;
    const blockRaw = raw.slice(start, end);

    if (!blockRaw.trim()) {
      continue;
    }

    blocks.push({
      id: `block-${start}-${node.type}`,
      type: nodeToBlockType(node),
      startOffset: start,
      endOffset: end,
      raw: blockRaw,
    });
  }

  return blocks;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderFrontmatterHtml(raw: string): string {
  return `<pre class="md-frontmatter"><code>${escapeHtml(raw.trimEnd())}</code></pre>`;
}
