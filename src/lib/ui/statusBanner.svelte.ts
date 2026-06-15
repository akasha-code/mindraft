export type BannerTone = "error" | "info" | "neutral";

export type StatusBannerState = {
  message: string;
  tone: BannerTone;
  id: number;
};

const AUTO_DISMISS_MS = 5200;

export const statusBanner = $state({
  current: null as StatusBannerState | null,
});

let dismissTimer: number | undefined;
let nextId = 0;

function clearDismissTimer(): void {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = undefined;
  }
}

export function showStatusBanner(
  message: string,
  tone: BannerTone = "error",
  autoDismissMs = AUTO_DISMISS_MS,
): void {
  clearDismissTimer();
  nextId += 1;
  statusBanner.current = { message, tone, id: nextId };

  if (autoDismissMs > 0) {
    dismissTimer = window.setTimeout(() => {
      dismissStatusBanner();
    }, autoDismissMs);
  }
}

export function dismissStatusBanner(): void {
  clearDismissTimer();
  statusBanner.current = null;
}
