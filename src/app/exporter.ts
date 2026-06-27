import type { Order } from "./types";
import { computeProduction } from "./production";

function fmtDate(d: string): string {
  return d;
}

export function buildExportText(orders: Order[]): string {
  const active = orders.filter((o) => !o.archived);
  const archived = orders.filter((o) => o.archived);
  const production = computeProduction(active);

  const lines: string[] = [];
  lines.push("=== BRASS ORDERS — SUMMARY ===");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  lines.push(`--- ACTIVE ORDERS (${active.length}) ---`);
  if (active.length === 0) lines.push("(none)");
  for (const o of active) {
    const totalOrd = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
    const totalFul = o.items.reduce((s, i) => s + i.quantityFulfilled, 0);
    const pct = totalOrd ? Math.round((totalFul / totalOrd) * 100) : 0;
    lines.push("");
    lines.push(`• ${o.customerName}  (${fmtDate(o.datePlaced)})  — ${pct}% done`);
    for (const it of o.items) {
      const remain = it.quantityOrdered - it.quantityFulfilled;
      lines.push(
        `    - ${it.productName}: ${it.quantityFulfilled}/${it.quantityOrdered}` +
          (remain > 0 ? `  (${remain} remaining)` : `  ✓`),
      );
    }
  }

  lines.push("");
  lines.push(`--- PRODUCTION LIST (${production.length} products needed) ---`);
  if (production.length === 0) lines.push("(nothing pending)");
  for (const row of production) {
    lines.push(`${row.totalRemaining}  ×  ${row.productName}`);
  }

  lines.push("");
  lines.push(`--- ARCHIVED ORDERS (${archived.length}) ---`);
  if (archived.length === 0) lines.push("(none)");
  for (const o of archived) {
    const totalOrd = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
    lines.push("");
    lines.push(`• ${o.customerName}  (${fmtDate(o.datePlaced)})  — ${totalOrd} units`);
    for (const it of o.items) {
      lines.push(`    - ${it.productName}: ${it.quantityOrdered}`);
    }
  }

  return lines.join("\n");
}
