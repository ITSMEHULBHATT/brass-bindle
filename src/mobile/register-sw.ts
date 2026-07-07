// Guarded service-worker registration for the standalone mobile/PWA build.
// Never registers in dev or inside Lovable preview iframes.
import { registerSW } from "virtual:pwa-register";

function isUnsafeContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

export function registerAppSW(): void {
  if (isUnsafeContext()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          for (const r of regs) {
            if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
          }
        })
        .catch(() => {});
    }
    return;
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      navigator.serviceWorker.getRegistration().then((reg) => {
        window.dispatchEvent(
          new CustomEvent("sbf:sw-update", { detail: { waiting: reg?.waiting ?? null } }),
        );
      });
    },
    onRegisteredSW(_swUrl, reg) {
      if (!reg) return;
      // Poll for updates every hour while the app is open.
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });

  // Expose for manual invocation if needed.
  (window as unknown as { __sbfUpdateSW?: typeof updateSW }).__sbfUpdateSW = updateSW;
}
