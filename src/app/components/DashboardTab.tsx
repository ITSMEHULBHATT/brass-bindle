import { useMemo } from "react";
import type { Order, Shipment } from "../types";
import { computeProduction } from "../production";
import { daysSince, pendingLevel, pendingBadgeClass } from "../pending";

export function DashboardTab({
  orders,
  shipments,
}: {
  orders: Order[];
  shipments: Shipment[];
}) {
  const active = useMemo(() => orders.filter((o) => !o.archived), [orders]);
  const archived = useMemo(() => orders.filter((o) => o.archived), [orders]);
  const production = useMemo(() => computeProduction(active), [active]);

  const totalUnshipped = production.reduce((s, r) => s + r.totalRemaining, 0);
  const highPriority = active.filter((o) => o.priority === "high").length;
  const oldest = active
    .map((o) => ({ o, d: daysSince(o.datePlaced) }))
    .sort((a, b) => b.d - a.d)
    .slice(0, 5);
  const topProducts = production.slice(0, 5);
  const recentShipments = [...shipments]
    .sort((a, b) => b.shippedAt.localeCompare(a.shippedAt))
    .slice(0, 5);

  return (
    <div className="space-y-4 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Active orders" value={active.length} />
        <Stat label="High priority" value={highPriority} tone="red" />
        <Stat label="Unshipped units" value={totalUnshipped} tone="blue" />
        <Stat label="Completed" value={archived.length} tone="emerald" />
      </div>

      <Section title="Top pending products">
        {topProducts.length === 0 ? (
          <Empty text="Nothing pending." />
        ) : (
          <ul className="divide-y divide-border/60">
            {topProducts.map((r) => (
              <li key={r.productName} className="flex items-center justify-between py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{r.productName}</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold tabular-nums text-primary">
                  {r.totalRemaining}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Oldest active orders">
        {oldest.length === 0 ? (
          <Empty text="No active orders." />
        ) : (
          <ul className="divide-y divide-border/60">
            {oldest.map(({ o, d }) => {
              const level = pendingLevel(d);
              return (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{o.customerName}</span>
                  <span className="text-xs text-muted-foreground">{o.datePlaced}</span>
                  {level && (
                    <span
                      className={`ml-2 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${pendingBadgeClass(level)}`}
                    >
                      {d}d
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Recent shipments">
        {recentShipments.length === 0 ? (
          <Empty text="No shipments yet." />
        ) : (
          <ul className="divide-y divide-border/60">
            {recentShipments.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {s.customerName}{" "}
                  <span className="text-muted-foreground">#{s.shipmentNumber}</span>
                </span>
                <span className="text-xs text-muted-foreground">{s.shippedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red" | "blue" | "emerald";
}) {
  const toneCls =
    tone === "red"
      ? "text-red-600"
      : tone === "blue"
        ? "text-blue-600"
        : tone === "emerald"
          ? "text-emerald-600"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-2 text-center text-xs text-muted-foreground">{text}</p>;
}
