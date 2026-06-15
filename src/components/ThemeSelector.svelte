<script lang="ts">
  import { localeState, t } from "$lib/i18n";
  import {
    setThemePreference,
    themeState,
    type ThemePreference,
  } from "$lib/stores/theme.svelte";

  const themeLabel = $derived.by(() => {
    void localeState.locale;
    return t("theme.label");
  });

  const options = $derived.by((): {
    value: ThemePreference;
    label: string;
    title: string;
  }[] => {
    void localeState.locale;
    return [
      { value: "light", label: t("theme.light"), title: t("theme.light") },
      { value: "dark", label: t("theme.dark"), title: t("theme.dark") },
      { value: "system", label: t("theme.system"), title: t("theme.system") },
    ];
  });
</script>

<div class="icon-switch" role="radiogroup" aria-label={themeLabel}>
  {#each options as option}
    <button
      type="button"
      class="icon-switch__option"
      class:icon-switch__option--active={themeState.preference === option.value}
      role="radio"
      aria-checked={themeState.preference === option.value}
      aria-label={option.label}
      title={option.title}
      onclick={() => setThemePreference(option.value)}
    >
      {#if option.value === "light"}
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M10 2.5v2M10 15.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M5.4 14.6l1.4-1.4M13.2 6.8l1.4-1.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      {:else if option.value === "dark"}
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M12.8 3.4a6.8 6.8 0 1 0 3.8 11.8 5.2 5.2 0 0 1-3.8-11.8z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linejoin="round"
          />
        </svg>
      {:else}
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3.5" y="5" width="13" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M7 5V4.2a1.2 1.2 0 0 1 1.2-1.2h3.6A1.2 1.2 0 0 1 13 4.2V5" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path d="M3.5 8.5h13" stroke="currentColor" stroke-width="1.4" />
        </svg>
      {/if}
    </button>
  {/each}
</div>

<style>
  .icon-switch {
    display: inline-flex;
    align-items: center;
    padding: 0.12rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-hairline);
    background: var(--bg-muted);
    gap: 0.1rem;
  }

  .icon-switch__option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.85rem;
    height: 1.55rem;
    border: 0;
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--text-muted);
    transition:
      background 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease;
  }

  .icon-switch__option svg {
    width: 0.95rem;
    height: 0.95rem;
  }

  .icon-switch__option:hover {
    color: var(--text-secondary);
  }

  .icon-switch__option--active {
    background: var(--bg-surface);
    color: var(--accent);
    box-shadow: var(--shadow-chip);
  }
</style>
