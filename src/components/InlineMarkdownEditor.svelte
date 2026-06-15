<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown } from "@codemirror/lang-markdown";
  import { EditorState, type Extension } from "@codemirror/state";
  import { EditorView, keymap } from "@codemirror/view";
  import { createEditorTheme } from "$lib/editing/editorTheme";
  import { setDraftContent } from "$lib/editing/editState.svelte";

  interface Props {
    value: string;
    onConfirm: (value: string) => void;
    onNavigateNext?: () => void;
    onNavigatePrevious?: () => void;
  }

  let {
    value,
    onConfirm,
    onNavigateNext,
    onNavigatePrevious,
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let view: EditorView | null = null;

  onMount(() => {
    if (!container) {
      return;
    }

    setDraftContent(value);

    const extensions: Extension[] = [
      history(),
      markdown(),
      createEditorTheme(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          setDraftContent(update.state.doc.toString());
        }
      }),
      keymap.of([
        {
          key: "Escape",
          run: () => {
            onConfirm(view?.state.doc.toString() ?? value);
            return true;
          },
        },
        {
          key: "j",
          run: () => {
            onNavigateNext?.();
            return true;
          },
        },
        {
          key: "k",
          run: () => {
            onNavigatePrevious?.();
            return true;
          },
        },
        ...defaultKeymap,
        ...historyKeymap,
      ]),
    ];

    view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions,
      }),
      parent: container,
    });

    view.focus();
  });

  onDestroy(() => {
    view?.destroy();
    view = null;
  });
</script>

<div class="inline-editor" bind:this={container}></div>

<style>
  .inline-editor {
    border: 1px solid var(--accent-soft-border);
    border-radius: var(--radius-sm);
    background: var(--bg-surface);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03);
    min-height: 2.5rem;
  }

  .inline-editor :global(.cm-editor) {
    min-height: 2.5rem;
  }

  .inline-editor :global(.cm-editor.cm-focused) {
    box-shadow: 0 0 0 3px var(--accent-ring);
    border-radius: var(--radius-sm);
  }
</style>
