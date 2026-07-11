import type { Order, OrderItem, Shipment, Customer } from "./types";

const ORDERS_KEY = "brass-orders-v1";
const CUSTOM_ITEMS_KEY = "brass-custom-items-v1";
const SHIPMENTS_KEY = "shipments-data";
const CUSTOMERS_KEY = "customers-data";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Migrate a single raw order (possibly legacy) into the new shape.
export function migrateOrder(raw: unknown): Order {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(r.items) ? (r.items as Record<string, unknown>[]) : [];
  const items: OrderItem[] = rawItems.map((it) => {
    const productName = String(it.productName ?? "");
    const quantityOrdered = Number(it.quantityOrdered ?? 0);
    const id = typeof it.id === "string" ? it.id : uid();
    if ("quantityFulfilled" in it) {
      const qf = Number(it.quantityFulfilled ?? 0);
      return { id, productName, quantityOrdered, shipped: qf >= quantityOrdered && quantityOrdered > 0 };
    }
    return { id, productName, quantityOrdered, shipped: Boolean(it.shipped) };
  });
  return {
    id: String(r.id ?? uid()),
    customerName: String(r.customerName ?? ""),
    datePlaced: String(r.datePlaced ?? ""),
    notes: typeof r.notes === "string" ? r.notes : null,
    priority: (r.priority === "high" || r.priority === "low" ? r.priority : "normal") as Order["priority"],
    archived: Boolean(r.archived),
    dateArchived:
      typeof r.dateArchived === "string"
        ? r.dateArchived
        : typeof r.archivedAt === "string"
          ? (r.archivedAt as string)
          : null,
    shipmentIds: Array.isArray(r.shipmentIds) ? (r.shipmentIds as string[]) : [],
    items,
  };
}

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateOrder);
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    /* ignore */
  }
}

export function loadShipments(): Shipment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHIPMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Shipment[]) : [];
  } catch {
    return [];
  }
}

export function saveShipments(shipments: Shipment[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
  } catch {
    /* ignore */
  }
}

export function loadCustomers(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Customer[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch {
    /* ignore */
  }
}

export function loadCustomItems(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => typeof s === "string");
  } catch {
    return [];
  }
}

export function saveCustomItems(items: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}
