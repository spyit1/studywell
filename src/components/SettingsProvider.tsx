// components/SettingsProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Settings = {
  theme: "light" | "dark";
  highlightColor: string;
  snoozeDays: number; // ← 追加
};

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
};

const DEFAULT: Settings = {
  theme: "light",
  highlightColor: "#ef4444",
  snoozeDays: 1, // ← 既定は 1日
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  // 初期ロード
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studywell.settings");
      if (raw) {
        const json = JSON.parse(raw);
        setSettings((s) => ({
          ...s,
          ...json,
          // バリデーション（1〜30日に制限する例）
          snoozeDays: Math.min(30, Math.max(1, Number(json.snoozeDays ?? s.snoozeDays))),
        }));
      }
    } catch {}
  }, []);

  // 保存
  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next: Settings = {
        ...prev,
        ...patch,
        snoozeDays: Math.min(30, Math.max(1, Number(patch.snoozeDays ?? prev.snoozeDays))),
      };
      localStorage.setItem("studywell.settings", JSON.stringify(next));

      // テーマが変わったら即時反映＋Cookie同期（既存挙動を踏襲）
      if (patch.theme) {
        if (patch.theme === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        document.cookie = "studywell-theme=" + patch.theme + "; Path=/; Max-Age=31536000; SameSite=Lax";
      }
      // ハイライト色も即時反映
      if (patch.highlightColor) {
        document.documentElement.style.setProperty("--highlight-color", next.highlightColor);
        document.documentElement.style.setProperty("--highlight-bg", `rgba(${
          parseInt(next.highlightColor.slice(1,3),16)
        },${
          parseInt(next.highlightColor.slice(3,5),16)
        },${
          parseInt(next.highlightColor.slice(5,7),16)
        },0.16)`);
      }
      return next;
    });
  };

  const value = useMemo(() => ({ settings, update }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// 使いやすいhook
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
