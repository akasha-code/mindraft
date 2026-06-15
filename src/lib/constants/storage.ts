import { APP_NAME, storageKey } from "$lib/constants/brand";

export { APP_NAME, APP_SLUG, APP_IDENTIFIER } from "$lib/constants/brand";

export function readStorageWithMigration<T>(
  key: string,
  legacyKey: string,
  parse: (raw: string) => T | null,
): T | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const current = localStorage.getItem(key);
  if (current) {
    return parse(current);
  }

  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) {
    return null;
  }

  localStorage.setItem(key, legacy);
  localStorage.removeItem(legacyKey);
  return parse(legacy);
}

export function writeStorage(key: string, value: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, value);
}

export function appStorageKey(suffix: string): string {
  return storageKey(suffix);
}

export const APP_STORAGE_KEYS = {
  locale: appStorageKey("locale"),
} as const;
