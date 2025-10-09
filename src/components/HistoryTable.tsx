"use client";

import { useMemo, useState } from "react";
import DayDetailModal from "./DayDetailModal";

type Health = { condition?: number | null; note?: string | null } | null;
type Mood = { atISO: string; mood: number; note?: string | null };

type Row = {
  dateStr: string;          // "YYYY-MM-DD" (JST)
  health: Health;
  moods: Mood[];
  moodEmojis: string;       // "😄 🙂" など
  avgMood: string;          // "—" or "3.25"
  hasAnyNote: boolean;
};

function conditionLabelFromInt(c?: number | null) {
  if (c === 3) return "良い";
  if (c === 2) return "普通";
  if (c === 1) return "悪い";
  return "—";
}

export default function HistoryTable({ rows }: { rows: Row[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const indexByDate = useMemo(() => {
    const map: Record<string, Row> = {};
    for (const r of rows) map[r.dateStr] = r;
    return map;
  }, [rows]);

  const current = selected ? indexByDate[selected] : null;

  return (
    <>
      <DayDetailModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        dateStr={selected}
        health={current?.health ?? undefined}
        moods={(current?.moods ?? []).map((m) => ({
          at: m.atISO,
          mood: m.mood,
          note: m.note,
        }))}
      />

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">日付</th>
              <th className="px-4 py-2 text-left">体調</th>
              <th className="px-4 py-2 text-left">気分（複数）</th>
              <th className="px-4 py-2 text-left">平均気分</th>
              <th className="px-4 py-2 text-left">ノート</th>
              <th className="px-4 py-2 text-left">詳細</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hasHealthNote = !!(r.health?.note && r.health.note.trim());
              const hasMoodNote = r.moods.some((m) => m.note && m.note.trim());
              const noteBadge =
                hasHealthNote || hasMoodNote
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-500";

              return (
                <tr key={r.dateStr} className="border-t">
                  <td className="px-4 py-2">{r.dateStr}</td>
                  <td className="px-4 py-2">
                    {conditionLabelFromInt(r.health?.condition)}
                  </td>
                  <td className="px-4 py-2">{r.moodEmojis || "—"}</td>
                  <td className="px-4 py-2">{r.avgMood}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs rounded-full px-2 py-1 ${noteBadge}`}>
                      {hasHealthNote || hasMoodNote ? "あり" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="rounded-lg border px-3 py-1 bg-white hover:bg-gray-50"
                      onClick={() => {
                        setSelected(r.dateStr);
                        setOpen(true);
                      }}
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
