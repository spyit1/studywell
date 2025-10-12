"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const LOCAL_KEY = "healthPromptLastShown";

type Condition = "良い" | "普通" | "悪い" | "";

export default function HealthPrompt() {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<Condition>("");
  const [note, setNote] = useState("");

  // 今日すでに表示したか確認（1日1回）
  useEffect(() => {
    const today = new Date().toLocaleDateString("ja-JP");
    try {
      const last = localStorage.getItem(LOCAL_KEY);
      if (last !== today) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const handleSubmit = async () => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition,                  // "良い" | "普通" | "悪い"
          note: note.trim() || undefined,
          dayJst: today,              // その日のJSTキーでupsert
        }),
      });
      if (!res.ok) console.error("Health save failed", await res.json());
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.setItem(LOCAL_KEY, new Date().toLocaleDateString("ja-JP"));
    } catch {}
    setOpen(false);
    setCondition("");
    setNote("");
  };

  return (
    <Modal
      open={open}
      title="今日の体調を教えてください"
      onClose={() => setOpen(false)}
      // Modal が className を受け取れる場合は以下も推奨
      // className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
    >
      {/* 選択ボタン */}
      <div className="flex flex-wrap gap-2">
        {["良い", "普通", "悪い"].map((c) => {
          const selected = condition === (c as Condition);
          return (
            <button
              key={c}
              onClick={() => setCondition(c as Condition)}
              className={[
                "rounded-xl border px-3 py-2 transition",
                "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
                "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
                selected
                  ? "border-gray-900 ring-2 ring-blue-600 dark:border-gray-100 dark:ring-blue-400"
                  : "",
              ].join(" ")}
            >
              {c}
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
          placeholder="体調に関するメモ（任意）"
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
            "bg-blue-600 hover:bg-blue-700",
            "dark:bg-blue-500 dark:hover:bg-blue-600",
          ].join(" ")}
          onClick={handleSubmit}
          disabled={!condition}
        >
          送信
        </button>
      </div>
    </Modal>
  );
}
