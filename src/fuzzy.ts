/**
 * Subsequence fuzzy match. Returns a score (higher = better) or null if
 * `query`'s characters don't all appear in order in `text`. Consecutive
 * and early matches score higher, matching typical switcher UX.
 */
export function fuzzyScore(query: string, text: string): number | null {
  if (query === "") return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  let score = 0;
  let textIndex = 0;
  let consecutive = 0;

  for (const ch of q) {
    const found = t.indexOf(ch, textIndex);
    if (found === -1) return null;
    consecutive = found === textIndex ? consecutive + 1 : 0;
    score += 10 - Math.min(found - textIndex, 9) + consecutive * 2;
    textIndex = found + 1;
  }
  return score;
}

export function fuzzyMatch(query: string, ...fields: string[]): number | null {
  let best: number | null = null;
  for (const field of fields) {
    const score = fuzzyScore(query, field);
    if (score !== null && (best === null || score > best)) best = score;
  }
  return best;
}
