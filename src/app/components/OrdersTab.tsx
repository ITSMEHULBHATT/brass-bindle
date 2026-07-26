import { useMemo, useState } from "react";
import { Plus, Trash2, X, ChevronDown, ChevronUp, Pencil, Check, Search, ClipboardList } from "lucide-react";
import type { Order, OrderItem } from "../types";
import { ProductPicker } from "./ProductPicker";
import { daysSince, pendingLevel, pendingBadgeClass, pendingStripeClass } from "../pending";

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
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [customerQuery, setCustomerQuery] = useState("");

  const filtered = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.customerName.toLowerCase().includes(q));
  }, [orders, customerQuery]);

  return (
    <div className="space-y-2.5 px-4 py-4">
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cta text-cta-foreground text-[15px] font-semibold transition-transform active:scale-[0.98] hover:brightness-95"
          style={{ height: 52, boxShadow: "var(--shadow-cta)" }}
        >
          <Plus className="size-[18px]" strokeWidth={2.5} /> New Order
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

      {orders.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Search customer name…"
            className="w-full rounded-[10px] border border-border bg-card px-9 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(26,43,74,0.08)]"
            style={{ height: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
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
        <EmptyState
          icon={<ClipboardList className="size-12" strokeWidth={1.5} style={{ color: "#D1D5DB" }} />}
          title="No active orders"
          subtitle="Tap + New Order to get started."
        />
      )}

      {orders.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No customers match “{customerQuery}”.
        </div>
      )}

      {filtered.map((o) => {
        const totalOrd = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
        const totalFul = o.items.reduce((s, i) => s + i.quantityFulfilled, 0);
        const pct = totalOrd ? Math.round((totalFul / totalOrd) * 100) : 0;
        const isOpen = expanded[o.id] ?? false;
        const isEditing = editing[o.id] ?? false;
        const days = daysSince(o.datePlaced);
        const level = pendingLevel(days);

        return (
          <div
            key={o.id}
            className="relative overflow-hidden rounded-xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* Left accent stripe */}
            <span className={`absolute inset-y-0 left-0 w-1 ${pendingStripeClass(level)}`} />

            {isEditing ? (
              <InlineEditHeader
                order={o}
                onCancel={() => setEditing((e) => ({ ...e, [o.id]: false }))}
                onSave={(name, date) => {
                  onChange((curr) =>
                    curr.map((x) => (x.id === o.id ? { ...x, customerName: name, datePlaced: date } : x)),
                  );
                  setEditing((e) => ({ ...e, [o.id]: false }));
                }}
              />
            ) : (
              <div className="flex items-start gap-1 pl-4 pr-2 py-3">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [o.id]: !isOpen }))}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-[15px] font-semibold text-foreground">{o.customerName}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">· {o.datePlaced}</span>
                    {level && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${pendingBadgeClass(level)}`}
                      >
                        {days}d pending
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all ${pct === 100 ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
                      {totalFul}/{totalOrd} · {pct}%
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setEditing((e) => ({ ...e, [o.id]: true }))}
                  className="rounded p-2 text-muted-foreground hover:bg-accent"
                  title="Edit customer / date"
                >
                  <Pencil className="size-[18px]" />
                </button>
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [o.id]: !isOpen }))}
                  className="rounded p-2 text-muted-foreground hover:bg-accent"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronUp className="size-[18px]" /> : <ChevronDown className="size-[18px]" />}
                </button>
              </div>
            )}

            {isOpen && (
              <div className="border-t border-[#F3F4F6]">
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
                <div className="flex items-center justify-between gap-2 border-t border-[#F3F4F6] bg-secondary/40 px-4 py-2.5">
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

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {icon}
      <p className="text-[15px] font-semibold" style={{ color: "#374151" }}>
        {title}
      </p>
      <p className="text-[13px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function InlineEditHeader({
  order,
  onCancel,
  onSave,
}: {
  order: Order;
  onCancel: () => void;
  onSave: (name: string, date: string) => void;
}) {
  const [name, setName] = useState(order.customerName);
  const [date, setDate] = useState(order.datePlaced);
  const canSave = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  return (
    <div className="space-y-2 pl-4 pr-3 py-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer name"
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          onClick={onCancel}
          className="rounded-md border border-border px-2.5 py-2 text-xs font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave(name.trim(), date)}
          className="inline-flex items-center gap-1 rounded-md bg-cta px-2.5 py-2 text-xs font-semibold text-cta-foreground hover:brightness-95 disabled:opacity-50"
        >
          <Check className="size-3.5" /> Save
        </button>
      </div>
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
  const done = item.quantityFulfilled >= item.quantityOrdered && item.quantityOrdered > 0;
  return (
    <div
      className={`relative flex items-center gap-2 border-b border-[#F3F4F6] px-4 py-3 last:border-b-0 ${
        done ? "bg-[#F0FDF4]" : "bg-[#FAFAFA]"
      }`}
    >
      {done && <span className="absolute inset-y-0 left-0 w-[3px] bg-success" />}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-medium ${
            done ? "text-[#15803D] line-through" : "text-foreground"
          }`}
        >
          {item.productName}
        </p>
        <p className="text-[12px] text-muted-foreground">
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
        className="w-12 rounded-lg border border-input bg-card px-1.5 py-1.5 text-center text-sm font-semibold tabular-nums focus:border-primary focus:outline-none"
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
    if (!canSave) return;
    onSave({
      id: uid(),
      customerName: customer.trim(),
      datePlaced: date,
      items,
      archived: false,
    });
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">New order</h2>
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
            className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5 text-base text-foreground focus:border-primary focus:outline-none"
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
            <div key={`${it.productName}-${idx}`} className="flex items-center gap-2 border-b border-[#F3F4F6] px-3 py-2 last:border-b-0">
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
                className="w-16 rounded border border-input bg-card px-2 py-1.5 text-center text-sm tabular-nums focus:border-primary focus:outline-none"
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
          className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!canSave}
          className="flex-[2] rounded-xl bg-cta py-3 text-sm font-semibold text-cta-foreground hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: "var(--shadow-cta)" }}
        >
          Save order
        </button>
      </div>
    </div>
  );
}
