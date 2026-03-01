import { useState, useCallback } from "react";

const DEV_MODE_KEY = "miniapp-platform-dev-mode";

export function useDevMode() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(DEV_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DEV_MODE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return { devMode: enabled, toggleDevMode: toggle };
}
