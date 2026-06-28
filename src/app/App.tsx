import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ClipboardList, Factory, Archive, Share2 } from "lucide-react";
import { PRODUCT_CATALOG } from "@/data/catalog";
import type { Order } from "./types";
import { loadOrders, saveOrders, loadCustomItems, saveCustomItems } from "./storage";
import { isOrderComplete } from "./production";
import { buildExportText } from "./exporter";
import { copyText, shareText } from "./share";
import { OrdersTab } from "./components/OrdersTab";
import { ProductionTab } from "./components/ProductionTab";
import { ArchiveTab } from "./components/ArchiveTab";

type Tab = "orders" | "production" | "archive";

export function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("orders");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
    setCustomItems(loadCustomItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveOrders(orders);
  }, [orders, hydrated]);

  useEffect(() => {
    if (hydrated) saveCustomItems(customItems);
  }, [customItems, hydrated]);

  const effectiveCatalog = useMemo(() => {
    const known = new Set(PRODUCT_CATALOG.map((s) => s.toUpperCase()));
    const extras = customItems.filter((s) => !known.has(s.toUpperCase()));
    return [...extras, ...PRODUCT_CATALOG];
  }, [customItems]);

  function registerItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const upper = trimmed.toUpperCase();
    if (PRODUCT_CATALOG.some((s) => s.toUpperCase() === upper)) return;
    setCustomItems((curr) =>
      curr.some((s) => s.toUpperCase() === upper) ? curr : [trimmed, ...curr],
    );
  }


  // Auto-archive newly-completed orders
  useEffect(() => {
    let changed = false;
    const next = orders.map((o) => {
      if (!o.archived && isOrderComplete(o)) {
        changed = true;
        return { ...o, archived: true, archivedAt: new Date().toISOString() };
      }
      return o;
    });
    if (changed) setOrders(next);
  }, [orders]);

  const activeOrders = useMemo(() => orders.filter((o) => !o.archived), [orders]);
  const archivedOrders = useMemo(() => orders.filter((o) => o.archived), [orders]);

  async function handleExport() {
    const text = buildExportText(orders);
    try {
      await shareText(text);
      toast.success("Summary ready to share");
    } catch {
      const ok = await copyText(text);
      toast[ok ? "success" : "error"](ok ? "Copied to clipboard" : "Could not export");
    }
  }

  async function handleCopy() {
    const ok = await copyText(buildExportText(orders));
    toast[ok ? "success" : "error"](ok ? "Copied to clipboard" : "Could not copy");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <Toaster position="top-center" richColors />

      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">SUPERIOR BATH FITTINGS</h1>
            <p className="text-xs text-muted-foreground">
              {activeOrders.length} active · {archivedOrders.length} archived
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-accent"
            >
              Copy
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Share2 className="size-3.5" /> Export
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom))]">
        {tab === "orders" && (
          <OrdersTab
            orders={activeOrders}
            catalog={effectiveCatalog}
            onRegisterItem={registerItem}
            onChange={(updater) => setOrders((curr) => updater(curr))}
          />
        )}

        {tab === "production" && <ProductionTab orders={activeOrders} />}
        {tab === "archive" && (
          <ArchiveTab
            orders={archivedOrders}
            onRestore={(id) =>
              setOrders((curr) =>
                curr.map((o) =>
                  o.id === id ? { ...o, archived: false, archivedAt: undefined } : o,
                ),
              )
            }
            onDelete={(id) => setOrders((curr) => curr.filter((o) => o.id !== id))}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<ClipboardList className="size-5" />} label="Orders" />
          <TabButton active={tab === "production"} onClick={() => setTab("production")} icon={<Factory className="size-5" />} label="Production" />
          <TabButton active={tab === "archive"} onClick={() => setTab("archive")} icon={<Archive className="size-5" />} label="Archive" />
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
