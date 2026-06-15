<script lang="ts">
  import HomeCoffeeQr from "$components/HomeCoffeeQr.svelte";
  import MarkdownBlock from "$components/MarkdownBlock.svelte";
  import RecentFilesList from "$components/RecentFilesList.svelte";
  import { editState } from "$lib/editing/editState.svelte";
  import { fileState } from "$lib/filesystem/fileState.svelte";
  import { localeState, t } from "$lib/i18n";
  import { APP_NAME, APP_REPO_URL } from "$lib/constants/brand";
  import {
    focusBlock,
    navigationState,
  } from "$lib/navigation/documentState.svelte";

  const homeTitle = $derived.by(() => {
    void localeState.locale;
    return t("home.title");
  });
  const homeBody = $derived.by(() => {
    void localeState.locale;
    return t("home.body");
  });
  const homeHint = $derived.by(() => {
    void localeState.locale;
    return t("home.hint");
  });
  const appName = $derived(APP_NAME);

  interface Props {
    onRecentError?: (message: string) => void;
  }

  let { onRecentError }: Props = $props();

  let scrollContainer = $state<HTMLElement | null>(null);

  $effect(() => {
    if (editState.mode === "insert") {
      return;
    }

    const blockId = navigationState.activeBlockId;
    if (!blockId || !scrollContainer) {
      return;
    }

    const element = scrollContainer.querySelector(
      `[data-block-id="${blockId}"]`,
    );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });
</script>

{#if fileState.document}
  <div class="document-viewport" bind:this={scrollContainer}>
    <div class="document-canvas">
      {#each fileState.document.blocks as block (block.id)}
        <MarkdownBlock
          {block}
          focused={navigationState.activeBlockId === block.id}
          editing={editState.editingBlockId === block.id}
          onSelect={focusBlock}
        />
      {/each}
    </div>
  </div>
{:else}
  <div class="empty-state">
    <a
      class="empty-state__badge"
      href={APP_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {appName}
    </a>
    <h2>{homeTitle}</h2>
    <p>{@html homeBody}</p>
    <p class="empty-state__hint">{@html homeHint}</p>
    <RecentFilesList onError={onRecentError} />
    <HomeCoffeeQr />
  </div>
{/if}

<style>
  .document-viewport {
    flex: 1;
    min-height: 0;
    overflow: auto;
    scroll-behavior: smooth;
  }

  .document-canvas {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 2.75rem 1.25rem 5rem;
  }
</style>
