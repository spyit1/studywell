"use client";

import { useEffect, useState, ReactNode } from "react";

const LS_KEY = "studywell.settings"; // { theme: "light"|"dark", highlightColor: "#RRGGBB" }

type AppSettings = {
  theme: "light" | "dark";
  highlightColor: string;
};

const DEFAULTS: AppSettings = {
  theme: "light",
  highlightColor: "#ef4444", // 既定の薄赤ベース
};

// hex -> rgba(…, alpha)
function hexToRGBA(hex: string, alpha = 0.16) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  // 初回：localStorage から復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({ ...DEFAULTS, ...parsed });
      } else {
        // 未設定なら light を保存しておく（FOUC対策の初期スクリプトと整合）
        localStorage.setItem(LS_KEY, JSON.stringify(DEFAULTS));
      }
    } catch {
      /* noop */
    }
  }, []);

  // DOM へ反映（テーマ & CSS変数）
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    root.style.setProperty("--highlight-color", settings.highlightColor);
    root.style.setProperty("--highlight-bg", hexToRGBA(settings.highlightColor, 0.16));
  }, [settings]);

  // 他コンポから更新できるよう expose（安全に限定公開）
  useEffect(() => {
    (window as any).__studywellSetSettings = (next: Partial<AppSettings>) => {
      setSettings((prev) => {
        const merged = { ...prev, ...next };
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    };
    return () => {
      delete (window as any).__studywellSetSettings;
    };
  }, []);

  return <>{children}</>;
}
