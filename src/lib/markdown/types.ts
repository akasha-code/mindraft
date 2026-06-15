export type MarkdownBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "blockquote"
  | "code"
  | "table"
  | "image"
  | "html"
  | "thematicBreak"
  | "frontmatter"
  | "unknown";

export type MarkdownBlock = {
  id: string;
  type: MarkdownBlockType;
  startOffset: number;
  endOffset: number;
  raw: string;
  html: string;
};

export type MarkdownDocument = {
  path: string | null;
  filename: string;
  raw: string;
  blocks: MarkdownBlock[];
  html: string;
  dirty: boolean;
  lastSavedRaw?: string;
};

export type AppMode = "normal" | "insert" | "command";
