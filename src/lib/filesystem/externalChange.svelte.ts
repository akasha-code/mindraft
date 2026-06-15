export const externalChangeState = $state({
  pending: false,
  filename: "",
  hasLocalChanges: false,
});

export function markExternalFileChange(
  filename: string,
  hasLocalChanges: boolean,
): void {
  externalChangeState.pending = true;
  externalChangeState.filename = filename;
  externalChangeState.hasLocalChanges = hasLocalChanges;
}

export function dismissExternalFileChange(): void {
  externalChangeState.pending = false;
  externalChangeState.filename = "";
  externalChangeState.hasLocalChanges = false;
}
