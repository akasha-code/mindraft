import { appStorageKey, readStorageWithMigration, writeStorage } from "$lib/constants/storage";

const STORAGE_KEY = appStorageKey("recent-files");
const LEGACY_STORAGE_KEY = "powermd-recent-files";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const HOME_PREVIEW_LIMIT = 10;

export type RecentFile = {
  path: string;
  filename: string;
  openedAt: number;
};

function isWithinLastYear(openedAt: number): boolean {
  return Date.now() - openedAt <= ONE_YEAR_MS;
}

function pruneRecentFiles(items: RecentFile[]): RecentFile[] {
  return items
    .filter((item) => isWithinLastYear(item.openedAt))
    .sort((a, b) => b.openedAt - a.openedAt);
}

function readRecentFiles(): RecentFile[] {
  const parsed = readStorageWithMigration<RecentFile[]>(
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    (raw) => {
      const items = JSON.parse(raw) as RecentFile[];
      if (!Array.isArray(items)) {
        return null;
      }

      return pruneRecentFiles(
        items.filter(
          (item) =>
            typeof item.path === "string" &&
            typeof item.filename === "string" &&
            typeof item.openedAt === "number",
        ),
      );
    },
  );

  return parsed ?? [];
}

function writeRecentFiles(items: RecentFile[]): void {
  writeStorage(STORAGE_KEY, JSON.stringify(items));
}

export const recentFilesState = $state({
  items: readRecentFiles(),
});

export function getRecentFilesPreview(limit = HOME_PREVIEW_LIMIT): RecentFile[] {
  return recentFilesState.items.slice(0, limit);
}

export function getRecentFilesThisYear(): RecentFile[] {
  return recentFilesState.items;
}

export function rememberRecentFile(path: string, filename: string): void {
  const next = pruneRecentFiles([
    { path, filename, openedAt: Date.now() },
    ...recentFilesState.items.filter((item) => item.path !== path),
  ]);

  recentFilesState.items = next;
  writeRecentFiles(next);
}

export function clearRecentFiles(): void {
  recentFilesState.items = [];
  writeRecentFiles([]);
}
