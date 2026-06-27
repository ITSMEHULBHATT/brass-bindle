// Thin wrappers around Capacitor Share/Clipboard with web fallbacks so the
// same code works in the Lovable browser preview and inside the Android APK.

async function tryNative<T>(loader: () => Promise<T>): Promise<T | null> {
  try {
    return await loader();
  } catch {
    return null;
  }
}

export async function shareText(text: string, title = "Brass Orders Summary"): Promise<void> {
  const cap = await tryNative(() => import("@capacitor/share"));
  if (cap) {
    try {
      await cap.Share.share({ title, text, dialogTitle: title });
      return;
    } catch {
      // user dismissed or plugin unavailable on web — fall through
    }
  }
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      /* fall through */
    }
  }
  await copyText(text);
}

export async function copyText(text: string): Promise<boolean> {
  const cap = await tryNative(() => import("@capacitor/clipboard"));
  if (cap) {
    try {
      await cap.Clipboard.write({ string: text });
      return true;
    } catch {
      /* fall through */
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}
