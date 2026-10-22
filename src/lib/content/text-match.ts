export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Optimal string alignment distance: edits plus adjacent transpositions. */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** The query word itself plus its singular form, so "eggs" also matches "egg". */
export function variants(queryWord: string): string[] {
  if (queryWord.length > 3 && queryWord.endsWith("ies")) return [queryWord, `${queryWord.slice(0, -3)}y`];
  if (queryWord.length > 3 && queryWord.endsWith("es")) return [queryWord, queryWord.slice(0, -2), queryWord.slice(0, -1)];
  if (queryWord.length > 3 && queryWord.endsWith("s")) return [queryWord, queryWord.slice(0, -1)];
  return [queryWord];
}

export function exactMatch(forms: string[], word: string): boolean {
  return forms.some((form) => word.includes(form));
}

export function fuzzyMatch(queryWord: string, word: string): boolean {
  const tolerance = queryWord.length >= 7 ? 2 : queryWord.length >= 4 ? 1 : 0;
  return (
    tolerance > 0 &&
    Math.abs(word.length - queryWord.length) <= tolerance &&
    editDistance(queryWord, word) <= tolerance
  );
}

/**
 * Words matching one query word, mapped to match quality: 0 starts with a query form, 1 typo
 * match, 2 contains a form mid-word ("aple" inside "maple"). Typo matching only runs when no word
 * starts with the query, so correctly spelled words don't pick up fuzzy noise.
 */
export function matchQualities(
  queryWord: string,
  forms: string[],
  vocabulary: string[],
): Map<string, number> {
  const qualities = new Map<string, number>();
  for (const word of vocabulary) {
    if (forms.some((form) => word.startsWith(form))) qualities.set(word, 0);
    else if (exactMatch(forms, word)) qualities.set(word, 2);
  }
  if ([...qualities.values()].includes(0)) return qualities;
  for (const word of vocabulary) {
    if (!qualities.has(word) && fuzzyMatch(queryWord, word)) qualities.set(word, 1);
  }
  return qualities;
}

/** Sum over query words of the best quality among `words`, or undefined if any query word is unmatched. */
export function entryQuality(words: string[], allowed: Map<string, number>[]): number | undefined {
  let total = 0;
  for (const qualities of allowed) {
    let best: number | undefined;
    for (const word of words) {
      const quality = qualities.get(word);
      if (quality !== undefined && (best === undefined || quality < best)) best = quality;
    }
    if (best === undefined) return undefined;
    total += best;
  }
  return total;
}
