import { EditorView } from "@codemirror/view";

export function createEditorTheme() {
  return EditorView.theme(
    {
      "&": {
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-primary)",
        fontSize: "0.92rem",
        borderRadius: "var(--radius-sm)",
      },
      ".cm-content": {
        fontFamily:
          '"JetBrains Mono", "SFMono-Regular", "Cascadia Code", Consolas, monospace, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", emoji',
        lineHeight: "1.6",
        padding: "0.65rem 0.2rem",
        caretColor: "var(--accent)",
      },
      ".cm-gutters": {
        display: "none",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "inherit",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--accent)",
      },
      "&.cm-focused": {
        outline: "none",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection":
        {
          backgroundColor: "var(--accent-soft) !important",
        },
      ".cm-activeLine": {
        backgroundColor: "transparent",
      },
    },
    { dark: false },
  );
}
