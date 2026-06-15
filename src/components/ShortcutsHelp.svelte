<script lang="ts">
  import { localeState, t } from "$lib/i18n";

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose }: Props = $props();

  const groups = $derived.by(() => {
    void localeState.locale;
    return [
      {
        title: t("shortcuts.groups.files.title"),
        items: [
          [t("shortcuts.groups.files.open"), t("shortcuts.groups.files.openKeys")],
          [t("shortcuts.groups.files.new"), t("shortcuts.groups.files.newKeys")],
          [t("shortcuts.groups.files.save"), t("shortcuts.groups.files.saveKeys")],
          [t("shortcuts.groups.files.saveAs"), t("shortcuts.groups.files.saveAsKeys")],
          [t("shortcuts.groups.files.closeTab"), t("shortcuts.groups.files.closeTabKeys")],
          [t("shortcuts.groups.files.closeOthers"), t("shortcuts.groups.files.closeOthersKeys")],
          [t("shortcuts.groups.files.closeAll"), t("shortcuts.groups.files.closeAllKeys")],
        ],
      },
      {
        title: t("shortcuts.groups.tabs.title"),
        items: [
          [t("shortcuts.groups.tabs.next"), t("shortcuts.groups.tabs.nextKeys")],
          [t("shortcuts.groups.tabs.previous"), t("shortcuts.groups.tabs.previousKeys")],
          [t("shortcuts.groups.tabs.reorder"), t("shortcuts.groups.tabs.reorderKeys")],
        ],
      },
      {
        title: t("shortcuts.groups.navigation.title"),
        items: [
          [t("shortcuts.groups.navigation.headings"), t("shortcuts.groups.navigation.headingsKeys")],
          [t("shortcuts.groups.navigation.nextBlock"), t("shortcuts.groups.navigation.nextBlockKeys")],
          [t("shortcuts.groups.navigation.prevBlock"), t("shortcuts.groups.navigation.prevBlockKeys")],
          [t("shortcuts.groups.navigation.first"), t("shortcuts.groups.navigation.firstKeys")],
          [t("shortcuts.groups.navigation.last"), t("shortcuts.groups.navigation.lastKeys")],
        ],
      },
      {
        title: t("shortcuts.groups.editing.title"),
        items: [
          [t("shortcuts.groups.editing.editBlock"), t("shortcuts.groups.editing.editBlockKeys")],
          [t("shortcuts.groups.editing.confirm"), t("shortcuts.groups.editing.confirmKeys")],
          [t("shortcuts.groups.editing.undoRedo"), t("shortcuts.groups.editing.undoRedoKeys")],
          [t("shortcuts.groups.editing.command"), t("shortcuts.groups.editing.commandKeys")],
        ],
      },
      {
        title: t("shortcuts.groups.searchGroup.title"),
        items: [
          [t("shortcuts.groups.searchGroup.find"), t("shortcuts.groups.searchGroup.findKeys")],
          [t("shortcuts.groups.searchGroup.options"), t("shortcuts.groups.searchGroup.optionsKeys")],
          [t("shortcuts.groups.searchGroup.next"), t("shortcuts.groups.searchGroup.nextKeys")],
          [t("shortcuts.groups.searchGroup.previous"), t("shortcuts.groups.searchGroup.previousKeys")],
        ],
      },
      {
        title: t("shortcuts.groups.quit.title"),
        items: [
          [t("shortcuts.groups.quit.closeApp"), t("shortcuts.groups.quit.closeAppKeys")],
          [t("shortcuts.groups.quit.saveAndClose"), t("shortcuts.groups.quit.saveAndCloseKeys")],
          [t("shortcuts.groups.quit.forceClose"), t("shortcuts.groups.quit.forceCloseKeys")],
        ],
      },
    ];
  });

  const shortcutsTitle = $derived.by(() => {
    void localeState.locale;
    return t("shortcuts.title");
  });
  const closeBackdropLabel = $derived.by(() => {
    void localeState.locale;
    return t("shortcuts.closeBackdrop");
  });
  const closeLabel = $derived.by(() => {
    void localeState.locale;
    return t("shortcuts.close");
  });
  const footerHtml = $derived.by(() => {
    void localeState.locale;
    return t("shortcuts.footer");
  });
</script>

{#if open}
  <button
    type="button"
    class="shortcuts-help__backdrop"
    aria-label={closeBackdropLabel}
    onclick={() => onClose?.()}
  ></button>
  <div class="shortcuts-help" role="dialog" aria-modal="true" aria-label={shortcutsTitle}>
    <div class="shortcuts-help__header">
      <h2>{shortcutsTitle}</h2>
      <button
        type="button"
        class="shortcuts-help__close"
        aria-label={closeLabel}
        onclick={() => onClose?.()}
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

    <div class="shortcuts-help__grid">
      {#each groups as group}
        <section class="shortcuts-help__group">
          <h3>{group.title}</h3>
          <ul>
            {#each group.items as [label, keys]}
              <li>
                <span>{label}</span>
                <kbd>{keys}</kbd>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>

    <p class="shortcuts-help__footer">{@html footerHtml}</p>
  </div>
{/if}

<style>
  .shortcuts-help__backdrop {
    position: fixed;
    inset: 0;
    border: 0;
    background: rgba(10, 10, 10, 0.18);
    z-index: 40;
  }

  .shortcuts-help {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(42rem, calc(100vw - 2rem));
    max-height: min(80vh, 38rem);
    overflow: auto;
    padding: 1rem 1.1rem 0.9rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 41;
  }

  .shortcuts-help__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.85rem;
  }

  .shortcuts-help__header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 620;
  }

  .shortcuts-help__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
  }

  .shortcuts-help__close svg {
    width: 0.85rem;
    height: 0.85rem;
  }

  .shortcuts-help__close:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
  }

  .shortcuts-help__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem 1rem;
  }

  .shortcuts-help__group h3 {
    margin: 0 0 0.35rem;
    font-size: 0.72rem;
    font-weight: 560;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .shortcuts-help__group ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.28rem;
  }

  .shortcuts-help__group li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .shortcuts-help kbd {
    display: inline-block;
    padding: 0.08rem 0.38rem;
    border: 1px solid var(--border-hairline);
    border-radius: 0.32rem;
    background: var(--bg-muted);
    font-family: inherit;
    font-size: 0.74rem;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .shortcuts-help__footer {
    margin: 0.85rem 0 0;
    font-size: 0.74rem;
    color: var(--text-muted);
    text-align: center;
  }

  @media (max-width: 640px) {
    .shortcuts-help__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
