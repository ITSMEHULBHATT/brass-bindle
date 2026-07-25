import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { BRANDS } from "../brands";
import { filterByTokens, matchesAllTokens } from "../search";

interface Props {
  catalog: readonly string[];
  onPick: (productName: string) => void;
  excludeNames?: Set<string>;
  autoFocus?: boolean;
}

export function ProductPicker({ catalog, onPick, excludeNames, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleQueryChange(v: string) {
    setQuery(v);
    if (v.trim() === "") setBrand(null);
    setActiveIdx(0);
  }

  const results = useMemo(() => {
    let pool = catalog;
    if (brand) pool = pool.filter((p) => p.toUpperCase().includes(brand));
    let list = filterByTokens(pool, query);
    if (excludeNames && excludeNames.size > 0) {
      list = list.filter((n) => !excludeNames.has(n));
    }
    return list.slice(0, 80);
  }, [catalog, brand, query, excludeNames]);

  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(0);
  }, [results.length, activeIdx]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIdx];
      if (pick) {
        onPick(pick);
        setQuery("");
        setActiveIdx(0);
      }
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {BRANDS.map((b) => {
          const active = brand === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => {
                setBrand(active ? null : b);
                setActiveIdx(0);
                inputRef.current?.focus();
              }}
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
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={brand ? `Search ${brand}…` : "Search products (try: alfa bib)"}
          className="h-11 w-full rounded-[10px] border border-border bg-card px-9 text-sm shadow-sm outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="max-h-72 overflow-y-auto rounded-[10px] border border-border bg-card"
      >
        {results.length === 0 && !query.trim() ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Start typing to search products.
          </div>
        ) : (
          <>
            {results.map((name, i) => (
              <button
                key={name}
                data-idx={i}
                type="button"
                onClick={() => {
                  onPick(name);
                  setQuery("");
                  inputRef.current?.focus();
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`block w-full border-b border-[#F3F4F6] px-3 py-2.5 text-left text-sm last:border-b-0 ${
                  i === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                {name}
              </button>
            ))}
            {query.trim() && (
              <button
                data-idx={results.length}
                type="button"
                onClick={() => {
                  onPick(query.trim());
                  setQuery("");
                  inputRef.current?.focus();
                }}
                onMouseEnter={() => setActiveIdx(results.length)}
                className={`block w-full border-t border-border px-3 py-2.5 text-left text-sm font-medium ${
                  activeIdx === results.length
                    ? "bg-accent text-accent-foreground"
                    : "text-cta hover:bg-accent/50"
                }`}
              >
                + Use "{query.trim()}" as custom item
              </button>
            )}
          </>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tip: type multiple words in any order. Arrow keys + Enter to pick.
      </p>
    </div>
  );
}

export { matchesAllTokens };
