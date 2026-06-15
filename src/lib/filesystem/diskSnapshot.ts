import { fileState, type WorkspaceTab } from "$lib/filesystem/fileState.svelte";
import {
  getSnapshotKey,
  readTabModifiedMs,
} from "$lib/filesystem/fileRead";

type DiskSnapshot = {
  key: string;
  modifiedMs: number;
};

const snapshots = new Map<string, DiskSnapshot>();

export async function syncDiskSnapshotForTab(tab: WorkspaceTab): Promise<void> {
  const key = getSnapshotKey(tab);
  if (!key) {
    return;
  }

  const modifiedMs = await readTabModifiedMs(tab);
  if (modifiedMs === null) {
    return;
  }

  snapshots.set(key, { key, modifiedMs });
}

export async function syncDiskSnapshotForActiveTab(): Promise<void> {
  const tab = fileState.tabs.find((item) => item.id === fileState.activeTabId);
  if (!tab) {
    return;
  }

  await syncDiskSnapshotForTab(tab);
}

export function getDiskSnapshot(key: string): DiskSnapshot | undefined {
  return snapshots.get(key);
}

export function setDiskSnapshot(key: string, modifiedMs: number): void {
  snapshots.set(key, { key, modifiedMs });
}

export function clearDiskSnapshots(): void {
  snapshots.clear();
}
