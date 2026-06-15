<script lang="ts">
  import AutosaveSwitch from "$components/AutosaveSwitch.svelte";
  import DocumentSwitcher from "$components/DocumentSwitcher.svelte";
  import OpenButton from "$components/OpenButton.svelte";
  import ShareMenu from "$components/ShareMenu.svelte";
  import ThemeSelector from "$components/ThemeSelector.svelte";

  interface Props {
    onOpen: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onShareError?: (message: string) => void;
    onShareSuccess?: (message: string) => void;
    onOpenError?: (message: string) => void;
    opening?: boolean;
    saving?: boolean;
  }

  let {
    onOpen,
    onSave,
    onSaveAs,
    onShareError,
    onShareSuccess,
    onOpenError,
    opening = false,
    saving = false,
  }: Props = $props();
</script>

<header class="headerbar">
  <div class="headerbar__start">
    <OpenButton
      {onOpen}
      {opening}
      onRecentError={onOpenError}
    />
    <AutosaveSwitch {onSave} {onSaveAs} {saving} />
  </div>

  <div class="headerbar__center">
    <DocumentSwitcher onError={onOpenError} />
  </div>

  <div class="headerbar__end">
    <ThemeSelector />
    <ShareMenu onError={onShareError} onSuccess={onShareSuccess} />
  </div>
</header>

<style>
  .headerbar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    height: var(--header-height);
    padding: 0 1rem;
    border-bottom: 1px solid var(--border-hairline);
    background: color-mix(in srgb, var(--bg-surface) 88%, transparent);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .headerbar__start,
  .headerbar__end {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .headerbar__start {
    justify-content: flex-start;
  }

  .headerbar__end {
    justify-content: flex-end;
  }

  .headerbar__center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }
</style>
