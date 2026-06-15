export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function getDocumentStats(raw: string): {
  words: number;
  characters: number;
  readingMinutes: number;
} {
  const words = countWords(raw);
  return {
    words,
    characters: raw.length,
    readingMinutes: estimateReadingMinutes(words),
  };
}
