// components/TaskQuickActions.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition, useRef } from "react";
import { useSettings } from "@/components/SettingsProvider";

export default function TaskQuickActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { settings } = useSettings();

  // ✅ 1) 初期未定義対策 + サニタイズ（1〜30）
  const snoozeDays = (() => {
    const n = Number(settings?.snoozeDays ?? 1);
    return Math.min(30, Math.max(1, Math.floor(n)));
  })();

  // ✅ 3) 連打ガード（前回リクエストを中断できるように）
  const abortRef = useRef<AbortController | null>(null);

  async function post(url: string, body?: any) {
    try {
      // 直前のリクエストが残っていたら中断
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });

      if (!res.ok && res.status !== 204) {
        console.error("Action failed:", url, res.status);
      }
      router.refresh(); // ソフト更新（ダーク維持）
    } catch (e) {
      if ((e as any)?.name !== "AbortError") {
        console.error("Action error:", e);
      }
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => start(() => post(`/api/tasks/${id}/done`))}
        disabled={pending}
        // ✅ 2) タップ最適化（最小高さ / 反応 / アクセシビリティ）
        className="min-h-11 px-4 rounded-xl bg-emerald-600 text-white text-sm
                   hover:bg-emerald-700 active:opacity-90 touch-manipulation
                   disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-busy={pending || undefined}
        aria-label="タスクを完了"
      >
        完了
      </button>

      <button
        type="button"
        onClick={() => start(() => post(`/api/tasks/${id}/snooze`, { days: snoozeDays }))}
        disabled={pending}
        className="min-h-11 px-4 rounded-xl bg-gray-800 text-white text-sm
                   hover:bg-gray-900 active:opacity-90 touch-manipulation
                   dark:bg-gray-700 dark:hover:bg-gray-600
                   disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        title={`延期: ${snoozeDays}日`}
        aria-busy={pending || undefined}
        aria-label={`タスクを${snoozeDays}日延期`}
      >
        後で
      </button>
    </div>
  );
}
