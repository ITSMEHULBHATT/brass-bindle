import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  Search,
  Package,
  Copy,
  FileText,
} from "lucide-react";
import type { Order, OrderItem, Customer, Priority } from "../types";
import { ProductPicker } from "./ProductPicker";
import { SplitShipModal } from "./SplitShipModal";
import { daysSince, pendingLevel, pendingBadgeClass } from "../pending";

interface Props {
  orders: Order[];
  catalog: readonly string[];
  customers: Customer[];
  onChange: (updater: (orders: Order[]) => Order[]) => void;
  onRegisterItem?: (name: string) => void;
  onRegisterCustomer?: (name: string) => void;
  onCreateShipment: (orderId: string, itemIds: string[]) => void;
  onCloneOrder: (order: Order) => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

function priorityChipClass(p: Priority, active: boolean): string {
  if (p === "high") return active ? "bg-red-600 text-white" : "border border-red-500/40 text-red-600";
  if (p === "low") return active ? "bg-slate-500 text-white" : "border border-slate-400/40 text-slate-600";
  return active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground";
}

export function OrdersTab({
  orders,
  catalog,
  customers,
  onChange,
  onRegisterItem,
  onRegisterCustomer,
  onCreateShipment,
  onCloneOrder,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [customerQuery, setCustomerQuery] = useState("");
  const [splitFor, setSplitFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    const list = q ? orders.filter((o) => o.customerName.toLowerCase().includes(q)) : orders;
    return [...list].sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      return b.datePlaced.localeCompare(a.datePlaced);
    });
  }, [orders, customerQuery]);

  const splitOrder = splitFor ? orders.find((o) => o.id === splitFor) : null;

  return (
    <div className="space-y-3 p-3">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-base font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="size-5" /> New order
        </button>
      )}

      {creating && (
        <NewOrderForm
          catalog={catalog}
          customers={customers}
          onRegisterItem={onRegisterItem}
          onRegisterCustomer={onRegisterCustomer}
          onCancel={() => setCreating(false)}
          onSave={(o) => {
            onChange((curr) => [o, ...curr]);
            setCreating(false);
          }}
        />
      )}

      {orders.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Search customer name…"
            className="w-full rounded-md border border-input bg-background px-9 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          {customerQuery && (
            <button
              onClick={() => setCustomerQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {orders.length === 0 && !creating && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No active orders. Tap "New order" to start.
        </div>
      )}

      {orders.length > 0 && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No customers match "{customerQuery}".
        </div>
      )}

      {filtered.map((o) => {
        const totalItems = o.items.length;
        const shippedItems = o.items.filter((i) => i.shipped).length;
        const pct = totalItems ? Math.round((shippedItems / totalItems) * 100) : 0;
        const isOpen = expanded[o.id] ?? false;
        const isEditing = editing[o.id] ?? false;
        const days = daysSince(o.datePlaced);
        const level = pendingLevel(days);
        const unshipped = o.items.filter((i) => !i.shipped);

        return (
          <div key={o.id} className="overflow-hidden rounded-lg border border-border bg-card">
            {isEditing ? (
              <InlineEditHeader
                order={o}
                customers={customers}
                onRegisterCustomer={onRegisterCustomer}
                onCancel={() => setEditing((e) => ({ ...e, [o.id]: false }))}
                onSave={(name, date, notes, priority) => {
                  onChange((curr) =>
                    curr.map((x) =>
                      x.id === o.id
                        ? { ...x, customerName: name, datePlaced: date, notes, priority }
                        : x,
                    ),
                  );
                  setEditing((e) => ({ ...e, [o.id]: false }));
                }}
              />
            ) : (
              <div className="flex items-start gap-1 px-3 py-3">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [o.id]: !isOpen }))}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {o.priority !== "normal" && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          o.priority === "high"
                            ? "bg-red-500/15 text-red-600"
                            : "bg-slate-500/15 text-slate-600"
                        }`}
                      >
                        {o.priority}
                      </span>
                    )}
                    <h3 className="truncate text-base font-semibold">{o.customerName}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{o.datePlaced}</span>
                    {level && (
                      <span
                        className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${pendingBadgeClass(level)}`}
                      >
                        {days}d pending
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      {shippedItems}/{totalItems} items shipped ·{" "}
                      {o.items.filter((i) => i.shipped).reduce((s, i) => s + i.quantityOrdered, 0)}/
                      {o.items.reduce((s, i) => s + i.quantityOrdered, 0)} units shipped
                    </p>
                  </div>
                  {o.notes && (
                    <p className="mt-1.5 flex items-start gap-1 text-[11px] text-muted-foreground">
                      <FileText className="mt-0.5 size-3 shrink-0" />
                      <span className="line-clamp-2">{o.notes}</span>
                    </p>
                  )}
                </button>
                <button
                  onClick={() => setEditing((e) => ({ ...e, [o.id]: true }))}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                  title="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [o.id]: !isOpen }))}
                  className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>
            )}

            {isOpen && (
              <div className="border-t border-border">
                {o.items.map((it, idx) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    onRemove={() =>
                      onChange((curr) =>
                        curr.map((x) =>
                          x.id === o.id
                            ? { ...x, items: x.items.filter((_, i) => i !== idx) }
                            : x,
                        ),
                      )
                    }
                    onQtyChange={(q) =>
                      onChange((curr) =>
                        curr.map((x) =>
                          x.id === o.id
                            ? {
                                ...x,
                                items: x.items.map((y, i) =>
                                  i === idx ? { ...y, quantityOrdered: Math.max(1, q) } : y,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-3 py-2">
                  <AddItemInline
                    catalog={catalog}
                    existing={new Set(o.items.map((i) => i.productName))}
                    onAdd={(name) => {
                      onRegisterItem?.(name);
                      onChange((curr) =>
                        curr.map((x) =>
                          x.id === o.id
                            ? {
                                ...x,
                                items: [
                                  ...x.items,
                                  {
                                    id: uid(),
                                    productName: name,
                                    quantityOrdered: 1,
                                    shipped: false,
                                  },
                                ],
                              }
                            : x,
                        ),
                      );
                    }}
                  />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCloneOrder(o)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-accent"
                      title="Clone (unshipped items only)"
                    >
                      <Copy className="size-3.5" /> Clone
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete order from ${o.customerName}?`))
                          onChange((curr) => curr.filter((x) => x.id !== o.id));
                      }}
                      className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                      title="Delete order"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {unshipped.length > 0 && (
                  <div className="border-t border-border bg-card p-3">
                    {unshipped.length === 1 ? (
                      <button
                        onClick={() => onCreateShipment(o.id, [unshipped[0].id])}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <Package className="size-4" /> Ship & Complete
                      </button>
                    ) : (
                      <button
                        onClick={() => setSplitFor(o.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        <Package className="size-4" /> Split & Ship
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {splitOrder && (
        <SplitShipModal
          order={splitOrder}
          onCancel={() => setSplitFor(null)}
          onConfirm={(ids) => {
            onCreateShipment(splitOrder.id, ids);
            setSplitFor(null);
          }}
        />
      )}
    </div>
  );
}

function InlineEditHeader({
  order,
  customers,
  onRegisterCustomer,
  onCancel,
  onSave,
}: {
  order: Order;
  customers: Customer[];
  onRegisterCustomer?: (name: string) => void;
  onCancel: () => void;
  onSave: (name: string, date: string, notes: string | null, priority: Priority) => void;
}) {
  const [name, setName] = useState(order.customerName);
  const [date, setDate] = useState(order.datePlaced);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [priority, setPriority] = useState<Priority>(order.priority);
  const canSave = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <div className="space-y-2 px-3 py-3">
      <CustomerCombo value={name} onChange={setName} customers={customers} autoFocus />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <PrioritySelect value={priority} onChange={setPriority} />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-md border border-border px-2.5 py-2 text-xs font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => {
            const n = name.trim();
            onRegisterCustomer?.(n);
            onSave(n, date, notes.trim() || null, priority);
          }}
          className="flex-[2] inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Check className="size-3.5" /> Save
        </button>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onRemove,
  onQtyChange,
}: {
  item: OrderItem;
  onRemove: () => void;
  onQtyChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${item.shipped ? "text-muted-foreground line-through" : ""}`}
        >
          {item.productName}
          {item.shipped && (
            <span className="ml-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Shipped ✓
            </span>
          )}
        </p>
      </div>
      {!item.shipped && (
        <>
          <label className="flex flex-col items-center text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Qty</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={item.quantityOrdered}
              onChange={(e) => onQtyChange(parseInt(e.target.value || "0", 10))}
              className="w-16 rounded border border-input bg-background px-1.5 py-1.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
            />
          </label>
          <button
            onClick={onRemove}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Remove item"
          >
            <X className="size-4" />
          </button>
        </>
      )}
      {item.shipped && (
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
          ×{item.quantityOrdered}
        </span>
      )}
    </div>
  );
}

function AddItemInline({
  catalog,
  existing,
  onAdd,
}: {
  catalog: readonly string[];
  existing: Set<string>;
  onAdd: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      >
        <Plus className="size-3.5" /> Add item
      </button>
    );
  }
  return (
    <div className="flex-1">
      <ProductPicker
        catalog={catalog}
        excludeNames={existing}
        autoFocus
        onPick={(name) => {
          onAdd(name);
          setOpen(false);
        }}
      />
      <button
        onClick={() => setOpen(false)}
        className="mt-2 text-xs text-muted-foreground underline"
      >
        Done adding
      </button>
    </div>
  );
}

function PrioritySelect({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div className="flex gap-1">
      {(["high", "normal", "low"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${priorityChipClass(p, value === p)}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function CustomerCombo({
  value,
  onChange,
  customers,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  customers: Customer[];
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
    : customers.slice(0, 6);

  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Customer name"
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(c.name);
                setOpen(false);
              }}
              className="block w-full border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewOrderForm({
  catalog,
  customers,
  onCancel,
  onSave,
  onRegisterItem,
  onRegisterCustomer,
}: {
  catalog: readonly string[];
  customers: Customer[];
  onCancel: () => void;
  onSave: (o: Order) => void;
  onRegisterItem?: (name: string) => void;
  onRegisterCustomer?: (name: string) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [items, setItems] = useState<OrderItem[]>([]);

  const existing = new Set(items.map((i) => i.productName));
  const canSave =
    customer.trim().length > 0 && items.length > 0 && items.every((i) => i.quantityOrdered > 0);

  function save() {
    if (!canSave) return;
    const name = customer.trim();
    onRegisterCustomer?.(name);
    onSave({
      id: uid(),
      customerName: name,
      datePlaced: date,
      notes: notes.trim() || null,
      priority,
      archived: false,
      dateArchived: null,
      shipmentIds: [],
      items,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">New order</h2>
        <button onClick={onCancel} className="rounded p-1 text-muted-foreground hover:bg-accent">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground">
          Customer
          <div className="mt-1">
            <CustomerCombo value={customer} onChange={setCustomer} customers={customers} />
          </div>
        </label>
        <div className="flex items-end gap-2">
          <label className="flex-1 text-xs font-medium text-muted-foreground">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
            />
          </label>
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>
        <label className="block text-xs font-medium text-muted-foreground">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Add items</p>
        <ProductPicker
          catalog={catalog}
          excludeNames={existing}
          onPick={(name) => {
            onRegisterItem?.(name);
            setItems((curr) => [
              ...curr,
              { id: uid(), productName: name, quantityOrdered: 1, shipped: false },
            ]);
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-1 rounded-md border border-border">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="flex items-center gap-2 border-b border-border/60 px-3 py-2 last:border-b-0"
            >
              <p className="min-w-0 flex-1 truncate text-sm">{it.productName}</p>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={it.quantityOrdered}
                onChange={(e) =>
                  setItems((curr) =>
                    curr.map((x, i) =>
                      i === idx
                        ? {
                            ...x,
                            quantityOrdered: Math.max(0, parseInt(e.target.value || "0", 10)),
                          }
                        : x,
                    ),
                  )
                }
                className="w-16 rounded border border-input bg-background px-2 py-1.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => setItems((curr) => curr.filter((_, i) => i !== idx))}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-md border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!canSave}
          className="flex-[2] rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save order
        </button>
      </div>
    </div>
  );
}
