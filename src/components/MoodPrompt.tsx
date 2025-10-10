"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const SESSION_KEY = "moodPromptDismissedAt";

type MoodEmoji = "😄" | "🙂" | "😐" | "😕" | "😞" | "";

export default function MoodPrompt() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<MoodEmoji>("");
  const [note, setNote] = useState("");

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(SESSION_KEY);
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,                  // 絵文字のままでOK（API側で数値に正規化）
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) console.error("Mood save failed", await res.json());
    } catch (e) {
      console.error(e);
    }
    try {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
    setMood("");
    setNote("");
  };

  return (
    <Modal
      open={open}
      title="今の気分を教えてください"
      onClose={() => setOpen(false)}
      // ※ Modal 側が className を受け取れるなら、以下のように渡すとより万全
      // className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
    >
      {/* 絵文字ボタン群 */}
      <div className="flex flex-wrap gap-2">
        {["😄", "🙂", "😐", "😕", "😞"].map((m) => {
          const selected = mood === (m as MoodEmoji);
          return (
            <button
              key={m}
              onClick={() => setMood(m as MoodEmoji)}
              className={[
                "rounded-xl border px-3 py-2 transition",
                // 基本トーン
                "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
                "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
                // 選択時の強調（リング＋ボーダー色）
                selected
                  ? "border-gray-900 ring-2 ring-blue-600 dark:border-gray-100 dark:ring-blue-400"
                  : "",
              ].join(" ")}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* メモ入力（任意） */}
      <div className="mt-3">
        <textarea
          className={[
            "w-full rounded-xl border px-3 py-2 text-sm",
            "bg-white text-gray-900 placeholder-gray-400 border-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
            "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700",
            "dark:focus:ring-blue-400",
          ].join(" ")}
          placeholder="気分に関するメモ（任意）"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* アクション */}
      <div className="flex justify-end gap-2 pt-3">
        <button
          className={[
            "rounded-xl border px-3 py-2 transition",
            "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
            "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
          ].join(" ")}
          onClick={() => setOpen(false)}
        >
          後で
        </button>

        <button
          className={[
            "rounded-xl px-4 py-2 text-white transition disabled:opacity-50",
            // 提出は背景色が分かりやすいブルー系に（暗所で埋もれない）
            "bg-blue-600 hover:bg-blue-700",
            "dark:bg-blue-500 dark:hover:bg-blue-600",
          ].join(" ")}
          onClick={handleSubmit}
          disabled={!mood}
        >
          送信
        </button>
      </div>
    </Modal>
  );
}
