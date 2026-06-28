import type { Order } from "./types";

export interface BackupFile {
  app: "superior-bath-fittings";
  version: 1;
  exportedAt: string;
  orders: Order[];
  customItems: string[];
}

export function buildBackup(orders: Order[], customItems: string[]): BackupFile {
  return {
    app: "superior-bath-fittings",
    version: 1,
    exportedAt: new Date().toISOString(),
    orders,
    customItems,
  };
}

export function downloadBackup(orders: Order[], customItems: string[]): void {
  const data = buildBackup(orders, customItems);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `sbf-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ParsedBackup {
  orders: Order[];
  customItems: string[];
}

export function parseBackup(text: string): ParsedBackup {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup file");
  const orders = Array.isArray(parsed.orders) ? (parsed.orders as Order[]) : null;
  if (!orders) throw new Error("Backup is missing orders array");
  // Light shape validation
  for (const o of orders) {
    if (!o || typeof o.id !== "string" || typeof o.customerName !== "string" || !Array.isArray(o.items)) {
      throw new Error("Backup contains an invalid order");
    }
  }
  const customItems: string[] = Array.isArray(parsed.customItems)
    ? (parsed.customItems as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  return { orders, customItems };
}
