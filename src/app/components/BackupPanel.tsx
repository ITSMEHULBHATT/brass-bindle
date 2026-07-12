import { useRef, useState } from "react";
import { X, Download, Upload, Copy, Share2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "../types";
import { buildExportText } from "../exporter";
import { downloadBackup, parseBackup } from "../backup";
import { copyText, shareText } from "../share";

export function BackupPanel({
  orders,
  customItems,
  onRestore,
  onClose,
}: {
  orders: Order[];
  customItems: string[];
  onRestore: (orders: Order[], customItems: string[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const data = parseBackup(text);
      const ok = confirm(
        `Restore from backup?\n\nThis will REPLACE your current data with:\n• ${data.orders.length} orders\n• ${data.customItems.length} custom items\n\nThis cannot be undone.`,
      );
      if (!ok) return;
      onRestore(data.orders, data.customItems);
      toast.success("Restored from backup");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read backup");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Backup & Export</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Full backup
          </h3>
          <button
            onClick={() => downloadBackup(orders, customItems)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="size-4" /> Download backup (.json)
          </button>
          <button
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Upload className="size-4" /> Restore from file…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            Restoring will replace all current data — it does not merge.
          </p>
        </section>

        <section className="mt-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Readable text summary
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                const ok = await copyText(buildExportText(orders));
                toast[ok ? "success" : "error"](ok ? "Copied" : "Could not copy");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              <Copy className="size-4" /> Copy
            </button>
            <button
              onClick={async () => {
                try {
                  await shareText(buildExportText(orders));
                } catch {
                  /* ignore */
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Share2 className="size-4" /> Share
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
