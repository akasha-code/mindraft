<script lang="ts">
  import {
    getRecentFilesPreview,
    recentFilesState,
  } from "$lib/stores/recentFiles.svelte";
  import { openMarkdownPath } from "$lib/filesystem/openFile";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onOpen: () => void;
    onRecentError?: (message: string) => void;
    opening?: boolean;
  }

  let { onOpen, onRecentError, opening = false }: Props = $props();

  const LONG_PRESS_MS = 650;
  const MENU_PREVIEW_LIMIT = 10;

  const recentFiles = $derived(getRecentFilesPreview(MENU_PREVIEW_LIMIT));

  const openLabel = $derived.by(() => {
    void localeState.locale;
    return t("openButton.label");
  });
  const openTitle = $derived.by(() => {
    void localeState.locale;
    return t("openButton.title");
  });
  const recentTitle = $derived.by(() => {
    void localeState.locale;
    return t("openButton.recentTitle");
  });
  const emptyRecent = $derived.by(() => {
    void localeState.locale;
    return t("openButton.emptyRecent");
  });
  const openErrorMessage = $derived.by(() => {
    void localeState.locale;
    return t("recent.openError");
  });
  const loadingLabel = $derived.by(() => {
    void localeState.locale;
    return t("statusbar.loading");
  });

  let root = $state<HTMLDivElement | null>(null);
  let menuOpen = $state(false);
  let suppressClick = $state(false);
  let pressTimer: number | undefined;
  let activePointerId: number | null = null;

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = undefined;
    }
  }

  function openRecentMenu() {
    suppressClick = true;
    menuOpen = true;
  }

  function handlePointerDown(event: PointerEvent) {
    if (opening || event.button !== 0) {
      return;
    }

    activePointerId = event.pointerId;
    suppressClick = false;
    clearPressTimer();
    pressTimer = window.setTimeout(openRecentMenu, LONG_PRESS_MS);
  }

  function handlePointerUp(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return;
    }

    activePointerId = null;
    clearPressTimer();

    if (suppressClick) {
      return;
    }

    if (!menuOpen) {
      onOpen();
    }
  }

  function handlePointerCancel(event: PointerEvent) {
    if (activePointerId !== event.pointerId) {
      return;
    }

    activePointerId = null;
    clearPressTimer();
    suppressClick = false;
  }

  async function handleRecentSelect(path: string) {
    menuOpen = false;
    suppressClick = false;

    try {
      await openMarkdownPath(path);
    } catch (error) {
      onRecentError?.(
        error instanceof Error ? error.message : openErrorMessage,
      );
    }
  }

  function handleWindowClick(event: MouseEvent) {
    if (!root?.contains(event.target as Node)) {
      menuOpen = false;
      suppressClick = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="open-button" bind:this={root}>
  <button
    type="button"
    class="btn btn--open"
    disabled={opening}
    aria-expanded={menuOpen}
    aria-haspopup="menu"
    title={openTitle}
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 4.5h8.5L16 8v8.5H4V4.5z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <path
        d="M8 4.5V8H12.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
    </svg>
    <span>{opening ? loadingLabel : openLabel}</span>
  </button>

  {#if menuOpen}
    <div class="open-button__panel" role="menu" aria-label={recentTitle}>
      <p class="open-button__label">{recentTitle}</p>
      {#if recentFiles.length}
        {#each recentFiles as item (item.path)}
          <button
            type="button"
            role="menuitem"
            class="open-button__item"
            title={item.path}
            onclick={() => void handleRecentSelect(item.path)}
          >
            <span class="open-button__filename">{item.filename}</span>
            <span class="open-button__path">{item.path}</span>
          </button>
        {/each}
      {:else}
        <p class="open-button__empty">
          {emptyRecent}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .open-button {
    position: relative;
  }

  .btn--open {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    padding: 0.34rem 0.72rem;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 0.82rem;
    font-weight: 520;
    box-shadow: var(--shadow-chip);
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      transform 0.12s ease;
    touch-action: manipulation;
  }

  .btn--open svg {
    width: 0.92rem;
    height: 0.92rem;
    color: var(--text-secondary);
  }

  .btn--open:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--border-subtle);
  }

  .btn--open:active:not(:disabled) {
    transform: translateY(0.5px);
  }

  .btn--open:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  .open-button__panel {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    min-width: 16rem;
    max-width: min(24rem, 70vw);
    padding: 0.3rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 25;
    display: grid;
    gap: 0.12rem;
  }

  .open-button__label {
    margin: 0.15rem 0.45rem 0.25rem;
    font-size: 0.68rem;
    font-weight: 560;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .open-button__empty {
    margin: 0.15rem 0.45rem 0.35rem;
    font-size: 0.76rem;
    line-height: 1.45;
    color: var(--text-muted);
  }

  .open-button__item {
    display: grid;
    gap: 0.12rem;
    border: 0;
    border-radius: 0.35rem;
    padding: 0.45rem 0.55rem;
    background: transparent;
    text-align: left;
  }

  .open-button__item:hover {
    background: var(--bg-hover);
  }

  .open-button__filename {
    font-size: 0.82rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .open-button__path {
    font-size: 0.68rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
