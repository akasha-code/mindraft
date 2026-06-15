<script lang="ts">
  import { fileState } from "$lib/filesystem/fileState.svelte";
  import {
    exportDocumentAsHtmlFile,
    exportDocumentAsPdf,
    printMarkdownDocument,
    printRenderedDocument,
  } from "$lib/export/documentExport";
  import {
    canOpenInExternalEditor,
    canRevealInFolder,
    copyDocumentAsHtml,
    copyDocumentAsMarkdown,
    getExternalEditorHint,
    getRevealInFolderHint,
    openDocumentInExternalEditor,
    revealDocumentInFolder,
  } from "$lib/filesystem/share";
  import {
    documentUsesRelativeImages,
    pickBrowserAssetDirectory,
    supportsBrowserAssetDirectory,
  } from "$lib/filesystem/browserAssets";
  import { isTauriRuntime } from "$lib/platform/tauri";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
  }

  let { onError, onSuccess }: Props = $props();
  let open = $state(false);
  let root = $state<HTMLDivElement | null>(null);

  const hasDocument = $derived(Boolean(fileState.document));
  const canReveal = $derived(canRevealInFolder());
  const canOpenEditor = $derived(canOpenInExternalEditor());
  const showBrowserAssetPicker = $derived(
    !isTauriRuntime() &&
      supportsBrowserAssetDirectory() &&
      Boolean(fileState.document) &&
      documentUsesRelativeImages(fileState.document?.raw ?? ""),
  );

  const shareLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.label");
  });
  const shareTitle = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.title");
  });
  const actionFailed = $derived.by(() => {
    void localeState.locale;
    return t("common.actionFailed");
  });
  const revealHint = $derived.by(() => {
    void localeState.locale;
    return getRevealInFolderHint();
  });
  const editorHint = $derived.by(() => {
    void localeState.locale;
    return getExternalEditorHint();
  });
  const copySection = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.copy");
  });
  const copyMarkdownLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.copyMarkdown");
  });
  const copyHtmlLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.copyHtml");
  });
  const printSection = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.print");
  });
  const printRenderedLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.printRendered");
  });
  const printMarkdownLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.printMarkdown");
  });
  const exportSection = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.export");
  });
  const exportHtmlLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.exportHtml");
  });
  const exportPdfLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.exportPdf");
  });
  const fileSection = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.file");
  });
  const imageFolderLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.imageFolder");
  });
  const imageFolderHint = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.imageFolderHint");
  });
  const revealFolderLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.revealFolder");
  });
  const externalEditorLabel = $derived.by(() => {
    void localeState.locale;
    return t("shareMenu.externalEditor");
  });
  const imageFolderSelected = $derived.by(() => {
    void localeState.locale;
    return t("share.imageFolderSelected");
  });
  const imageFolderCancelled = $derived.by(() => {
    void localeState.locale;
    return t("share.imageFolderCancelled");
  });

  async function run(action: () => Promise<string> | string) {
    open = false;

    try {
      const message = await action();
      onSuccess?.(message);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : actionFailed,
      );
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (!root?.contains(event.target as Node)) {
      open = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="share-menu" bind:this={root}>
  <button
    type="button"
    class="share-menu__trigger"
    disabled={!hasDocument}
    aria-expanded={open}
    aria-haspopup="menu"
    aria-label={shareLabel}
    title={shareTitle}
    onclick={() => (open = !open)}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="14.5"
        cy="5"
        r="2.1"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle
        cx="5.5"
        cy="10"
        r="2.1"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle
        cx="14.5"
        cy="15"
        r="2.1"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <path
        d="M7.4 9.1 12.6 6.2M7.4 10.9 12.6 13.8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
  </button>

  {#if open}
    <div class="share-menu__panel" role="menu">
      <p class="share-menu__section">{copySection}</p>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        onclick={() => void run(copyDocumentAsMarkdown)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="4.5" y="2.5" width="7" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M6 5.5h4M6 7.5h4M6 9.5h2.5" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
          <path d="M3.5 5.5v6.5a1 1 0 0 0 1 1h6.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{copyMarkdownLabel}</span>
      </button>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        onclick={() => void run(copyDocumentAsHtml)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 4.5 5.5 2h5L13 4.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4.5Z" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M5.5 2v2.5H13M6 8h4M6 10h3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
        </svg>
        <span>{copyHtmlLabel}</span>
      </button>

      <p class="share-menu__section">{printSection}</p>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!hasDocument}
        onclick={() => void run(printRenderedDocument)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6V3.5A1 1 0 0 1 5 2.5h6a1 1 0 0 1 1 1V6" fill="none" stroke="currentColor" stroke-width="1.2" />
          <rect x="3" y="6" width="10" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
          <rect x="5" y="10.5" width="6" height="3" rx="0.6" fill="none" stroke="currentColor" stroke-width="1.2" />
          <circle cx="11.5" cy="8.2" r="0.55" fill="currentColor" />
        </svg>
        <span>{printRenderedLabel}</span>
      </button>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!hasDocument}
        onclick={() => void run(printMarkdownDocument)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6V3.5A1 1 0 0 1 5 2.5h6a1 1 0 0 1 1 1V6" fill="none" stroke="currentColor" stroke-width="1.2" />
          <rect x="3" y="6" width="10" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M5.5 10.5h5M5.5 12h3.5" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
        </svg>
        <span>{printMarkdownLabel}</span>
      </button>

      <p class="share-menu__section">{exportSection}</p>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!hasDocument}
        onclick={() => void run(exportDocumentAsHtmlFile)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2.5v7M5.5 7 8 9.5 10.5 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M3.5 11.5v1A1 1 0 0 0 4.5 13.5h7a1 1 0 0 0 1-1v-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{exportHtmlLabel}</span>
      </button>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!hasDocument}
        onclick={() => void run(exportDocumentAsPdf)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4.5 2.5h4.2L12.5 6.3V12a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M8.7 2.5V6h3.8M5.5 9.5h1.8M5.5 11.5h2.4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
        </svg>
        <span>{exportPdfLabel}</span>
      </button>

      <p class="share-menu__section">{fileSection}</p>
      {#if showBrowserAssetPicker}
        <button
          type="button"
          class="share-menu__item"
          role="menuitem"
          title={imageFolderHint}
          onclick={() =>
            void run(async () => {
              const picked = await pickBrowserAssetDirectory();
              return picked ? imageFolderSelected : imageFolderCancelled;
            })}
        >
          <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2.5 5.5a1 1 0 0 1 1-1h2.2l1-1.5h2.6l1 1.5H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-5Z" fill="none" stroke="currentColor" stroke-width="1.2" />
            <circle cx="8" cy="8.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.2" />
            <circle cx="8" cy="8.5" r="0.55" fill="currentColor" />
          </svg>
          <span>{imageFolderLabel}</span>
        </button>
      {/if}
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!canReveal}
        title={revealHint}
        onclick={() => void run(revealDocumentInFolder)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 5.5a1 1 0 0 1 1-1h2.2l1-1.5h2.6l1 1.5H12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-5Z" fill="none" stroke="currentColor" stroke-width="1.2" />
          <path d="M8 7.5v3.5M6.5 9.5H9.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{revealFolderLabel}</span>
      </button>
      <button
        type="button"
        class="share-menu__item"
        role="menuitem"
        disabled={!canOpenEditor}
        title={editorHint}
        onclick={() => void run(openDocumentInExternalEditor)}
      >
        <svg class="share-menu__icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M6.5 3.5H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          <path d="M9 3.5h3.5V7M8.5 7.5 12.5 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{externalEditorLabel}</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .share-menu {
    position: relative;
  }

  .share-menu__trigger {
    width: 2rem;
    height: 2rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .share-menu__trigger svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .share-menu__trigger:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--border-hairline);
    color: var(--text-secondary);
  }

  .share-menu__trigger:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  .share-menu__panel {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    min-width: 13.5rem;
    max-height: min(70vh, 24rem);
    overflow: auto;
    padding: 0.3rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 20;
    display: grid;
    gap: 0.12rem;
  }

  .share-menu__section {
    margin: 0.35rem 0.45rem 0.12rem;
    font-size: 0.64rem;
    font-weight: 560;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .share-menu__section:first-child {
    margin-top: 0.12rem;
  }

  .share-menu__item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    border: 0;
    border-radius: 0.35rem;
    padding: 0.45rem 0.55rem;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.82rem;
    text-align: left;
  }

  .share-menu__icon {
    flex: 0 0 auto;
    width: 0.95rem;
    height: 0.95rem;
    color: var(--text-muted);
  }

  .share-menu__item:hover:not(:disabled) {
    background: var(--bg-hover);
  }

  .share-menu__item:hover:not(:disabled) .share-menu__icon {
    color: var(--text-secondary);
  }

  .share-menu__item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
