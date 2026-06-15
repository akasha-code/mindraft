import { APP_STORAGE_KEYS } from "$lib/constants/storage";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { no } from "./locales/no";
import type { Locale, Messages } from "./types";

const catalogs: Record<Locale, Messages> = { en, es, no };

export const localeState = $state<{ locale: Locale }>({
  locale: "en",
});

export const LOCALE_OPTIONS = [
  { code: "en" as const, label: en.locale.en },
  { code: "es" as const, label: en.locale.es },
  { code: "no" as const, label: en.locale.no },
];

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(APP_STORAGE_KEYS.locale);
  if (stored === "en" || stored === "es" || stored === "no") {
    return stored;
  }

  return null;
}

function resolveMessage(locale: Locale, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = catalogs[locale];

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function initLocale(): void {
  localeState.locale = readStoredLocale() ?? "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = localeState.locale;
  }
}

export function setLocale(locale: Locale): void {
  localeState.locale = locale;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(APP_STORAGE_KEYS.locale, locale);
    document.documentElement.lang = locale;
  }
}

export function getLocale(): Locale {
  return localeState.locale;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const locale = localeState.locale;
  let message =
    resolveMessage(locale, key) ?? resolveMessage("en", key) ?? key;

  if (params) {
    message = message.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params[name] ?? `{${name}}`),
    );
  }

  return message;
}
