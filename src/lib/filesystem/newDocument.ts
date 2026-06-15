import { loadMarkdownFile } from "$lib/filesystem/fileState.svelte";
import { t } from "$lib/i18n";

let untitledCounter = 1;

export async function createNewDocument(): Promise<void> {
  const filename = untitledCounter === 1 ? "Untitled.md" : `Untitled ${untitledCounter}.md`;
  untitledCounter += 1;

  await loadMarkdownFile(
    null,
    filename,
    `# ${t("newDocument.title")}\n\n${t("newDocument.hint")}\n`,
  );
}

export function resetUntitledCounter(): void {
  untitledCounter = 1;
}
