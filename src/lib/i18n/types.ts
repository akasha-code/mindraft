import type { en } from "./locales/en";

export type Locale = "en" | "es" | "no";

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type Messages = DeepStringRecord<typeof en>;

export type LocaleOption = {
  code: Locale;
  label: string;
};
