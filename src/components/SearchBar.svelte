<script lang="ts">
  import { localeState, t } from "$lib/i18n";
  import {
    exitSearchMode,
    replaceAllMatches,
    replaceCurrentMatch,
    searchOptions,
    searchState,
    toggleReplaceMode,
    toggleSearchCaseSensitive,
    toggleSearchRegex,
    updateSearchMatches,
  } from "$lib/search/searchState.svelte";

  interface Props {
    onNotify?: (message: string, tone?: "error" | "info") => void;
  }

  let { onNotify }: Props = $props();
  let input = $state<HTMLInputElement | null>(null);
  let replaceInput = $state<HTMLInputElement | null>(null);

  const searchPlaceholder = $derived.by(() => {
    void localeState.locale;
    return t("search.placeholder");
  });
  const replacePlaceholder = $derived.by(() => {
    void localeState.locale;
    return t("search.replacePlaceholder");
  });
  const ariaSearch = $derived.by(() => {
    void localeState.locale;
    return t("search.ariaSearch");
  });
  const ariaReplace = $derived.by(() => {
    void localeState.locale;
    return t("search.ariaReplace");
  });
  const caseLabel = $derived.by(() => {
    void localeState.locale;
    return t("search.case");
  });
  const regexLabel = $derived.by(() => {
    void localeState.locale;
    return t("search.regex");
  });
  const replaceToggleLabel = $derived.by(() => {
    void localeState.locale;
    return t("search.replaceToggle");
  });
  const replaceCurrentLabel = $derived.by(() => {
    void localeState.locale;
    return t("search.replaceCurrent");
  });
  const replaceAllLabel = $derived.by(() => {
    void localeState.locale;
    return t("search.replaceAll");
  });
  const replacedOneMessage = $derived.by(() => {
    void localeState.locale;
    return t("search.replacedOne");
  });

  $effect(() => {
    if (searchState.active) {
      input?.focus();
      input?.select();
    }
  });

  function handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    updateSearchMatches(target.value);
  }

  function handleReplaceInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    searchState.replaceQuery = target.value;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      exitSearchMode();
    }

    if (event.key === "Enter" && searchState.replaceMode) {
      event.preventDefault();
      void handleReplaceCurrent();
    }
  }

  async function handleReplaceCurrent() {
    const replaced = await replaceCurrentMatch();
    if (replaced) {
      onNotify?.(replacedOneMessage, "info");
    }
  }

  async function handleReplaceAll() {
    const count = await replaceAllMatches();
    void localeState.locale;
    onNotify?.(t("search.replacedMany", { count }), "info");
  }
</script>

{#if searchState.active}
  <div class="search-bar">
    <div class="search-bar__row">
      <span class="search-bar__prompt">/</span>
      <input
        bind:this={input}
        class="search-bar__input"
        type="search"
        value={searchState.query}
        aria-label={ariaSearch}
        placeholder={searchPlaceholder}
        oninput={handleInput}
        onkeydown={handleKeydown}
      />
      <button
        type="button"
        class="search-bar__toggle"
        class:search-bar__toggle--active={searchOptions.caseSensitive}
        aria-pressed={searchOptions.caseSensitive}
        title={caseLabel}
        onclick={toggleSearchCaseSensitive}
      >
        Aa
      </button>
      <button
        type="button"
        class="search-bar__toggle"
        class:search-bar__toggle--active={searchOptions.useRegex}
        aria-pressed={searchOptions.useRegex}
        title={regexLabel}
        onclick={toggleSearchRegex}
      >
        .*
      </button>
      <button
        type="button"
        class="search-bar__toggle"
        class:search-bar__toggle--active={searchState.replaceMode}
        aria-pressed={searchState.replaceMode}
        title={replaceToggleLabel}
        onclick={toggleReplaceMode}
      >
        ↔
      </button>
    </div>

    {#if searchState.replaceMode}
      <div class="search-bar__row search-bar__row--replace">
        <span class="search-bar__prompt">→</span>
        <input
          bind:this={replaceInput}
          class="search-bar__input"
          type="text"
          value={searchState.replaceQuery}
          aria-label={ariaReplace}
          placeholder={replacePlaceholder}
          oninput={handleReplaceInput}
          onkeydown={handleKeydown}
        />
        <button type="button" class="search-bar__action" onclick={() => void handleReplaceCurrent()}>
          {replaceCurrentLabel}
        </button>
        <button type="button" class="search-bar__action" onclick={() => void handleReplaceAll()}>
          {replaceAllLabel}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .search-bar {
    display: grid;
    gap: 0.35rem;
    padding: 0.45rem 0.9rem;
    border-top: 1px solid var(--border-hairline);
    background: var(--bg-surface);
  }

  .search-bar__row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .search-bar__prompt {
    color: var(--accent);
    font-family:
      "JetBrains Mono",
      "SFMono-Regular",
      Consolas,
      monospace;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .search-bar__input {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.88rem;
    outline: none;
  }

  .search-bar__input::-webkit-search-cancel-button {
    display: none;
  }

  .search-bar__toggle,
  .search-bar__action {
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    padding: 0.18rem 0.42rem;
    background: var(--bg-muted);
    color: var(--text-muted);
    font-size: 0.72rem;
  }

  .search-bar__toggle--active,
  .search-bar__action:hover {
    color: var(--accent);
    border-color: var(--accent-soft-border);
    background: var(--accent-soft);
  }
</style>
