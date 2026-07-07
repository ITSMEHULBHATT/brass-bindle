import { useEffect, useState } from "react";

// Small hook that surfaces "a new service-worker version is waiting" so the UI
// can prompt the user. Registration itself happens in src/mobile/register-sw.ts.
export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ waiting: ServiceWorker | null }>).detail;
      setWaitingWorker(detail?.waiting ?? null);
      setUpdateAvailable(true);
    };
    window.addEventListener("sbf:sw-update", handler as EventListener);
    return () => window.removeEventListener("sbf:sw-update", handler as EventListener);
  }, []);

  function applyUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    // Reload once the new worker takes control (or immediately as a fallback).
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload(),
        { once: true },
      );
    }
    setTimeout(() => window.location.reload(), 500);
  }

  return { updateAvailable, applyUpdate };
}
