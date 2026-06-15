export const APP_NAME = "MinDraft";
export const APP_SLUG = "mindraft";
export const APP_REPO_URL = "https://github.com/akasha-code/mindraft";
export const APP_IDENTIFIER = "com.guidoquadrini.mindraft";

export function storageKey(suffix: string): string {
  return `${APP_SLUG}-${suffix}`;
}
