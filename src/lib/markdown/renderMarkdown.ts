import { convertFileSrc } from "@tauri-apps/api/core";
import type { Schema } from "hast-util-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { resolveBrowserImageUrl } from "$lib/filesystem/browserAssets";
import { isTauriRuntime } from "$lib/platform/tauri";

const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "math",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "mfrac",
    "annotation",
  ],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    div: [...(defaultSchema.attributes?.div ?? []), "className", "data-mermaid"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading"],
    math: [...(defaultSchema.attributes?.math ?? []), "xmlns", "display"],
  },
};

function joinPath(dir: string, relative: string): string {
  if (/^([a-zA-Z]:\\|\/)/.test(relative)) {
    return relative;
  }

  const base = dir.split(/[/\\]/).filter(Boolean);
  for (const part of relative.split(/[/\\]/)) {
    if (part === "..") {
      base.pop();
    } else if (part !== "." && part !== "") {
      base.push(part);
    }
  }

  return base.join("/");
}

function wrapMermaidBlocks(html: string): string {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_match, source: string) => {
      const decoded = source
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"');
      return `<div class="mermaid" data-mermaid="true">${decoded.trim()}</div>`;
    },
  );
}

async function resolveLocalAssetUrls(
  html: string,
  filePath: string | null,
): Promise<string> {
  const imgPattern = /<img([^>]*?)src="([^"]+)"/g;
  const matches = [...html.matchAll(imgPattern)];

  let result = html;

  for (const match of matches) {
    const [fullMatch, attrs, src] = match;
    if (/^(https?:|data:|asset:|tauri:|blob:)/.test(src)) {
      continue;
    }

    let resolved = src;

    if (isTauriRuntime() && filePath) {
      const dir = filePath.replace(/[/\\][^/\\]+$/, "");
      const absolutePath = joinPath(dir, decodeURIComponent(src));
      resolved = convertFileSrc(absolutePath);
    } else {
      const browserUrl = await resolveBrowserImageUrl(decodeURIComponent(src));
      if (browserUrl) {
        resolved = browserUrl;
      }
    }

    result = result.replace(fullMatch, `<img${attrs}src="${resolved}"`);
  }

  return result;
}

export async function renderMarkdown(
  raw: string,
  filePath: string | null = null,
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify);

  const rendered = wrapMermaidBlocks(String(await processor.process(raw)));
  return resolveLocalAssetUrls(rendered, filePath);
}
