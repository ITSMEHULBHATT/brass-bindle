import { useState } from "react";
import { X, Package } from "lucide-react";
import type { Order, OrderItem } from "../types";

export function SplitShipModal({
  order,
  onCancel,
  onConfirm,
}: {
  order: Order;
  onCancel: () => void;
  onConfirm: (itemIds: string[]) => void;
}) {
  const unshipped = order.items.filter((i) => !i.shipped);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = unshipped.filter((i) => selected[i.id]).map((i) => i.id);
  const remainingCount = unshipped.length - selectedIds.length;

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Split & Ship</h2>
            <p className="text-xs text-muted-foreground">{order.customerName}</p>
          </div>
          <button onClick={onCancel} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          Select items being dispatched in this shipment.
        </p>

        <ul className="divide-y divide-border/60 rounded-md border border-border">
          {unshipped.map((it: OrderItem) => {
            const on = !!selected[it.id];
            return (
              <li
                key={it.id}
                onClick={() => toggle(it.id)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-3 ${on ? "bg-primary/5" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(it.id)}
                  className="size-5 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.productName}</p>
                </div>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  ×{it.quantityOrdered}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
          Shipping <span className="font-semibold">{selectedIds.length}</span> item
          {selectedIds.length === 1 ? "" : "s"} — {remainingCount} item
          {remainingCount === 1 ? "" : "s"} will remain active
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border py-3 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={() => onConfirm(selectedIds)}
            className="inline-flex flex-[2] items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Package className="size-4" /> Confirm Shipment
          </button>
        </div>
      </div>
    </div>
  );
}
