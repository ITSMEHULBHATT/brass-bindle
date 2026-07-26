import { useMemo } from "react";
import { Undo2, Trash2, Archive as ArchiveIcon } from "lucide-react";
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
      <div className="px-4 py-4">
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ArchiveIcon className="size-12" strokeWidth={1.5} style={{ color: "#D1D5DB" }} />
          <p className="text-[15px] font-semibold" style={{ color: "#374151" }}>
            No completed orders
          </p>
          <p className="text-[13px] text-muted-foreground">
            Fully fulfilled orders will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4 py-4">
      {sorted.map((o) => {
        const total = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
        return (
          <div
            key={o.id}
            className="rounded-xl border border-border bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-foreground">{o.customerName}</h3>
                <p className="text-[12px] text-muted-foreground">
                  {o.datePlaced} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {total} units
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => onRestore(o.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
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
            <ul className="border-t border-[#F3F4F6] bg-[#FAFAFA] px-4 py-2 text-[12px] text-muted-foreground">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between border-b border-[#F3F4F6] py-1 last:border-b-0">
                  <span className="truncate" style={{ color: "#374151" }}>
                    {it.productName}
                  </span>
                  <span className="ml-2 shrink-0 font-semibold tabular-nums text-primary">
                    ×{it.quantityOrdered}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
