import { useState } from "react";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Order, OrderItem } from "../types";
import { ProductPicker } from "./ProductPicker";

interface Props {
  orders: Order[];
  catalog: readonly string[];
  onChange: (updater: (orders: Order[]) => Order[]) => void;
  onRegisterItem?: (name: string) => void;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OrdersTab({ orders, catalog, onChange, onRegisterItem }: Props) {

  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
          onRegisterItem={onRegisterItem}
          onCancel={() => setCreating(false)}
          onSave={(o) => {
            onChange((curr) => [o, ...curr]);
            setCreating(false);
          }}
        />
      )}


      {orders.length === 0 && !creating && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No active orders. Tap “New order” to start.
        </div>
      )}

      {orders.map((o) => {
        const totalOrd = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
        const totalFul = o.items.reduce((s, i) => s + i.quantityFulfilled, 0);
        const pct = totalOrd ? Math.round((totalFul / totalOrd) * 100) : 0;
        const isOpen = expanded[o.id] ?? false;
        return (
          <div key={o.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <button
              onClick={() => setExpanded((e) => ({ ...e, [o.id]: !isOpen }))}
              className="flex w-full items-start justify-between gap-2 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold">{o.customerName}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">{o.datePlaced}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {totalFul}/{totalOrd} · {pct}%
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {o.items.map((it, idx) => (
                  <ItemRow
                    key={`${it.productName}-${idx}`}
                    item={it}
                    onChange={(next) =>
                      onChange((curr) =>
                        curr.map((x) =>
                          x.id === o.id
                            ? { ...x, items: x.items.map((y, i) => (i === idx ? next : y)) }
                            : x,
                        ),
                      )
                    }
                    onRemove={() =>
                      onChange((curr) =>
                        curr.map((x) =>
                          x.id === o.id
                            ? { ...x, items: x.items.filter((_, i) => i !== idx) }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
                <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-3 py-2">
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
                                  { productName: name, quantityOrdered: 0, quantityFulfilled: 0 },
                                ],
                              }
                            : x,
                        ),
                      );
                    }}
                  />

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
            )}
          </div>
        );
      })}
    </div>
  );
}

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: OrderItem;
  onChange: (next: OrderItem) => void;
  onRemove: () => void;
}) {
  const done = item.quantityFulfilled >= item.quantityOrdered;
  return (
    <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>
          {item.productName}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Ordered {item.quantityOrdered} · Remaining {Math.max(0, item.quantityOrdered - item.quantityFulfilled)}
        </p>
      </div>
      <NumInput
        value={item.quantityFulfilled}
        max={item.quantityOrdered}
        onChange={(v) => onChange({ ...item, quantityFulfilled: Math.max(0, Math.min(v, item.quantityOrdered)) })}
        label="Done"
      />
      <NumInput
        value={item.quantityOrdered}
        onChange={(v) => onChange({ ...item, quantityOrdered: Math.max(1, v) })}
        label="Qty"
      />
      <button
        onClick={onRemove}
        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Remove item"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  max,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label: string;
}) {
  return (
    <label className="flex flex-col items-center text-[10px] uppercase tracking-wide text-muted-foreground">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className="w-14 rounded border border-input bg-background px-1.5 py-1.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
      />
    </label>
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

function NewOrderForm({
  catalog,
  onCancel,
  onSave,
  onRegisterItem,
}: {
  catalog: readonly string[];
  onCancel: () => void;
  onSave: (o: Order) => void;
  onRegisterItem?: (name: string) => void;
}) {

  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<OrderItem[]>([]);

  const existing = new Set(items.map((i) => i.productName));
  const canSave = customer.trim().length > 0 && items.length > 0 && items.every((i) => i.quantityOrdered > 0);

  function save() {
    if (!customer.trim()) {
      alert("Enter a customer name.");
      return;
    }
    if (items.length === 0) {
      alert("Add at least one item.");
      return;
    }
    onSave({
      id: uid(),
      customerName: customer.trim(),
      datePlaced: date,
      items,
      archived: false,
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

      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 text-xs font-medium text-muted-foreground">
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="e.g. Rajesh Plumbing"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
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
              { productName: name, quantityOrdered: 0, quantityFulfilled: 0 },
            ]);
          }}
        />

      </div>

      {items.length > 0 && (
        <div className="space-y-1 rounded-md border border-border">
          {items.map((it, idx) => (
            <div key={`${it.productName}-${idx}`} className="flex items-center gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
              <p className="min-w-0 flex-1 truncate text-sm">{it.productName}</p>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={it.quantityOrdered}
                onChange={(e) =>
                  setItems((curr) =>
                    curr.map((x, i) =>
                      i === idx ? { ...x, quantityOrdered: Math.max(0, parseInt(e.target.value || "0", 10)) } : x,
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
