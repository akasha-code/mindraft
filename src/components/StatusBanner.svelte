<script lang="ts">
  import { localeState, t } from "$lib/i18n";
  import type { BannerTone } from "$lib/ui/statusBanner.svelte";

  interface Props {
    message: string;
    tone?: BannerTone;
    onDismiss?: () => void;
  }

  let { message, tone = "info", onDismiss }: Props = $props();

  const dismissLabel = $derived.by(() => {
    void localeState.locale;
    return t("statusBanner.dismiss");
  });
</script>

<div
  class="status-banner"
  class:status-banner--error={tone === "error"}
  class:status-banner--info={tone === "info"}
  class:status-banner--neutral={tone === "neutral"}
  role={tone === "error" ? "alert" : "status"}
>
  <p class="status-banner__message">{message}</p>
  <button
    type="button"
    class="status-banner__close"
    aria-label={dismissLabel}
    title={dismissLabel}
    onclick={() => onDismiss?.()}
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

<style>
  .status-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    margin: 0.65rem 1rem 0;
    padding: 0.55rem 0.55rem 0.55rem 0.8rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-hairline);
    background: var(--accent-soft);
    color: var(--text-primary);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .status-banner--error {
    background: var(--danger-soft);
    border-color: var(--danger-border);
    color: var(--danger-text);
  }

  .status-banner--info {
    background: var(--accent-soft);
    border-color: var(--accent-soft-border);
    color: var(--text-primary);
  }

  .status-banner--neutral {
    background: var(--bg-muted);
    border-color: var(--border-hairline);
    color: var(--text-secondary);
  }

  .status-banner__message {
    margin: 0;
    flex: 1;
    min-width: 0;
  }

  .status-banner__close {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.55rem;
    height: 1.55rem;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: inherit;
    opacity: 0.72;
    transition:
      opacity 0.15s ease,
      background 0.15s ease;
  }

  .status-banner__close svg {
    width: 0.82rem;
    height: 0.82rem;
  }

  .status-banner__close:hover {
    opacity: 1;
    background: color-mix(in srgb, currentColor 10%, transparent);
  }
</style>
