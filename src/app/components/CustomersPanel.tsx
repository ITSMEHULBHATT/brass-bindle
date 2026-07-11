import { useState } from "react";
import { X, Plus, Trash2, Pencil, Check } from "lucide-react";
import type { Customer } from "../types";

export function CustomersPanel({
  customers,
  onChange,
  onClose,
}: {
  customers: Customer[];
  onChange: (updater: (curr: Customer[]) => Customer[]) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function add() {
    const n = newName.trim();
    if (!n) return;
    if (customers.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      setNewName("");
      return;
    }
    onChange((curr) => [{ id: uid(), name: n }, ...curr]);
    setNewName("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-4 shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Customers</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New customer name"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            onClick={add}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>

        <div className="mt-4">
          {customers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No customers saved yet. Names are also remembered automatically when you create
              orders.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {[...customers]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-2 py-2">
                    {editing === c.id ? (
                      <>
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const n = editValue.trim();
                            if (n) {
                              onChange((curr) =>
                                curr.map((x) => (x.id === c.id ? { ...x, name: n } : x)),
                              );
                            }
                            setEditing(null);
                          }}
                          className="rounded-md bg-primary p-1.5 text-primary-foreground"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="rounded-md border border-border p-1.5"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                        <button
                          onClick={() => {
                            setEditing(c.id);
                            setEditValue(c.name);
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${c.name}" from directory?`))
                              onChange((curr) => curr.filter((x) => x.id !== c.id));
                          }}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
