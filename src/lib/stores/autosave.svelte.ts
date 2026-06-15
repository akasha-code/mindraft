import { appStorageKey, writeStorage } from "$lib/constants/storage";

const STORAGE_KEY = appStorageKey("autosave");

function readStoredAutosave(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  return localStorage.getItem(STORAGE_KEY) === "true";
}

export const autosaveState = $state({
  enabled: readStoredAutosave(),
});

export function setAutosaveEnabled(enabled: boolean): void {
  autosaveState.enabled = enabled;
  writeStorage(STORAGE_KEY, String(enabled));
}

export function toggleAutosave(): void {
  setAutosaveEnabled(!autosaveState.enabled);
}
