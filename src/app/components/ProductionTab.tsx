import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight, X } from "lucide-react";
import type { Order } from "../types";
import { computeProduction } from "../production";
import { matchesAllTokens } from "../search";
import { BRANDS } from "../brands";
import { daysSince, pendingLevel, pendingBadgeClass } from "../pending";

export function ProductionTab({ orders }: { orders: Order[] }) {
  const rows = useMemo(() => computeProduction(orders), [orders]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    let list = rows;
    if (brand) list = list.filter((r) => r.productName.toUpperCase().includes(brand));
    list = list.filter((r) => matchesAllTokens(r.productName, query));
    return list;
  }, [rows, query, brand]);

  function handleQueryChange(v: string) {
    setQuery(v);
    if (v.trim() === "") setBrand(null);
  }

  const grandTotal = filtered.reduce((s, r) => s + r.totalRemaining, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="flex flex-wrap gap-1.5">
        {BRANDS.map((b) => {
          const active = brand === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(active ? null : b)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent"
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={brand ? `Filter ${brand}…` : "Filter (e.g. alfa bib)"}
          className="w-full rounded-md border border-input bg-background px-9 py-3 text-base focus:border-primary focus:outline-none"
        />
        {query && (
          <button
            onClick={() => handleQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between px-1 text-sm">
        <span className="text-muted-foreground">
          {filtered.length} product{filtered.length === 1 ? "" : "s"} pending
        </span>
        <span className="font-semibold tabular-nums">{grandTotal} units total</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "Nothing in production. All caught up!" : "No matches."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {filtered.map((row) => {
            const isOpen = open[row.productName] ?? false;
            return (
              <div key={row.productName} className="border-b border-border/60 last:border-b-0">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [row.productName]: !isOpen }))}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent/40"
                >
                  {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.productName}</span>
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                    {row.totalRemaining}
                  </span>
                </button>
                {isOpen && (
                  <div className="bg-muted/30 px-3 pb-3 pl-10">
                    <table className="w-full text-xs">
                      <tbody>
                        {row.breakdown.map((b, i) => {
                          const days = daysSince(b.datePlaced);
                          const level = pendingLevel(days);
                          return (
                            <tr key={i} className="border-t border-border/40 first:border-t-0">
                              <td className="py-1.5 pr-2">{b.customerName}</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">{b.datePlaced}</td>
                              <td className="py-1.5 pr-2">
                                {level && (
                                  <span
                                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${pendingBadgeClass(level)}`}
                                  >
                                    {days}d
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 text-right font-semibold tabular-nums">{b.remaining}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
