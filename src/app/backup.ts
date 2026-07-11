import type { Order, Shipment } from "./types";
import { migrateOrder } from "./storage";

export interface BackupFile {
  type?: "order-manager-backup";
  app?: "superior-bath-fittings";
  version: 1 | 2;
  exportedAt: string;
  orders: Order[];
  shipments?: Shipment[];
  customItems: string[];
}

export function buildBackup(
  orders: Order[],
  shipments: Shipment[],
  customItems: string[],
): BackupFile {
  return {
    type: "order-manager-backup",
    app: "superior-bath-fittings",
    version: 2,
    exportedAt: new Date().toISOString(),
    orders,
    shipments,
    customItems,
  };
}

export function downloadBackup(
  orders: Order[],
  shipments: Shipment[],
  customItems: string[],
): void {
  const data = buildBackup(orders, shipments, customItems);
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
  shipments: Shipment[];
  customItems: string[];
}

export function parseBackup(text: string): ParsedBackup {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup file");
  const rawOrders = Array.isArray(parsed.orders) ? parsed.orders : null;
  if (!rawOrders) throw new Error("Backup is missing orders array");
  const orders = rawOrders.map(migrateOrder);
  const shipments: Shipment[] = Array.isArray(parsed.shipments)
    ? (parsed.shipments as Shipment[])
    : [];
  const customItems: string[] = Array.isArray(parsed.customItems)
    ? (parsed.customItems as unknown[]).filter((s): s is string => typeof s === "string")
    : [];
  return { orders, shipments, customItems };
}
