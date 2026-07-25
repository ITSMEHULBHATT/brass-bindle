// Days-pending badge helpers.

export function daysSince(isoDate: string): number {
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

// Tinted-background pill badges.
export function pendingBadgeClass(level: PendingLevel): string {
  switch (level) {
    case "red":
      return "bg-[#FEE2E2] text-[#DC2626]";
    case "orange":
      return "bg-[#FFEDD5] text-[#EA580C]";
    case "yellow":
      return "bg-[#FEF3C7] text-[#D97706]";
    default:
      return "";
  }
}

export function PendingBadgeText(days: number): string {
  return `${days}d`;
}
