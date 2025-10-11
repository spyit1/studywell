// app/settings/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AppSettings = {
  theme: "light" | "dark";
  highlightColor: string;
  snoozeDays: number;           // ← 追加
};

const LS_KEY = "studywell.settings";
const DEFAULTS: AppSettings = {
  theme: "light",
  highlightColor: "#ef4444",
  snoozeDays: 1,               // ← 既定: 1日
};

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  // 初期読み込み
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const merged: AppSettings = {
          ...DEFAULTS,
          ...parsed,
          snoozeDays: clamp(Number((parsed as any)?.snoozeDays ?? DEFAULTS.snoozeDays), 1, 30),
        };
        setSettings(merged);
        (window as any).__studywellSetSettings?.(merged);
      }
    } catch {}
  }, []);

  const apply = (next: Partial<AppSettings>) => {
    const merged: AppSettings = {
      ...settings,
      ...next,
      snoozeDays: clamp(Number((next as any)?.snoozeDays ?? settings.snoozeDays), 1, 30),
    };
    setSettings(merged);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(merged));
    } catch {}
    // ← ここを merged で渡すのがポイント（テーマ/色/日数を一括同期）
    (window as any).__studywellSetSettings?.(merged);
  };

  const reset = () => {
    setSettings(DEFAULTS);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULTS));
    } catch {}
    (window as any).__studywellSetSettings?.(DEFAULTS);
  };

  return (
    <main className="min-h-[100dvh] pb-[env(safe-area-inset-bottom) p-6">
      {/* ヘッダー（右上に戻るボタン） */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">設定</h1>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-gray-50
                     dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
          aria-label="ダッシュボードに戻る"
        >
          <span>←</span>
          <span>ダッシュボードへ戻る</span>
        </Link>
      </div>

      {/* 表示設定 */}
      <section className="mx-auto max-w-4xl mb-8 rounded-2xl border p-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">表示設定</h2>

        {/* ダークモード */}
        <div className="flex items-center gap-4 mb-4">
          <label className="w-40 text-sm opacity-80">ダークモード</label>
          <button
            onClick={() => apply({ theme: settings.theme === "dark" ? "light" : "dark" })}
            className="px-4 py-2 rounded-xl border dark:border-gray-700 shadow bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {settings.theme === "dark" ? "ダーク中（クリックでライト）" : "ライト中（クリックでダーク）"}
          </button>
        </div>

        {/* ハイライト色 */}
        <div className="flex items-center gap-4 mb-4">
          <label className="w-40 text-sm opacity-80">最優先タスクの色</label>
          <input
            type="color"
            value={settings.highlightColor}
            onChange={(e) => apply({ highlightColor: e.target.value })}
            className="h-10 w-16 cursor-pointer rounded border dark:border-gray-700 bg-transparent"
            aria-label="最優先タスクのハイライト色"
          />
          <div
            className="flex-1 rounded-xl p-3 text-sm border dark:border-gray-700"
            style={{ background: "var(--highlight-bg)" }}
          >
            プレビュー：この背景が「最優先タスク」に適用されます
          </div>
        </div>
      </section>

      {/* タスク設定 */}
      <section className="mx-auto max-w-4xl mb-8 rounded-2xl border p-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">タスク設定</h2>

        {/* 「後で」延期日数 */}
        <div className="flex items-center gap-4 mb-4">
          <label className="w-40 text-sm opacity-80">「後で」延期日数</label>
          <input
            type="number"
            inputMode="numeric"
            enterKeyHint="done"
            min={1}
            max={30}
            value={settings.snoozeDays ?? 1}
            onChange={(e) => apply({ snoozeDays: Number(e.target.value) })}
            className="w-28 mt-1 block rounded-md border shadow-sm p-2
                       bg-white text-gray-900 border-gray-300 placeholder-gray-400
                       focus:border-emerald-500 focus:ring-emerald-500
                       dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
                       dark:focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">1〜30 の範囲</span>
        </div>
      </section>

      <div className="mx-auto max-w-4xl flex gap-3">
        <button
          onClick={reset}
          className="px-3 py-2 text-sm rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          既定に戻す
        </button>
      </div>

      <p className="mx-auto max-w-4xl mt-6 text-sm text-gray-500 dark:text-gray-400">
        ※ 設定はブラウザの <code>localStorage</code> に保存され、次回以降も引き継がれます。
      </p>
    </main>
  );
}
