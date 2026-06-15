<script lang="ts">
  import { fileState } from "$lib/filesystem/fileState.svelte";
  import {
    closeHeadingPicker,
    headingPickerState,
  } from "$lib/editing/commandState.svelte";
  import { extractHeadings, jumpToHeading } from "$lib/navigation/headings";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
  }

  let { onError }: Props = $props();
  let query = $state("");
  let input = $state<HTMLInputElement | null>(null);

  const headings = $derived(extractHeadings(fileState.document?.blocks ?? []));
  const filtered = $derived(
    query.trim()
      ? headings.filter((heading) =>
          heading.text.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : headings,
  );

  const pickerTitle = $derived.by(() => {
    void localeState.locale;
    return t("headingPicker.title");
  });
  const filterPlaceholder = $derived.by(() => {
    void localeState.locale;
    return t("headingPicker.filter");
  });
  const emptyLabel = $derived.by(() => {
    void localeState.locale;
    return t("headingPicker.empty");
  });
  const notFoundLabel = $derived.by(() => {
    void localeState.locale;
    return t("headingPicker.notFound");
  });
  const closeBackdropLabel = $derived.by(() => {
    void localeState.locale;
    return t("shortcuts.closeBackdrop");
  });
  const emptyMessage = $derived(
    headings.length === 0 ? emptyLabel : notFoundLabel,
  );

  $effect(() => {
    if (headingPickerState.open) {
      query = "";
      input?.focus();
    }
  });

  function handleSelect(text: string) {
    const target = jumpToHeading(headings, text);
    if (!target) {
      void localeState.locale;
      onError?.(t("commands.headingNotFound", { name: text }));
      return;
    }

    closeHeadingPicker();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeHeadingPicker();
    }

    if (event.key === "Enter" && filtered[0]) {
      event.preventDefault();
      handleSelect(filtered[0].text);
    }
  }
</script>

{#if headingPickerState.open}
  <button
    type="button"
    class="heading-picker__backdrop"
    aria-label={closeBackdropLabel}
    onclick={() => closeHeadingPicker()}
  ></button>
  <div class="heading-picker" role="dialog" aria-modal="true" aria-label={pickerTitle}>
    <div class="heading-picker__header">
      <h2>{pickerTitle}</h2>
      <input
        bind:this={input}
        class="heading-picker__input"
        type="search"
        bind:value={query}
        placeholder={filterPlaceholder}
        aria-label={filterPlaceholder}
        onkeydown={handleKeydown}
      />
    </div>

    {#if filtered.length}
      <ul class="heading-picker__list">
        {#each filtered as heading (heading.id)}
          <li>
            <button
              type="button"
              style={`padding-left: ${(heading.level - 1) * 0.75 + 0.55}rem`}
              onclick={() => handleSelect(heading.text)}
            >
              {heading.text}
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="heading-picker__empty">{emptyMessage}</p>
    {/if}
  </div>
{/if}

<style>
  .heading-picker__backdrop {
    position: fixed;
    inset: 0;
    border: 0;
    background: rgba(10, 10, 10, 0.18);
    z-index: 42;
  }

  .heading-picker {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(28rem, calc(100vw - 2rem));
    max-height: min(70vh, 28rem);
    overflow: auto;
    padding: 0.85rem;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    box-shadow: var(--shadow-block);
    z-index: 43;
  }

  .heading-picker__header h2 {
    margin: 0 0 0.55rem;
    font-size: 0.95rem;
  }

  .heading-picker__input {
    width: 100%;
    border: 1px solid var(--border-hairline);
    border-radius: var(--radius-sm);
    padding: 0.45rem 0.55rem;
    background: var(--bg-muted);
    color: var(--text-primary);
    font-size: 0.84rem;
  }

  .heading-picker__list {
    list-style: none;
    margin: 0.75rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
  }

  .heading-picker__list button {
    width: 100%;
    border: 0;
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.55rem;
    background: transparent;
    color: var(--text-primary);
    text-align: left;
    font-size: 0.82rem;
  }

  .heading-picker__list button:hover {
    background: var(--bg-hover);
  }

  .heading-picker__empty {
    margin: 0.75rem 0 0;
    color: var(--text-muted);
    font-size: 0.82rem;
  }
</style>
