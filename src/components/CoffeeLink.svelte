<script lang="ts">
  import { t } from "$lib/i18n";
  import { APP_AUTHOR } from "$lib/constants/author";

  interface Props {
    compact?: boolean;
  }

  let { compact = false }: Props = $props();

  const coffeeLabel = $derived(t("author.coffeeLabel"));
  const coffeeAria = $derived(t("author.coffeeAria", { label: coffeeLabel }));
</script>

<a
  class="coffee-link"
  class:coffee-link--compact={compact}
  href={APP_AUTHOR.coffeeUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={coffeeAria}
  title={coffeeLabel}
>
  <svg class="coffee-link__icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3.5 4.5h7.5a1.8 1.8 0 0 1 0 3.6H10v2.4a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
    <path
      d="M10 5.2h1.1a1.6 1.6 0 0 1 0 3.2H10"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
    />
    <path
      d="M5 11.8h3.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
    />
    <path
      d="M4.8 2.8c.35-.55.95-.9 1.6-.9M8 1.9c.65 0 1.25.35 1.6.9"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
    />
  </svg>
  {#if !compact}
    <span class="coffee-link__label">{coffeeLabel}</span>
  {/if}
</a>

<style>
  .coffee-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .coffee-link:hover {
    color: var(--accent);
  }

  .coffee-link__icon {
    flex: 0 0 auto;
    width: 0.95rem;
    height: 0.95rem;
  }

  .coffee-link--compact .coffee-link__icon {
    width: 0.9rem;
    height: 0.9rem;
  }

  .coffee-link__label {
    font-size: inherit;
    line-height: 1;
    white-space: nowrap;
  }
</style>
