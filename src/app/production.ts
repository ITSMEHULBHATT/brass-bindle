import type { Order } from "./types";

export interface ProductionBreakdown {
  customerName: string;
  datePlaced: string;
  priority: Order["priority"];
  remaining: number;
}

export interface ProductionRow {
  productName: string;
  totalRemaining: number;
  breakdown: ProductionBreakdown[];
}

export function computeProduction(activeOrders: Order[]): ProductionRow[] {
  const map = new Map<string, ProductionRow>();
  for (const o of activeOrders) {
    if (o.archived) continue;
    for (const it of o.items) {
      if (it.shipped) continue;
      if (it.quantityOrdered <= 0) continue;
      let row = map.get(it.productName);
      if (!row) {
        row = { productName: it.productName, totalRemaining: 0, breakdown: [] };
        map.set(it.productName, row);
      }
      row.totalRemaining += it.quantityOrdered;
      row.breakdown.push({
        customerName: o.customerName,
        datePlaced: o.datePlaced,
        priority: o.priority,
        remaining: it.quantityOrdered,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.totalRemaining - a.totalRemaining);
}

export function isOrderComplete(o: Order): boolean {
  return o.items.length > 0 && o.items.every((i) => i.shipped);
}
