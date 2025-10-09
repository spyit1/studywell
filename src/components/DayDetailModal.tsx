"use client";

import { useEffect } from "react";

type MoodItem = { at: string; mood: number; note?: string | null };
type HealthItem = { condition?: number | null; note?: string | null };

function moodEmojiFromInt(m?: number | null) {
  if (m === 5) return "😄";
  if (m === 4) return "🙂";
  if (m === 3) return "😐";
  if (m === 2) return "😕";
  if (m === 1) return "😞";
  return "—";
}
function conditionLabelFromInt(c?: number | null) {
  if (c === 3) return "良い";
  if (c === 2) return "普通";
  if (c === 1) return "悪い";
  return "—";
}

function fmtTimeJST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function DayDetailModal({
  open,
  onClose,
  dateStr,       // "YYYY-MM-DD" (JST)
  health,
  moods,
}: {
  open: boolean;
  onClose: () => void;
  dateStr: string | null;
  health?: HealthItem;
  moods?: MoodItem[];
}) {
  // ESCで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !dateStr) return null;

  const moodList = (moods ?? []).slice().sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[min(720px,92vw)] max-h-[85vh] overflow-auto rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold">{dateStr} の詳細</h3>
          <button
            className="rounded-lg px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        {/* 体調 */}
        <section className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600">体調</h4>
          <div className="mt-1 rounded-xl border bg-gray-50 p-3">
            <div className="text-sm">
              状態：<b>{conditionLabelFromInt(health?.condition)}</b>
            </div>
            {health?.note ? (
              <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                メモ：{health.note}
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-400">メモはありません</div>
            )}
          </div>
        </section>

        {/* 気分ログ */}
        <section className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600">気分（その日）</h4>
          {moodList.length === 0 ? (
            <div className="mt-1 rounded-xl border bg-gray-50 p-3 text-sm text-gray-500">
              記録がありません
            </div>
          ) : (
            <ul className="mt-2 space-y-2">
              {moodList.map((m, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border p-3 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-base">
                      {moodEmojiFromInt(m.mood)}{" "}
                      <span className="text-sm text-gray-500">
                        （{fmtTimeJST(m.at)}）
                      </span>
                    </div>
                  </div>
                  {m.note ? (
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {m.note}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-gray-400">
                      メモなし
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
