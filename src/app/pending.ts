// Days-pending badge helpers.

export function daysSince(isoDate: string): number {
  // isoDate is yyyy-mm-dd (local). Compute whole-day difference vs today.
  const [y, m, d] = isoDate.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return 0;
  const placed = new Date(y, m - 1, d).getTime();
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.floor((todayMid - placed) / 86400000);
  return Math.max(0, diff);
}

export type PendingLevel = null | "yellow" | "orange" | "red";

export function pendingLevel(days: number): PendingLevel {
  if (days >= 21) return "red";
  if (days >= 14) return "orange";
  if (days >= 7) return "yellow";
  return null;
}

export function pendingBadgeClass(level: PendingLevel): string {
  switch (level) {
    case "red":
      return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
    case "orange":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
    case "yellow":
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
    default:
      return "";
  }
}

export function PendingBadgeText(days: number): string {
  return `${days}d`;
}
