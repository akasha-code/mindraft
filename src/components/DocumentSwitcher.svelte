<script lang="ts">
  import {
    fileState,
    getOpenTabs,
    isTabUnsaved,
    reorderWorkspaceTabs,
    switchWorkspaceTab,
  } from "$lib/filesystem/fileState.svelte";
  import { closeWorkspaceTab } from "$lib/filesystem/closeTab";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
  }

  let { onError }: Props = $props();

  let open = $state(false);
  let root = $state<HTMLDivElement | null>(null);

  const tabs = $derived(getOpenTabs());
  const activeTab = $derived(
    tabs.find((tab) => tab.id === fileState.activeTabId) ?? null,
  );
  const noFileLabel = $derived.by(() => {
    void localeState.locale;
    return t("documentSwitcher.noFile");
  });
  const filename = $derived(
    activeTab?.document.filename ?? noFileLabel,
  );
  const unsavedLabel = $derived.by(() => {
    void localeState.locale;
    return t("documentSwitcher.unsaved");
  });
  const closeTabLabel = $derived.by(() => {
    void localeState.locale;
    return t("documentSwitcher.close");
  });
  const tabsHint = $derived.by(() => {
    void localeState.locale;
    return t("documentSwitcher.tabs", { count: tabs.length });
  });
  const closeErrorMessage = $derived.by(() => {
    void localeState.locale;
    return t("errors.closeFile");
  });
  const showDirtyDot = $derived(
    activeTab ? isTabUnsaved(activeTab) : false,
  );
  const hasMultiple = $derived(tabs.length > 1);

  function handleWindowClick(event: MouseEvent) {
    if (!root?.contains(event.target as Node)) {
      open = false;
    }
  }

  function handleSelect(tabId: string) {
    switchWorkspaceTab(tabId);
    open = false;
  }

  async function handleClose(event: MouseEvent, tabId: string) {
    event.stopPropagation();

    try {
      const closed = await closeWorkspaceTab(tabId);
      if (closed && !fileState.tabs.length) {
        open = false;
      }
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : closeErrorMessage,
      );
    }
  }

  let draggedTabId = $state<string | null>(null);

  function handleDragStart(event: DragEvent, tabId: string) {
    draggedTabId = tabId;
    event.dataTransfer?.setData("text/plain", tabId);
    event.dataTransfer!.effectAllowed = "move";
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";
  }

  function handleDrop(event: DragEvent, targetTabId: string) {
    event.preventDefault();
    const sourceId = draggedTabId ?? event.dataTransfer?.getData("text/plain");
    draggedTabId = null;

    if (!sourceId || sourceId === targetTabId) {
      return;
    }

    const fromIndex = tabs.findIndex((tab) => tab.id === sourceId);
    const toIndex = tabs.findIndex((tab) => tab.id === targetTabId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    reorderWorkspaceTabs(fromIndex, toIndex);
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="doc-switcher" bind:this={root}>
  {#if activeTab}
    <button
      type="button"
      class="doc-switcher__trigger"
      aria-expanded={open}
      aria-haspopup="menu"
      title={activeTab.document.path ?? activeTab.document.filename}
      onclick={() => (open = !open)}
    >
      <span class="doc-switcher__filename">{filename}</span>
      {#if showDirtyDot}
        <span class="doc-switcher__dirty" aria-label={unsavedLabel}></span>
      {/if}
      <svg
        class="doc-switcher__caret"
        class:doc-switcher__caret--open={open}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          d="m6 8 4 4 4-4"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  {:else}
    <span class="doc-switcher__empty">{noFileLabel}</span>
  {/if}

  {#if open && tabs.length}
    <div class="doc-switcher__panel" role="menu" aria-label="Archivos abiertos">
      {#each tabs as tab (tab.id)}
        <div
          class="doc-switcher__item"
          class:doc-switcher__item--active={tab.id === fileState.activeTabId}
          role="presentation"
          draggable="true"
          ondragstart={(event) => handleDragStart(event, tab.id)}
          ondragover={handleDragOver}
          ondrop={(event) => handleDrop(event, tab.id)}
        >
          <button
            type="button"
            role="menuitem"
            class="doc-switcher__select"
            title={tab.document.path ?? tab.document.filename}
            onclick={() => handleSelect(tab.id)}
          >
            <span class="doc-switcher__item-name">{tab.document.filename}</span>
            {#if isTabUnsaved(tab)}
              <span class="doc-switcher__item-dot" aria-hidden="true"></span>
            {/if}
          </button>
          <button
            type="button"
            class="doc-switcher__close"
            aria-label={closeTabLabel}
            title={closeTabLabel}
            onclick={(event) => void handleClose(event, tab.id)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="m5.5 5.5 9 9M14.5 5.5l-9 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      {/each}
      {#if hasMultiple}
        <p class="doc-switcher__hint">{tabsHint}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .doc-switcher {
    position: relative;
    min-width: 0;
  }

  .doc-switcher__trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: min(22rem, 38vw);
    border: 0;
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.35rem;
    background: transparent;
    color: var(--text-primary);
    transition: background 0.16s ease;
  }

  .doc-switcher__trigger:hover {
    background: var(--bg-hover);
  }

  .doc-switcher__filename {
    font-size: 0.88rem;
    font-weight: 560;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .doc-switcher__dirty {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: var(--radius-full);
    background: var(--danger-text);
    flex-shrink: 0;
  }

  .doc-switcher__caret {
    width: 0.82rem;
    height: 0.82rem;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: transform 0.16s ease;
  }

  .doc-switcher__caret--open {
    transform: rotate(180deg);
  }

  .doc-switcher__empty {
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .doc-switcher__panel {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 14rem;
    max-width: min(24rem, 70vw);
    padding: 0.3rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 30;
  }

  .doc-switcher__item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.15rem;
    border-radius: 0.35rem;
  }

  .doc-switcher__item--active {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }

  .doc-switcher__select {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0.45rem 0.35rem 0.45rem 0.55rem;
    text-align: left;
    color: var(--text-primary);
  }

  .doc-switcher__select:hover {
    color: var(--text-primary);
  }

  .doc-switcher__item-name {
    font-size: 0.82rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .doc-switcher__item-dot {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: var(--radius-full);
    background: var(--danger-text);
    flex-shrink: 0;
  }

  .doc-switcher__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.65rem;
    height: 1.65rem;
    margin-right: 0.15rem;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
  }

  .doc-switcher__close svg {
    width: 0.78rem;
    height: 0.78rem;
  }

  .doc-switcher__close:hover {
    background: var(--bg-hover);
    color: var(--danger-text);
  }

  .doc-switcher__hint {
    margin: 0.2rem 0.45rem 0.15rem;
    font-size: 0.68rem;
    color: var(--text-muted);
  }
</style>
