export function plainText(html: string): string {
  return (new DOMParser().parseFromString(html ?? '', 'text/html').documentElement.textContent ?? '').trim();
}

const WORDS_PER_MINUTE = 230;

export function readingMinutes(html: string): number {
  const words = plainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
