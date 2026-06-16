<script lang="ts">
  import { onMount } from "svelte";
  import mermaid from "mermaid";
  import InlineMarkdownEditor from "$components/InlineMarkdownEditor.svelte";
  import {
    confirmInsertMode,
    enterInsertMode,
    isInsertMode,
    navigateWhileInserting,
  } from "$lib/editing/editState.svelte";
  import {
    focusBlock,
    releaseBlockFocus,
    selectNextBlock,
    selectPreviousBlock,
  } from "$lib/navigation/documentState.svelte";
  import {
    isBlockAnimating,
    isBlockUnsaved,
  } from "$lib/filesystem/persistenceState.svelte";
  import { searchState } from "$lib/search/searchState.svelte";
  import { localeState, t } from "$lib/i18n";
  import type { MarkdownBlock } from "$lib/markdown/types";

  interface Props {
    block: MarkdownBlock;
    focused?: boolean;
    editing?: boolean;
    onSelect?: (blockId: string) => void;
  }

  let {
    block,
    focused = false,
    editing = false,
    onSelect,
  }: Props = $props();

  let contentEl = $state<HTMLDivElement | null>(null);

  onMount(() => {
    mermaid.initialize({ startOnLoad: false, theme: "neutral" });
  });

  $effect(() => {
    if (editing || !contentEl || !block.html.includes("mermaid")) {
      return;
    }

    void mermaid.run({ nodes: contentEl.querySelectorAll(".mermaid") });
  });

  const showUnsaved = $derived(!editing && isBlockUnsaved(block));
  const showSavedFlash = $derived(isBlockAnimating(block));
  const hasSearchMatch = $derived(
    searchState.active &&
      searchState.matches.some((match) => match.blockId === block.id),
  );
  const isCurrentSearchMatch = $derived(
    searchState.active &&
      searchState.currentIndex >= 0 &&
      searchState.matches[searchState.currentIndex]?.blockId === block.id,
  );

  const blockAriaLabel = $derived.by(() => {
    void localeState.locale;
    return t("block.aria", { type: block.type });
  });
  const unsavedLabel = $derived.by(() => {
    void localeState.locale;
    return t("block.unsaved");
  });

  async function handleSelect() {
    if (isInsertMode() && !editing) {
      await navigateWhileInserting(() => focusBlock(block.id));
      return;
    }

    if (editing) {
      return;
    }

    onSelect?.(block.id);
  }

  async function handleDoubleClick(event: MouseEvent) {
    event.preventDefault();

    if (editing) {
      return;
    }

    if (isInsertMode()) {
      await navigateWhileInserting(() => focusBlock(block.id));
      return;
    }

    focusBlock(block.id);
    enterInsertMode();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (editing) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void handleSelect();
    }
  }

  async function handleConfirm(value: string) {
    await confirmInsertMode(value);
  }

  async function handleNavigateNext() {
    await navigateWhileInserting(selectNextBlock);
  }

  async function handleNavigatePrevious() {
    await navigateWhileInserting(selectPreviousBlock);
  }
</script>

<div
  class="md-block"
  class:md-block--focused={focused && !editing}
  class:md-block--editing={editing}
  class:md-block--unsaved={showUnsaved}
  class:md-block--saved-flash={showSavedFlash}
  class:md-block--search-hit={hasSearchMatch && !editing}
  class:md-block--search-current={isCurrentSearchMatch && !editing}
  data-block-id={block.id}
  data-block-type={block.type}
  onclick={() => void handleSelect()}
  ondblclick={(event) => void handleDoubleClick(event)}
  onmouseenter={() => focusBlock(block.id)}
  onmouseleave={() => releaseBlockFocus()}
  onkeydown={handleKeydown}
  tabindex={editing ? -1 : 0}
  role="button"
  aria-pressed={focused}
  aria-label={blockAriaLabel}
>
  {#if showUnsaved}
    <span class="md-block__unsaved" aria-label={unsavedLabel} title={unsavedLabel}></span>
  {/if}
  {#if editing}
    {#key block.id}
      <InlineMarkdownEditor
        value={block.raw}
        onConfirm={handleConfirm}
        onNavigateNext={handleNavigateNext}
        onNavigatePrevious={handleNavigatePrevious}
      />
    {/key}
  {:else}
    <div class="md-block__content markdown-body" bind:this={contentEl}>
      {@html block.html}
    </div>
  {/if}
</div>

<style>
  .md-block {
    position: relative;
    margin: 0.15rem 0;
    padding: 0.35rem 0.85rem 0.35rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    outline: none;
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .md-block::before {
    content: "";
    position: absolute;
    left: 0.35rem;
    top: 0.55rem;
    bottom: 0.55rem;
    width: 1.5px;
    border-radius: var(--radius-full);
    background: transparent;
    transition: background 0.18s ease;
  }

  .md-block--focused {
    background: var(--block-active-bg);
    border-color: var(--block-active-border);
    box-shadow: var(--shadow-block);
  }

  .md-block:focus-visible {
    border-color: var(--accent-soft-border);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }

  .md-block--focused::before {
    background: var(--accent);
  }

  .md-block--editing {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    padding-top: 0.35rem;
    padding-bottom: 0.35rem;
  }

  .md-block--editing::before {
    top: 0.35rem;
    bottom: 0.35rem;
    width: 1.5px;
    background: color-mix(in srgb, var(--accent) 72%, transparent);
  }

  .md-block--editing :global(.inline-editor) {
    border: 0.5px solid var(--border-hairline);
    border-radius: calc(var(--radius-sm) - 0.05rem);
    background: var(--bg-surface);
    box-shadow: none;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .md-block--editing :global(.inline-editor:focus-within) {
    border-color: color-mix(in srgb, var(--accent) 28%, var(--border-hairline));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-ring) 65%, transparent);
  }

  .md-block--search-hit {
    border-color: color-mix(in srgb, var(--accent) 18%, transparent);
  }

  .md-block--search-current {
    border-color: var(--accent-soft-border);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }

  .md-block--unsaved {
    border-color: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .md-block--saved-flash {
    animation: block-saved-flash 720ms ease;
  }

  .md-block__unsaved {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    width: 0.42rem;
    height: 0.42rem;
    border-radius: var(--radius-full);
    background: var(--accent);
    pointer-events: none;
    opacity: 0.88;
  }

  @keyframes block-saved-flash {
    0% {
      border-color: var(--accent);
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 35%, transparent);
    }
    45% {
      border-color: color-mix(in srgb, var(--accent) 55%, transparent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
    }
    100% {
      border-color: transparent;
      box-shadow: none;
    }
  }

  .md-block__content :global(> :first-child) {
    margin-top: 0;
  }

  .md-block__content :global(> :last-child) {
    margin-bottom: 0;
  }
</style>
