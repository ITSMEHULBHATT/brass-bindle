import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { ClipboardList, Factory, Archive, Database, RefreshCw } from "lucide-react";
import { PRODUCT_CATALOG } from "@/data/catalog";
import type { Order } from "./types";
import { loadOrders, saveOrders, loadCustomItems, saveCustomItems } from "./storage";
import { isOrderComplete } from "./production";
import { OrdersTab } from "./components/OrdersTab";
import { ProductionTab } from "./components/ProductionTab";
import { ArchiveTab } from "./components/ArchiveTab";
import { BackupPanel } from "./components/BackupPanel";
import { usePwaUpdate } from "./pwa-update";

type Tab = "orders" | "production" | "archive";

export function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("orders");
  const [hydrated, setHydrated] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

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

  const prevCompleteRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!hydrated) return;
    const nowComplete = new Set(orders.filter((o) => isOrderComplete(o)).map((o) => o.id));
    let changed = false;
    const next = orders.map((o) => {
      const complete = nowComplete.has(o.id);
      const wasComplete = prevCompleteRef.current.has(o.id);
      if (!o.archived && complete && !wasComplete) {
        changed = true;
        return { ...o, archived: true, archivedAt: new Date().toISOString() };
      }
      return o;
    });
    prevCompleteRef.current = nowComplete;
    if (changed) setOrders(next);
  }, [orders, hydrated]);

  const { updateAvailable, applyUpdate } = usePwaUpdate();

  const activeOrders = useMemo(() => orders.filter((o) => !o.archived), [orders]);
  const archivedOrders = useMemo(() => orders.filter((o) => o.archived), [orders]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <Toaster position="top-center" richColors />

      {/* Brand header: deep navy with brown accent line */}
      <header className="sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between px-4" style={{ minHeight: 64 }}>
            <div className="min-w-0">
              <h1 className="text-[18px] font-bold leading-tight tracking-tight">
                Superior Bath Fittings
              </h1>
              <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>
                Order &amp; Production Manager
              </p>
            </div>
            <button
              onClick={() => setShowBackup(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <Database className="size-3.5" /> Backup
            </button>
          </div>
          <div className="h-[3px] w-full bg-cta" />
        </div>
        <div className="border-b border-border bg-background px-4 py-2">
          <p className="text-xs font-normal text-muted-foreground">
            {activeOrders.length} active · {archivedOrders.length} archived
          </p>
        </div>
      </header>

      {updateAvailable && (
        <button
          onClick={applyUpdate}
          className="flex w-full items-center justify-center gap-2 bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-sm"
        >
          <RefreshCw className="size-4" /> Update available — tap to refresh
        </button>
      )}

      {showBackup && (
        <BackupPanel
          orders={orders}
          customItems={customItems}
          onRestore={(o, c) => {
            setOrders(o);
            setCustomItems(c);
          }}
          onClose={() => setShowBackup(false)}
        />
      )}

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

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "var(--shadow-tabbar)" }}
      >
        <div className="grid grid-cols-3">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<ClipboardList className="size-[22px]" strokeWidth={2.25} />} label="Orders" />
          <TabButton active={tab === "production"} onClick={() => setTab("production")} icon={<Factory className="size-[22px]" strokeWidth={2.25} />} label="Production" />
          <TabButton active={tab === "archive"} onClick={() => setTab("archive")} icon={<Archive className="size-[22px]" strokeWidth={2.25} />} label="Archive" />
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
      className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
      style={{ height: 60 }}
    >
      {active && <span className="absolute inset-x-6 top-0 h-[2px] rounded-b bg-cta" />}
      {icon}
      <span>{label}</span>
    </button>
  );
}
