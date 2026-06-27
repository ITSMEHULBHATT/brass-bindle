import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight, X } from "lucide-react";
import type { Order } from "../types";
import { computeProduction } from "../production";
import { matchesAllTokens } from "../search";

export function ProductionTab({ orders }: { orders: Order[] }) {
  const rows = useMemo(() => computeProduction(orders), [orders]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => rows.filter((r) => matchesAllTokens(r.productName, query)),
    [rows, query],
  );

  const grandTotal = filtered.reduce((s, r) => s + r.totalRemaining, 0);

  return (
    <div className="space-y-3 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter (e.g. alfa bib)"
          className="w-full rounded-md border border-input bg-background px-9 py-3 text-base focus:border-primary focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
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
                        {row.breakdown.map((b, i) => (
                          <tr key={i} className="border-t border-border/40 first:border-t-0">
                            <td className="py-1.5 pr-2">{b.customerName}</td>
                            <td className="py-1.5 pr-2 text-muted-foreground">{b.datePlaced}</td>
                            <td className="py-1.5 text-right font-semibold tabular-nums">{b.remaining}</td>
                          </tr>
                        ))}
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
