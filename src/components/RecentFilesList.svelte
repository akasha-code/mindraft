<script lang="ts">
  import { openMarkdownPath } from "$lib/filesystem/openFile";
  import {
    clearRecentFiles,
    getRecentFilesPreview,
    getRecentFilesThisYear,
    HOME_PREVIEW_LIMIT,
    recentFilesState,
  } from "$lib/stores/recentFiles.svelte";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
  }

  let { onError }: Props = $props();

  let showAll = $state(false);

  const previewFiles = $derived(getRecentFilesPreview(HOME_PREVIEW_LIMIT));
  const yearFiles = $derived(getRecentFilesThisYear());
  const visibleFiles = $derived(showAll ? yearFiles : previewFiles);
  const hasMore = $derived(yearFiles.length > HOME_PREVIEW_LIMIT);

  const recentTitle = $derived.by(() => {
    void localeState.locale;
    return t("recent.title");
  });
  const clearLabel = $derived.by(() => {
    void localeState.locale;
    return t("recent.clear");
  });
  const showMoreLabel = $derived.by(() => {
    void localeState.locale;
    return t("recent.showMore");
  });
  const showLessLabel = $derived.by(() => {
    void localeState.locale;
    return t("recent.showLess");
  });
  const openErrorMessage = $derived.by(() => {
    void localeState.locale;
    return t("recent.openError");
  });

  function formatOpenedAt(timestamp: number): string {
    return new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  }

  async function handleOpen(path: string) {
    try {
      await openMarkdownPath(path);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : openErrorMessage,
      );
    }
  }

  function handleClear() {
    clearRecentFiles();
    showAll = false;
  }
</script>

{#if recentFilesState.items.length}
  <section class="recent-files" aria-label={recentTitle}>
    <div class="recent-files__header">
      <h3>{recentTitle}</h3>
      <button type="button" class="recent-files__clear" onclick={handleClear}>
        {clearLabel}
      </button>
    </div>

    <ul class="recent-files__list">
      {#each visibleFiles as item (item.path)}
        <li>
          <button
            type="button"
            class="recent-files__item"
            title={item.path}
            onclick={() => void handleOpen(item.path)}
          >
            <span class="recent-files__filename">{item.filename}</span>
            <span class="recent-files__meta">
              <span class="recent-files__path">{item.path}</span>
              <span class="recent-files__date">{formatOpenedAt(item.openedAt)}</span>
            </span>
          </button>
        </li>
      {/each}
    </ul>

    {#if hasMore}
      <button
        type="button"
        class="recent-files__more"
        onclick={() => (showAll = !showAll)}
      >
        {showAll ? showLessLabel : showMoreLabel}
      </button>
    {/if}
  </section>
{/if}

<style>
  .recent-files {
    width: min(100%, 34rem);
    margin-top: 1.75rem;
    padding-top: 1.35rem;
    border-top: 1px solid var(--border-hairline);
    text-align: left;
  }

  .recent-files__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.55rem;
  }

  .recent-files__header h3 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 560;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .recent-files__clear {
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.74rem;
    padding: 0.15rem 0.25rem;
  }

  .recent-files__clear:hover {
    color: var(--danger-text);
  }

  .recent-files__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.2rem;
  }

  .recent-files__item {
    width: 100%;
    display: grid;
    gap: 0.18rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.62rem;
    background: transparent;
    text-align: left;
    transition:
      background 0.16s ease,
      border-color 0.16s ease;
  }

  .recent-files__item:hover {
    background: var(--bg-hover);
    border-color: var(--border-hairline);
  }

  .recent-files__filename {
    font-size: 0.86rem;
    font-weight: 520;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recent-files__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
  }

  .recent-files__path {
    font-size: 0.68rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .recent-files__date {
    font-size: 0.68rem;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .recent-files__more {
    margin-top: 0.45rem;
    border: 0;
    background: transparent;
    color: var(--accent);
    font-size: 0.76rem;
    padding: 0.2rem 0.1rem;
  }

  .recent-files__more:hover {
    color: var(--accent-hover);
  }
</style>
