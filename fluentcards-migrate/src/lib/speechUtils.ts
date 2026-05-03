export function extractReadingForSpeech(text: string): string {
  if (!text) return '';
  // match Kanji[furigana] and output furigana
  // e.g., "私[わたし]は" -> "わたしは"
  return text.replace(/([一-龯々]+)\[(.*?)\]/g, '$2');
}
