// Multi-word substring matcher: every whitespace-separated token in the query
// must appear (case-insensitive) somewhere in the candidate string.
export function matchesAllTokens(candidate: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = candidate.toLowerCase();
  for (const token of q.split(/\s+/)) {
    if (!hay.includes(token)) return false;
  }
  return true;
}

export function filterByTokens(items: readonly string[], query: string): string[] {
  if (!query.trim()) return [...items];
  return items.filter((i) => matchesAllTokens(i, query));
}
