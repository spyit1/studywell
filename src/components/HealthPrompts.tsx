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
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (JST日付として渡す)
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition,            // "良い" | "普通" | "悪い"
          note: note.trim() || undefined,
          dayJst: today,        // その日のJSTキーでupsert
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
    <Modal open={open} title="今日の体調を教えてください" onClose={() => setOpen(false)}>
      <div className="flex flex-wrap gap-2">
        {["良い", "普通", "悪い"].map((c) => (
          <button
            key={c}
            onClick={() => setCondition(c as Condition)}
            className={`rounded-xl border px-3 py-2 ${
              condition === c ? "border-gray-900" : "border-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* メモ入力（任意） */}
      <div className="mt-3">
        <textarea
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="体調に関するメモ（任意）"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <button className="rounded-xl border px-3 py-2" onClick={() => setOpen(false)}>
          後で
        </button>
        <button
          className="rounded-xl bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!condition}
        >
          送信
        </button>
      </div>
    </Modal>
  );
}
