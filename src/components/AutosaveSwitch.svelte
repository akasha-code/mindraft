<script lang="ts">
  import {
    autosaveState,
    setAutosaveEnabled,
  } from "$lib/stores/autosave.svelte";
  import { hasUnsavedChanges } from "$lib/filesystem/persistenceState.svelte";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onSave?: () => void;
    onSaveAs?: () => void;
    saving?: boolean;
  }

  let { onSave, onSaveAs, saving = false }: Props = $props();

  let saveClickTimer: ReturnType<typeof setTimeout> | null = null;

  const manualUnsaved = $derived(
    !autosaveState.enabled && hasUnsavedChanges(),
  );
  const manualSaved = $derived(
    !autosaveState.enabled && !hasUnsavedChanges(),
  );
  const autoEnabled = $derived(autosaveState.enabled);

  const autosaveLabel = $derived.by(() => {
    void localeState.locale;
    return t("autosave.label");
  });
  const autosaveTitleOn = $derived.by(() => {
    void localeState.locale;
    return t("autosave.titleOn");
  });
  const autosaveTitleOff = $derived.by(() => {
    void localeState.locale;
    return t("autosave.titleOff");
  });

  function handleManualClick() {
    if (autosaveState.enabled) {
      setAutosaveEnabled(false);
      return;
    }

    if (saveClickTimer) {
      clearTimeout(saveClickTimer);
    }

    saveClickTimer = setTimeout(() => {
      saveClickTimer = null;
      if (manualUnsaved) {
        onSave?.();
      }
    }, 240);
  }

  function handleManualDoubleClick(event: MouseEvent) {
    event.preventDefault();

    if (saveClickTimer) {
      clearTimeout(saveClickTimer);
      saveClickTimer = null;
    }

    onSaveAs?.();
  }

  function handleAutoClick() {
    if (!autosaveState.enabled) {
      setAutosaveEnabled(true);
    }
  }
</script>

<div class="icon-switch" role="group" aria-label={autosaveLabel}>
  <button
    type="button"
    class="icon-switch__option"
    class:icon-switch__option--active={!autosaveState.enabled}
    class:icon-switch__option--manual-saved={manualSaved}
    class:icon-switch__option--manual-unsaved={manualUnsaved}
    class:icon-switch__option--auto-mode={autoEnabled}
    aria-pressed={!autosaveState.enabled}
    title={autosaveTitleOff}
    aria-label={autosaveTitleOff}
    disabled={saving}
    onclick={handleManualClick}
    ondblclick={handleManualDoubleClick}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 3h9l3 3v11H4V3z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <path
        d="M7 3v4h5V3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <rect x="6.5" y="11" width="7" height="5" rx="0.8" fill="currentColor" opacity="0.18" />
    </svg>
  </button>
  <button
    type="button"
    class="icon-switch__option"
    class:icon-switch__option--active={autosaveState.enabled}
    class:icon-switch__option--auto-active={autosaveState.enabled}
    aria-pressed={autosaveState.enabled}
    title={autosaveTitleOn}
    aria-label={autosaveLabel}
    onclick={handleAutoClick}
  >
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <path
        d="M10 6.5v4.2l2.6 1.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
  </button>
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

  .icon-switch__option:hover:not(:disabled) {
    color: var(--text-secondary);
  }

  .icon-switch__option:disabled {
    opacity: 0.55;
    cursor: wait;
  }

  .icon-switch__option--active {
    background: var(--bg-surface);
    box-shadow: var(--shadow-chip);
  }

  .icon-switch__option--manual-saved {
    color: var(--accent);
  }

  .icon-switch__option--manual-unsaved {
    color: var(--danger-text);
  }

  .icon-switch__option--auto-active {
    color: var(--success-text);
  }

  .icon-switch__option--auto-mode {
    color: var(--success-text);
  }
</style>
