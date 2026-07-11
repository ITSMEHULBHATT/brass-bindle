import { useMemo } from "react";
import { Undo2, Trash2, Package, CheckCircle2 } from "lucide-react";
import type { Order, Shipment } from "../types";

type Row =
  | { kind: "shipment"; ts: string; shipment: Shipment; parentOrder: Order | undefined }
  | { kind: "order"; ts: string; order: Order; shipments: Shipment[] };

export function ArchiveTab({
  orders,
  shipments,
  onRestore,
  onDelete,
}: {
  orders: Order[]; // ALL orders (active + archived) so we can link shipments back
  shipments: Shipment[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rows = useMemo<Row[]>(() => {
    const byId = new Map(orders.map((o) => [o.id, o] as const));
    const archived = orders.filter((o) => o.archived);
    const shipmentRows: Row[] = shipments.map((s) => ({
      kind: "shipment" as const,
      ts: s.shippedAt,
      shipment: s,
      parentOrder: byId.get(s.orderId),
    }));
    const orderRows: Row[] = archived.map((o) => ({
      kind: "order" as const,
      ts: o.dateArchived ?? o.datePlaced,
      order: o,
      shipments: shipments
        .filter((s) => s.orderId === o.id)
        .sort((a, b) => a.shipmentNumber - b.shipmentNumber),
    }));
    return [...shipmentRows, ...orderRows].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [orders, shipments]);

  if (rows.length === 0) {
    return (
      <div className="p-3">
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Nothing archived yet. Shipments and completed orders will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {rows.map((r) => {
        if (r.kind === "shipment") {
          const s = r.shipment;
          const totalUnits = s.items.reduce((sum, i) => sum + i.quantityOrdered, 0);
          return (
            <div key={`s-${s.id}`} className="rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-2 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Package className="size-4 shrink-0 text-blue-600" />
                    <h3 className="truncate text-sm font-semibold">
                      {s.customerName} — Shipment {s.shipmentNumber}
                    </h3>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(s.shippedAt).toLocaleString()} · {s.items.length} item
                    {s.items.length === 1 ? "" : "s"} · {totalUnits} units
                  </p>
                </div>
              </div>
              <ul className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
                {s.items.map((it, i) => (
                  <li
                    key={i}
                    className="flex justify-between border-b border-border/40 py-1 last:border-b-0"
                  >
                    <span className="truncate">{it.productName}</span>
                    <span className="ml-2 shrink-0 tabular-nums">×{it.quantityOrdered}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        const o = r.order;
        const totalUnits = o.items.reduce((s, i) => s + i.quantityOrdered, 0);
        return (
          <div key={`o-${o.id}`} className="rounded-lg border border-emerald-500/40 bg-card">
            <div className="flex items-start justify-between gap-2 px-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <h3 className="truncate text-sm font-semibold">
                    {o.customerName} — Completed
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {o.dateArchived?.slice(0, 10) ?? o.datePlaced} · {r.shipments.length} shipment
                  {r.shipments.length === 1 ? "" : "s"} · {o.items.length} item
                  {o.items.length === 1 ? "" : "s"} · {totalUnits} units
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => {
                    const msg =
                      r.shipments.length > 0
                        ? `Restoring will delete ${r.shipments.length} shipment record${r.shipments.length === 1 ? "" : "s"} for this order. Continue?`
                        : `Restore order from ${o.customerName}?`;
                    if (confirm(msg)) onRestore(o.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  <Undo2 className="size-3.5" /> Restore
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Permanently delete order from ${o.customerName}?`))
                      onDelete(o.id);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete permanently"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            {r.shipments.length > 0 && (
              <div className="border-t border-border/60 px-3 py-2 text-xs">
                {r.shipments.map((s) => (
                  <div key={s.id} className="border-b border-border/40 py-1.5 last:border-b-0">
                    <div className="font-medium text-foreground">
                      Shipment {s.shipmentNumber}
                      <span className="ml-2 text-muted-foreground">
                        {s.shippedAt.slice(0, 10)}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {s.items.map((i) => `${i.productName} ×${i.quantityOrdered}`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
