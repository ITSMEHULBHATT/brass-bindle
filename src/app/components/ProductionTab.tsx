import { useMemo, useState } from "react";
import { Search, ChevronDown, ChevronRight, X, Factory } from "lucide-react";
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
    <div className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap gap-1.5">
        {BRANDS.map((b) => {
          const active = brand === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(active ? null : b)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-transform active:scale-[0.96] ${
                active
                  ? "border border-primary bg-primary text-primary-foreground"
                  : "border border-border bg-[#F3F4F6] text-[#374151]"
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
          className="h-11 w-full rounded-[10px] border border-border bg-card px-9 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/10"
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
        <span className="font-semibold tabular-nums text-primary">{grandTotal} units total</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
          <Factory className="size-12 text-[#D1D5DB]" strokeWidth={1.5} />
          <h3 className="mt-3 text-[15px] font-semibold text-[#374151]">
            {rows.length === 0 ? "Nothing to produce" : "No matches"}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {rows.length === 0
              ? "All caught up — pending items will appear here."
              : "Try a different brand or search term."}
          </p>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {filtered.map((row) => {
            const isOpen = open[row.productName] ?? false;
            return (
              <div
                key={row.productName}
                className="overflow-hidden rounded-xl border border-border bg-card"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <button
                  onClick={() => setOpen((o) => ({ ...o, [row.productName]: !isOpen }))}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-[#FAFAFA]"
                >
                  {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">{row.productName}</span>
                  <span className="text-[14px] font-bold tabular-nums text-primary">
                    {row.totalRemaining}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-[#F3F4F6] bg-[#FAFAFA] px-3 py-2 pl-10">
                    <table className="w-full text-xs">
                      <tbody>
                        {row.breakdown.map((b, i) => {
                          const days = daysSince(b.datePlaced);
                          const level = pendingLevel(days);
                          return (
                            <tr key={i} className="border-t border-[#F3F4F6] first:border-t-0">
                              <td className="py-1.5 pr-2 text-[#374151]">{b.customerName}</td>
                              <td className="py-1.5 pr-2 text-muted-foreground">{b.datePlaced}</td>
                              <td className="py-1.5 pr-2">
                                {level && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pendingBadgeClass(level)}`}
                                  >
                                    {days}d
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 text-right font-bold tabular-nums text-primary">{b.remaining}</td>
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
