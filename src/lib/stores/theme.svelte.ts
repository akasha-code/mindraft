export type ThemePreference = "light" | "dark" | "system";

import { appStorageKey, writeStorage } from "$lib/constants/storage";

const STORAGE_KEY = appStorageKey("theme");

function readStoredTheme(): ThemePreference {
  if (typeof localStorage === "undefined") {
    return "system";
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const themeState = $state({
  preference: readStoredTheme() as ThemePreference,
  resolved: resolveTheme(readStoredTheme()) as "light" | "dark",
});

export function setThemePreference(preference: ThemePreference): void {
  themeState.preference = preference;
  themeState.resolved = resolveTheme(preference);
  writeStorage(STORAGE_KEY, preference);
  applyTheme(themeState.resolved);
}

export function applyTheme(resolved: "light" | "dark"): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = resolved;
}

export function initTheme(): void {
  themeState.resolved = resolveTheme(themeState.preference);
  applyTheme(themeState.resolved);

  if (typeof window === "undefined") {
    return;
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (themeState.preference === "system") {
        themeState.resolved = resolveTheme("system");
        applyTheme(themeState.resolved);
      }
    });
}
