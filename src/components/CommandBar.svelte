<script lang="ts">
  import {
    commandState,
    executeCommandBuffer,
    exitCommandMode,
  } from "$lib/editing/commandState.svelte";
  import { localeState, t } from "$lib/i18n";

  interface Props {
    onError?: (message: string) => void;
  }

  let { onError }: Props = $props();
  let input = $state<HTMLInputElement | null>(null);

  const commandAria = $derived.by(() => {
    void localeState.locale;
    return t("commandBar.aria");
  });
  const commandPlaceholder = $derived.by(() => {
    void localeState.locale;
    return t("commandBar.placeholder");
  });

  $effect(() => {
    if (commandState.active) {
      input?.focus();
    }
  });

  async function submitCommand() {
    const error = await executeCommandBuffer();
    if (error) {
      onError?.(error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitCommand();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      exitCommandMode();
    }
  }

  function handleInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    commandState.buffer = target.value;
  }
</script>

{#if commandState.active}
  <div class="command-bar">
    <span class="command-bar__prompt">:</span>
    <input
      bind:this={input}
      class="command-bar__input"
      type="text"
      value={commandState.buffer}
      aria-label={commandAria}
      placeholder={commandPlaceholder}
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
  </div>
{/if}

<style>
  .command-bar {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.9rem;
    border-top: 1px solid var(--border-hairline);
    background: var(--bg-surface);
  }

  .command-bar__prompt {
    color: var(--accent);
    font-family:
      "JetBrains Mono",
      "SFMono-Regular",
      Consolas,
      monospace;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .command-bar__input {
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-family:
      "JetBrains Mono",
      "SFMono-Regular",
      Consolas,
      monospace;
    font-size: 0.88rem;
    outline: none;
  }
</style>
