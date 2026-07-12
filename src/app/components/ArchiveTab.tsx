import { useMemo } from "react";
import { Undo2, Trash2 } from "lucide-react";
import type { Order } from "../types";

export function ArchiveTab({
  orders,
  onRestore,
  onDelete,
}: {
  orders: Order[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = useMemo(() => {
    const keyOf = (o: Order) => o.archivedAt ?? o.datePlaced ?? "";
    return [...orders].sort((a, b) => keyOf(b).localeCompare(keyOf(a)));
  }, [orders]);

  if (sorted.length === 0) {
    return (
      <div className="p-3">
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No archived orders yet. Completed orders move here automatically.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {sorted.map((o) => {

        const total = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
        return (
          <div key={o.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between gap-2 px-3 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{o.customerName}</h3>
                <p className="text-xs text-muted-foreground">
                  {o.datePlaced} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {total} units
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => onRestore(o.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <Undo2 className="size-3.5" /> Restore
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Permanently delete order from ${o.customerName}?`)) onDelete(o.id);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete permanently"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <ul className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between border-b border-border/40 py-1 last:border-b-0">
                  <span className="truncate">{it.productName}</span>
                  <span className="ml-2 shrink-0 tabular-nums">×{it.quantityOrdered}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
