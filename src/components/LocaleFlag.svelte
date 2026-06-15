<script lang="ts">
  import type { Locale } from "$lib/i18n";

  interface Props {
    locale: Locale;
    class?: string;
  }

  let { locale, class: className = "" }: Props = $props();
</script>

{#if locale === "en"}
  <svg class={className} viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="14" rx="1.2" fill="#012169" />
    <path
      d="M-1 0 21 14 M21 0 -1 14"
      stroke="#ffffff"
      stroke-width="3.2"
      fill="none"
    />
    <path
      d="M-1 0 21 14 M21 0 -1 14"
      stroke="#C8102E"
      stroke-width="1.8"
      fill="none"
    />
    <rect x="7.8" width="4.4" height="14" fill="#ffffff" />
    <rect y="4.8" width="20" height="4.4" fill="#ffffff" />
    <rect x="8.8" width="2.4" height="14" fill="#C8102E" />
    <rect y="5.8" width="20" height="2.4" fill="#C8102E" />
  </svg>
{:else if locale === "es"}
  <svg class={className} viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="14" rx="1.2" fill="#AA151B" />
    <rect y="3.5" width="20" height="7" fill="#F1BF00" />
  </svg>
{:else}
  <svg class={className} viewBox="0 0 20 14" aria-hidden="true">
    <rect width="20" height="14" rx="1.2" fill="#BA0C2F" />
    <rect x="5.5" width="3" height="14" fill="#fff" />
    <rect y="5.5" width="20" height="3" fill="#fff" />
    <rect x="6.5" width="1" height="14" fill="#00205B" />
    <rect y="6.5" width="20" height="1" fill="#00205B" />
  </svg>
{/if}
