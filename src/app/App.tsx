import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  ClipboardList,
  Factory,
  Archive,
  Database,
  RefreshCw,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { PRODUCT_CATALOG } from "@/data/catalog";
import type { Order, Shipment, Customer } from "./types";
import {
  loadOrders,
  saveOrders,
  loadCustomItems,
  saveCustomItems,
  loadShipments,
  saveShipments,
  loadCustomers,
  saveCustomers,
} from "./storage";
import { isOrderComplete } from "./production";
import { OrdersTab } from "./components/OrdersTab";
import { ProductionTab } from "./components/ProductionTab";
import { ArchiveTab } from "./components/ArchiveTab";
import { BackupPanel } from "./components/BackupPanel";
import { DashboardTab } from "./components/DashboardTab";
import { CustomersPanel } from "./components/CustomersPanel";
import { usePwaUpdate } from "./pwa-update";

type Tab = "dashboard" | "orders" | "production" | "archive";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>("orders");
  const [hydrated, setHydrated] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);

  useEffect(() => {
    setOrders(loadOrders());
    setShipments(loadShipments());
    setCustomers(loadCustomers());
    setCustomItems(loadCustomItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveOrders(orders);
  }, [orders, hydrated]);
  useEffect(() => {
    if (hydrated) saveShipments(shipments);
  }, [shipments, hydrated]);
  useEffect(() => {
    if (hydrated) saveCustomers(customers);
  }, [customers, hydrated]);
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

  function registerCustomer(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    setCustomers((curr) =>
      curr.some((c) => c.name.toLowerCase() === lower)
        ? curr
        : [{ id: uid(), name: trimmed }, ...curr],
    );
  }

  function createShipment(orderId: string, itemIds: string[]) {
    if (itemIds.length === 0) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const idSet = new Set(itemIds);
    const shippedItems = order.items.filter((i) => idSet.has(i.id) && !i.shipped);
    if (shippedItems.length === 0) return;
    const shipmentNumber = order.shipmentIds.length + 1;
    const shipment: Shipment = {
      id: uid(),
      type: "shipment",
      orderId,
      customerName: order.customerName,
      shipmentNumber,
      shippedAt: new Date().toISOString(),
      items: shippedItems.map((i) => ({
        productName: i.productName,
        quantityOrdered: i.quantityOrdered,
      })),
    };
    setShipments((curr) => [shipment, ...curr]);
    setOrders((curr) =>
      curr.map((o) => {
        if (o.id !== orderId) return o;
        const nextItems = o.items.map((i) => (idSet.has(i.id) ? { ...i, shipped: true } : i));
        const allShipped = nextItems.every((i) => i.shipped);
        return {
          ...o,
          items: nextItems,
          shipmentIds: [...o.shipmentIds, shipment.id],
          archived: allShipped ? true : o.archived,
          dateArchived: allShipped ? new Date().toISOString() : o.dateArchived,
        };
      }),
    );
    const remaining = order.items.filter((i) => !i.shipped && !idSet.has(i.id)).length;
    if (remaining === 0) {
      toast.success("Order completed — moved to Archive");
    } else {
      toast.success(`Shipment ${shipmentNumber} created`);
    }
  }

  function cloneOrder(source: Order) {
    const unshipped = source.items.filter((i) => !i.shipped);
    if (unshipped.length === 0) {
      toast.info("Nothing to clone — all items shipped");
      return;
    }
    const clone: Order = {
      id: uid(),
      customerName: source.customerName,
      datePlaced: new Date().toISOString().slice(0, 10),
      notes: source.notes,
      priority: source.priority,
      archived: false,
      dateArchived: null,
      shipmentIds: [],
      items: unshipped.map((i) => ({
        id: uid(),
        productName: i.productName,
        quantityOrdered: i.quantityOrdered,
        shipped: false,
      })),
    };
    setOrders((curr) => [clone, ...curr]);
    toast.success("Order cloned");
  }

  function restoreArchived(id: string) {
    // Delete associated shipments; reset items to shipped:false; clear archive fields.
    setShipments((curr) => curr.filter((s) => s.orderId !== id));
    setOrders((curr) =>
      curr.map((o) =>
        o.id === id
          ? {
              ...o,
              archived: false,
              dateArchived: null,
              shipmentIds: [],
              items: o.items.map((i) => ({ ...i, shipped: false })),
            }
          : o,
      ),
    );
    prevCompleteRef.current.delete(id);
    toast.success("Order restored");
  }

  function deleteArchived(id: string) {
    setShipments((curr) => curr.filter((s) => s.orderId !== id));
    setOrders((curr) => curr.filter((o) => o.id !== id));
  }

  // Auto-archive orders on transition from incomplete -> complete.
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
        return { ...o, archived: true, dateArchived: new Date().toISOString() };
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

      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">SUPERIOR BATH FITTINGS</h1>
            <p className="text-xs text-muted-foreground">
              {activeOrders.length} active · {archivedOrders.length} completed · {shipments.length}{" "}
              shipments
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowCustomers(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 text-xs font-semibold hover:bg-accent"
              title="Customers"
            >
              <Users className="size-3.5" />
            </button>
            <button
              onClick={() => setShowBackup(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Database className="size-3.5" /> Backup
            </button>
          </div>
        </div>
      </header>

      {updateAvailable && (
        <button
          onClick={applyUpdate}
          className="flex w-full items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <RefreshCw className="size-4" /> Update available — tap to refresh
        </button>
      )}

      {showBackup && (
        <BackupPanel
          orders={orders}
          shipments={shipments}
          customItems={customItems}
          onRestore={(o, s, c) => {
            setOrders(o);
            setShipments(s);
            setCustomItems(c);
          }}
          onClose={() => setShowBackup(false)}
        />
      )}

      {showCustomers && (
        <CustomersPanel
          customers={customers}
          onChange={(updater) => setCustomers((curr) => updater(curr))}
          onClose={() => setShowCustomers(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom))]">
        {tab === "dashboard" && <DashboardTab orders={orders} shipments={shipments} />}
        {tab === "orders" && (
          <OrdersTab
            orders={activeOrders}
            catalog={effectiveCatalog}
            customers={customers}
            onRegisterItem={registerItem}
            onRegisterCustomer={registerCustomer}
            onChange={(updater) => setOrders((curr) => updater(curr))}
            onCreateShipment={createShipment}
            onCloneOrder={cloneOrder}
          />
        )}
        {tab === "production" && <ProductionTab orders={activeOrders} />}
        {tab === "archive" && (
          <ArchiveTab
            orders={orders}
            shipments={shipments}
            onRestore={restoreArchived}
            onDelete={deleteArchived}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          <TabButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={<LayoutDashboard className="size-5" />}
            label="Dashboard"
          />
          <TabButton
            active={tab === "orders"}
            onClick={() => setTab("orders")}
            icon={<ClipboardList className="size-5" />}
            label="Orders"
          />
          <TabButton
            active={tab === "production"}
            onClick={() => setTab("production")}
            icon={<Factory className="size-5" />}
            label="Production"
          />
          <TabButton
            active={tab === "archive"}
            onClick={() => setTab("archive")}
            icon={<Archive className="size-5" />}
            label="Archive"
          />
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
