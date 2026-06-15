export function replaceBlockInRaw(
  raw: string,
  startOffset: number,
  endOffset: number,
  newBlockRaw: string,
): string {
  return raw.slice(0, startOffset) + newBlockRaw + raw.slice(endOffset);
}
