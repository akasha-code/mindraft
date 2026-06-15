import { isTauri as checkIsTauri } from "@tauri-apps/api/core";

type TauriWindow = Window & {
  isTauri?: boolean;
  __TAURI__?: unknown;
};

export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (checkIsTauri()) {
    return true;
  }

  const tauriWindow = window as TauriWindow;
  return Boolean(tauriWindow.isTauri || tauriWindow.__TAURI__);
}

export function getRuntimeLabel(): "desktop" | "browser" {
  return isTauriRuntime() ? "desktop" : "browser";
}
