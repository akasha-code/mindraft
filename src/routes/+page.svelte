<script lang="ts">
  import { onMount } from "svelte";
  import CommandBar from "$components/CommandBar.svelte";
  import HeaderBar from "$components/HeaderBar.svelte";
  import MarkdownDocument from "$components/MarkdownDocument.svelte";
  import RuntimeBanner from "$components/RuntimeBanner.svelte";
  import SearchBar from "$components/SearchBar.svelte";
  import ShortcutsHelp from "$components/ShortcutsHelp.svelte";
  import AppAuthorFooter from "$components/AppAuthorFooter.svelte";
  import LanguageSelector from "$components/LanguageSelector.svelte";
  import HeadingPicker from "$components/HeadingPicker.svelte";
  import ExternalChangeBanner from "$components/ExternalChangeBanner.svelte";
  import StatusBanner from "$components/StatusBanner.svelte";
  import {
    clearFileError,
    fileState,
    switchToNextTab,
    switchToPreviousTab,
  } from "$lib/filesystem/fileState.svelte";
  import { closeActiveWorkspaceTab } from "$lib/filesystem/closeTab";
  import { initAppLifecycle } from "$lib/filesystem/appLifecycle";
  import { initFileWatch } from "$lib/filesystem/fileWatch";
  import { openMarkdownDialog } from "$lib/filesystem/openFile";
  import { saveCurrentDocument, saveDocumentAs } from "$lib/filesystem/saveFile";
  import {
    restoreWorkspaceSessionIfEmpty,
    syncWorkspaceSession,
  } from "$lib/filesystem/workspaceSession";
  import { hasUnsavedChanges } from "$lib/filesystem/persistenceState.svelte";
  import {
    enterCommandMode,
    getStatusModeLabel,
    isCommandMode,
    openHeadingPicker,
  } from "$lib/editing/commandState.svelte";
  import { getDocumentStats } from "$lib/document/stats";
  import {
    enterInsertMode,
    isInsertMode,
    navigateWhileInserting,
  } from "$lib/editing/editState.svelte";
  import {
    getActiveBlockMeta,
    selectFirstBlock,
    selectLastBlock,
    selectNextBlock,
    selectPreviousBlock,
  } from "$lib/navigation/documentState.svelte";
  import { shouldHandleNavigation, isEditableTarget } from "$lib/shortcuts/keymap";
  import { autosaveState } from "$lib/stores/autosave.svelte";
  import { initTheme } from "$lib/stores/theme.svelte";
  import {
    enterSearchMode,
    exitSearchMode,
    getSearchStatusLabel,
    searchState,
    selectNextMatch,
  } from "$lib/search/searchState.svelte";
  import {
    dismissStatusBanner,
    showStatusBanner,
    statusBanner,
  } from "$lib/ui/statusBanner.svelte";
  import { t } from "$lib/i18n";

  let opening = $state(false);
  let saving = $state(false);
  let shortcutsOpen = $state(false);
  let lastGPressAt = 0;

  const blockMeta = $derived(getActiveBlockMeta());
  const documentStats = $derived(
    fileState.document ? getDocumentStats(fileState.document.raw) : null,
  );
  const statusMode = $derived(getStatusModeLabel(isInsertMode()));
  const searchStatus = $derived(getSearchStatusLabel());
  const loadingLabel = $derived(t("statusbar.loading"));
  const unsavedLabel = $derived(t("statusbar.unsaved"));
  const autosaveLabel = $derived(t("statusbar.autosave"));
  const wordsLabel = $derived(
    documentStats
      ? t("statusbar.words", { count: documentStats.words })
      : "",
  );
  const readingLabel = $derived(
    documentStats
      ? t("statusbar.reading", { minutes: documentStats.readingMinutes })
      : "",
  );
  const blockLabel = $derived(
    blockMeta
      ? t("statusbar.block", {
          index: blockMeta.index,
          total: blockMeta.total,
        })
      : "",
  );

  function notify(message: string, tone: "error" | "info" = "error") {
    showStatusBanner(message, tone);
  }

  function dismissBanner() {
    dismissStatusBanner();
    clearFileError();
  }

  $effect(() => {
    if (fileState.error) {
      showStatusBanner(fileState.error, "error");
    }
  });

  async function handleOpen() {
    opening = true;
    dismissStatusBanner();
    clearFileError();

    try {
      await openMarkdownDialog();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("errors.openFile"),
      );
    } finally {
      opening = false;
    }
  }

  async function handleSave() {
    saving = true;
    dismissStatusBanner();
    clearFileError();

    try {
      const infoMessage = await saveCurrentDocument();
      if (infoMessage) {
        notify(infoMessage, "info");
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("errors.saveFile"),
      );
    } finally {
      saving = false;
    }
  }

  async function handleSaveAs() {
    saving = true;
    dismissStatusBanner();
    clearFileError();

    try {
      const infoMessage = await saveDocumentAs();
      if (infoMessage) {
        notify(infoMessage, "info");
      }
    } catch (error) {
      notify(
        error instanceof Error ? error.message : t("errors.saveFile"),
      );
    } finally {
      saving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    const modifier = event.metaKey || event.ctrlKey;

    if (event.key === "?" && !isInsertMode() && !isCommandMode()) {
      event.preventDefault();
      shortcutsOpen = !shortcutsOpen;
      return;
    }

    if (event.key === "Escape") {
      if (shortcutsOpen) {
        event.preventDefault();
        shortcutsOpen = false;
        return;
      }

      if (searchState.active) {
        event.preventDefault();
        exitSearchMode();
        return;
      }
    }

    if (modifier && event.key.toLowerCase() === "f" && fileState.document) {
      event.preventDefault();
      shortcutsOpen = false;
      enterSearchMode();
      return;
    }

    if (modifier && event.key.toLowerCase() === "o") {
      event.preventDefault();
      void handleOpen();
      return;
    }

    if (modifier && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void handleSave();
      return;
    }

    if (modifier && event.key.toLowerCase() === "w" && fileState.document) {
      event.preventDefault();
      void closeActiveWorkspaceTab();
      return;
    }

    if (modifier && event.key === "Tab" && fileState.tabs.length > 1) {
      event.preventDefault();
      if (event.shiftKey) {
        switchToPreviousTab();
      } else {
        switchToNextTab();
      }
      return;
    }

    if (modifier && event.key.toLowerCase() === "g" && fileState.document) {
      event.preventDefault();
      openHeadingPicker();
      return;
    }

    if (isCommandMode()) {
      return;
    }

    if (
      searchState.active &&
      !isEditableTarget(event.target) &&
      (event.key === "n" || event.key === "N")
    ) {
      event.preventDefault();
      selectNextMatch(event.key === "N");
      return;
    }

    if (!fileState.document || !shouldHandleNavigation(event)) {
      return;
    }

    if (event.key === "/" && !isInsertMode() && !searchState.active) {
      event.preventDefault();
      shortcutsOpen = false;
      enterSearchMode();
      return;
    }

    if (searchState.active) {
      return;
    }

    if (event.key === ":" && !isInsertMode()) {
      event.preventDefault();
      enterCommandMode();
      return;
    }

    if (event.key === "i" && !isInsertMode()) {
      event.preventDefault();
      enterInsertMode();
      return;
    }

    if (event.key === "j") {
      event.preventDefault();
      if (isInsertMode()) {
        void navigateWhileInserting(selectNextBlock);
      } else {
        selectNextBlock();
      }
      return;
    }

    if (event.key === "k") {
      event.preventDefault();
      if (isInsertMode()) {
        void navigateWhileInserting(selectPreviousBlock);
      } else {
        selectPreviousBlock();
      }
      return;
    }

    if (event.key === "G") {
      event.preventDefault();
      if (isInsertMode()) {
        void navigateWhileInserting(selectLastBlock);
      } else {
        selectLastBlock();
      }
      return;
    }

    if (event.key === "g") {
      const now = Date.now();
      if (now - lastGPressAt < 350) {
        event.preventDefault();
        if (isInsertMode()) {
          void navigateWhileInserting(selectFirstBlock);
        } else {
          selectFirstBlock();
        }
        lastGPressAt = 0;
      } else {
        lastGPressAt = now;
      }
    }
  }

  onMount(() => {
    initTheme();

    const cleanupWatch = initFileWatch();
    let cleanupLifecycle: (() => void) | undefined;

    void initAppLifecycle((message) => {
      if (message) {
        notify(message);
      }
    }).then(async (cleanup) => {
      cleanupLifecycle = cleanup;
      await restoreWorkspaceSessionIfEmpty();
    });

    const handleBeforeUnload = () => {
      syncWorkspaceSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      cleanupLifecycle?.();
      cleanupWatch();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell">
  <HeaderBar
    onOpen={handleOpen}
    onSave={handleSave}
    onSaveAs={handleSaveAs}
    onShareError={notify}
    onShareSuccess={(message) => notify(message, "info")}
    onOpenError={notify}
    {opening}
    {saving}
  />

  <main class="app-main">
    <RuntimeBanner />

    <ExternalChangeBanner
      onError={notify}
      onSuccess={(message) => notify(message, "info")}
    />

    {#if fileState.loading}
      <StatusBanner
        message={loadingLabel}
        tone="neutral"
        onDismiss={dismissBanner}
      />
    {/if}

    {#if statusBanner.current}
      <StatusBanner
        message={statusBanner.current.message}
        tone={statusBanner.current.tone}
        onDismiss={dismissBanner}
      />
    {/if}

    <MarkdownDocument onRecentError={notify} />
  </main>

  <CommandBar onError={notify} />
  <SearchBar onNotify={(message, tone) => notify(message, tone ?? "info")} />

  <HeadingPicker onError={notify} />
  <ShortcutsHelp open={shortcutsOpen} onClose={() => (shortcutsOpen = false)} />

  <footer class="statusbar" aria-live="polite">
    <div class="statusbar__left">
      <span
        class="statusbar__mode"
        class:statusbar__mode--insert={isInsertMode()}
        class:statusbar__mode--command={isCommandMode()}
        class:statusbar__mode--search={searchState.active}
      >
        {statusMode}
      </span>
      {#if searchStatus}
        <span class="statusbar__search">{searchStatus}</span>
      {/if}
      {#if autosaveState.enabled}
        <span class="statusbar__autosave">{autosaveLabel}</span>
      {/if}
      {#if hasUnsavedChanges() && !autosaveState.enabled}
        <span class="statusbar__unsaved">{unsavedLabel}</span>
      {/if}
      {#if blockMeta && !isInsertMode() && !isCommandMode() && !searchState.active}
        <span class="statusbar__divider"></span>
        <span class="statusbar__meta">{blockLabel}</span>
        <span class="statusbar__type">{blockMeta.type}</span>
      {/if}
      {#if documentStats && fileState.document}
        <span class="statusbar__divider"></span>
        <span class="statusbar__meta">{wordsLabel}</span>
        <span class="statusbar__meta">{readingLabel}</span>
      {/if}
    </div>
    <div class="statusbar__right">
      {#if fileState.document?.path}
        <span class="statusbar__path">{fileState.document.path}</span>
      {/if}
      <LanguageSelector />
    </div>
  </footer>

  <AppAuthorFooter />
</div>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-shrink: 0;
    height: var(--statusbar-height);
    padding: 0 0.9rem;
    border-top: 1px solid var(--border-hairline);
    background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
    color: var(--text-muted);
    font-size: 0.72rem;
  }

  .statusbar__right {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    flex-shrink: 0;
  }

  .statusbar__left {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }

  .statusbar__mode {
    font-weight: 560;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .statusbar__mode--insert,
  .statusbar__mode--command,
  .statusbar__mode--search {
    color: var(--accent);
  }

  .statusbar__search {
    padding: 0.08rem 0.38rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-hairline);
    background: var(--bg-muted);
    color: var(--text-secondary);
  }

  .statusbar__autosave,
  .statusbar__unsaved {
    padding: 0.08rem 0.38rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-hairline);
    background: var(--bg-muted);
  }

  .statusbar__autosave {
    color: var(--accent);
  }

  .statusbar__unsaved {
    color: var(--danger-text);
    border-color: var(--danger-border);
    background: var(--danger-soft);
  }

  .statusbar__divider {
    width: 1px;
    height: 0.75rem;
    background: var(--border-hairline);
  }

  .statusbar__meta {
    color: var(--text-secondary);
  }

  .statusbar__type {
    padding: 0.08rem 0.38rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-hairline);
    background: var(--bg-muted);
    color: var(--text-muted);
    text-transform: lowercase;
  }

  .statusbar__path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(28rem, 42vw);
  }
</style>
