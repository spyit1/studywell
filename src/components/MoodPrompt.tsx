"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const SESSION_KEY = "moodPromptDismissedAt";

export default function MoodPrompt() {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<"😄" | "🙂" | "😐" | "😕" | "😞" | "">("");

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
        body: JSON.stringify({ mood }), // ← 絵文字のままでOK
      });
      if (!res.ok) console.error("Mood save failed", await res.json());
    } catch (e) {
      console.error(e);
    }
    try {
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  return (
    <Modal open={open} title="今の気分を教えてください" onClose={() => setOpen(false)}>
      <div className="flex flex-wrap gap-2">
        {["😄", "🙂", "😐", "😕", "😞"].map((m) => (
          <button
            key={m}
            onClick={() => setMood(m as any)}
            className={`rounded-xl border px-3 py-2 ${
              mood === m ? "border-gray-900" : "border-gray-200"
            }`}
          >
            {m}
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
          disabled={!mood}
        >
          送信
        </button>
      </div>
    </Modal>
  );
}
