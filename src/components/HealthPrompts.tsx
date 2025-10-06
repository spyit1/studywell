"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const LOCAL_KEY = "healthPromptLastShown";

export default function HealthPrompt() {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<"良い" | "普通" | "悪い" | "">("");

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
        body: JSON.stringify({ condition, dayJst: today }),
      });
      if (!res.ok) console.error("Health save failed", await res.json());
    } catch (e) {
      console.error(e);
    }
    try {
      localStorage.setItem(LOCAL_KEY, new Date().toLocaleDateString("ja-JP"));
    } catch {}
    setOpen(false);
  };

  return (
    <Modal open={open} title="今日の体調を教えてください" onClose={() => setOpen(false)}>
      <div className="flex flex-wrap gap-2">
        {["良い", "普通", "悪い"].map((c) => (
          <button
            key={c}
            onClick={() => setCondition(c as any)}
            className={`rounded-xl border px-3 py-2 ${
              condition === c ? "border-gray-900" : "border-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
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
