<script lang="ts">
  import LocaleFlag from "$components/LocaleFlag.svelte";
  import {
    localeState,
    LOCALE_OPTIONS,
    setLocale,
    t,
    type Locale,
  } from "$lib/i18n";

  let open = $state(false);
  let root = $state<HTMLDivElement | null>(null);

  const current = $derived(
    LOCALE_OPTIONS.find((option) => option.code === localeState.locale) ??
      LOCALE_OPTIONS[0],
  );

  function choose(locale: Locale) {
    setLocale(locale);
    open = false;
  }

  function handleWindowClick(event: MouseEvent) {
    if (!root?.contains(event.target as Node)) {
      open = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="language-selector" bind:this={root}>
  <button
    type="button"
    class="language-selector__trigger"
    aria-expanded={open}
    aria-haspopup="menu"
    aria-label="{t('locale.choose')}: {current.label}"
    title="{current.label}"
    onclick={() => (open = !open)}
  >
    <svg class="language-selector__icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.2" />
      <path
        d="M2.8 8h10.4M8 2.5c1.2 1.6 1.9 3.4 1.9 5.5S9.2 11.9 8 13.5c-1.2-1.6-1.9-3.4-1.9-5.5S6.8 4.1 8 2.5Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.1"
        stroke-linecap="round"
      />
    </svg>
    <LocaleFlag locale={localeState.locale} class="language-selector__flag" />
  </button>

  {#if open}
    <div class="language-selector__menu" role="menu">
      {#each LOCALE_OPTIONS as option (option.code)}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={option.code === localeState.locale}
          class="language-selector__menu-item"
          class:language-selector__menu-item--active={option.code === localeState.locale}
          onclick={() => choose(option.code)}
        >
          <LocaleFlag locale={option.code} class="language-selector__menu-flag" />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .language-selector {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .language-selector__trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.12rem 0.35rem;
    background: transparent;
    color: var(--text-muted);
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
  }

  .language-selector__trigger :global(.language-selector__flag) {
    width: 0.95rem;
    height: auto;
    border-radius: 0.12rem;
    box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08);
  }

  .language-selector__trigger:hover {
    background: var(--bg-hover);
    border-color: var(--border-hairline);
    color: var(--text-secondary);
  }

  .language-selector__icon {
    width: 0.82rem;
    height: 0.82rem;
  }

  .language-selector__menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 0.35rem);
    min-width: 7.5rem;
    padding: 0.25rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 25;
    display: grid;
    gap: 0.1rem;
  }

  .language-selector__menu-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    border: 0;
    border-radius: 0.35rem;
    padding: 0.38rem 0.5rem;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.72rem;
    text-align: left;
  }

  .language-selector__menu-item :global(.language-selector__menu-flag) {
    width: 0.9rem;
    height: auto;
    flex: 0 0 auto;
    border-radius: 0.12rem;
    box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08);
  }

  .language-selector__menu-item:hover {
    background: var(--bg-hover);
  }

  .language-selector__menu-item--active {
    color: var(--accent);
  }
</style>
