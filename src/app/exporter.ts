import type { Order, Shipment } from "./types";
import { computeProduction } from "./production";

function priorityLabel(p: Order["priority"]): string {
  return p === "high" ? "High" : p === "low" ? "Low" : "Normal";
}

export function buildExportText(orders: Order[], shipments: Shipment[]): string {
  const active = orders.filter((o) => !o.archived);
  const archived = orders.filter((o) => o.archived);
  const production = computeProduction(active);
  const shipmentsByOrder = new Map<string, Shipment[]>();
  for (const s of shipments) {
    const list = shipmentsByOrder.get(s.orderId) ?? [];
    list.push(s);
    shipmentsByOrder.set(s.orderId, list);
  }

  const lines: string[] = [];
  lines.push("=== SUPERIOR BATH FITTINGS — SUMMARY ===");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  lines.push(`--- ACTIVE ORDERS (${active.length}) ---`);
  if (active.length === 0) lines.push("(none)");
  for (const o of active) {
    lines.push("");
    lines.push(
      `Customer: ${o.customerName} | Placed: ${o.datePlaced} | Priority: ${priorityLabel(o.priority)}`,
    );
    if (o.notes) lines.push(`  Notes: ${o.notes}`);
    const orderShipments = (shipmentsByOrder.get(o.id) ?? []).sort(
      (a, b) => a.shipmentNumber - b.shipmentNumber,
    );
    for (const s of orderShipments) {
      const itemsTxt = s.items.map((i) => `${i.productName} x${i.quantityOrdered}`).join(", ");
      lines.push(`  Shipment ${s.shipmentNumber} — ${s.shippedAt.slice(0, 10)}: ${itemsTxt}`);
    }
    const remaining = o.items.filter((i) => !i.shipped);
    if (remaining.length > 0) {
      const rTxt = remaining.map((i) => `${i.productName} x${i.quantityOrdered}`).join(", ");
      lines.push(`  Remaining: ${rTxt} (active)`);
    }
  }

  lines.push("");
  lines.push(`--- PRODUCTION LIST (${production.length} products needed) ---`);
  if (production.length === 0) lines.push("(nothing pending)");
  for (const row of production) {
    lines.push(`${row.totalRemaining}  ×  ${row.productName}`);
  }

  lines.push("");
  lines.push(`--- COMPLETED ORDERS (${archived.length}) ---`);
  if (archived.length === 0) lines.push("(none)");
  for (const o of archived) {
    const totalOrd = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
    lines.push("");
    lines.push(
      `Customer: ${o.customerName} | Placed: ${o.datePlaced} | Completed: ${o.dateArchived?.slice(0, 10) ?? "?"} | ${totalOrd} units`,
    );
    const orderShipments = (shipmentsByOrder.get(o.id) ?? []).sort(
      (a, b) => a.shipmentNumber - b.shipmentNumber,
    );
    for (const s of orderShipments) {
      const itemsTxt = s.items.map((i) => `${i.productName} x${i.quantityOrdered}`).join(", ");
      lines.push(`  Shipment ${s.shipmentNumber} — ${s.shippedAt.slice(0, 10)}: ${itemsTxt}`);
    }
  }

  return lines.join("\n");
}
