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

export function pendingBadgeClass(level: PendingLevel): string {
  switch (level) {
    case "red":
      return "bg-warn-red-bg text-warn-red";
    case "orange":
      return "bg-warn-orange-bg text-warn-orange";
    case "yellow":
      return "bg-warn-yellow-bg text-warn-yellow";
    default:
      return "";
  }
}

// Left-edge accent stripe color for an order card based on pending level.
export function pendingStripeClass(level: PendingLevel): string {
  switch (level) {
    case "red":
      return "bg-warn-red";
    case "orange":
      return "bg-warn-orange";
    case "yellow":
      return "bg-warn-yellow";
    default:
      return "bg-border";
  }
}

export function PendingBadgeText(days: number): string {
  return `${days}d`;
}
