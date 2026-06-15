<script lang="ts">
  import { externalChangeState } from "$lib/filesystem/externalChange.svelte";
  import {
    keepExternalChange,
    reloadExternalChange,
  } from "$lib/filesystem/fileWatch";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
  }

  let { onError, onSuccess }: Props = $props();

  const message = $derived.by(() => {
    void localeState.locale;
    return t("externalChange.message");
  });
  const reloadLabel = $derived.by(() => {
    void localeState.locale;
    return t("externalChange.reload");
  });
  const keepLabel = $derived.by(() => {
    void localeState.locale;
    return t("externalChange.keep");
  });
  const reloadSuccessMessage = $derived.by(() => {
    void localeState.locale;
    return t("externalChange.reloadSuccess");
  });
  const reloadErrorMessage = $derived.by(() => {
    void localeState.locale;
    return t("externalChange.reloadError");
  });

  async function handleReload() {
    try {
      await reloadExternalChange();
      onSuccess?.(reloadSuccessMessage);
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : reloadErrorMessage,
      );
    }
  }

  async function handleKeep() {
    try {
      await keepExternalChange();
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : reloadErrorMessage,
      );
    }
  }
</script>

{#if externalChangeState.pending}
  <div class="external-change-banner" role="alert">
    <p class="external-change-banner__message">{message}</p>
    <div class="external-change-banner__actions">
      <button type="button" onclick={() => void handleReload()}>{reloadLabel}</button>
      <button type="button" onclick={() => void handleKeep()}>{keepLabel}</button>
    </div>
  </div>
{/if}

<style>
  .external-change-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    flex-wrap: wrap;
    margin: 0.65rem 1rem 0;
    padding: 0.55rem 0.75rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--danger-border);
    background: var(--danger-soft);
    color: var(--danger-text);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .external-change-banner__message {
    margin: 0;
    flex: 1;
    min-width: 12rem;
  }

  .external-change-banner__actions {
    display: inline-flex;
    gap: 0.35rem;
  }

  .external-change-banner__actions button {
    border: 1px solid var(--danger-border);
    border-radius: var(--radius-sm);
    padding: 0.28rem 0.55rem;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 0.78rem;
  }

  .external-change-banner__actions button:hover {
    background: var(--bg-hover);
  }
</style>
