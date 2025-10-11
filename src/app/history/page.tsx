// app/history/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { jstDayToUtcMidnight, getJstTodayStr } from "@/lib/time";
import HistoryTable from "@/components/HistoryTable";

export const runtime = "nodejs";
export const revalidate = 0;

function moodEmojiFromInt(m?: number | null) {
  if (m === 5) return "😄";
  if (m === 4) return "🙂";
  if (m === 3) return "😐";
  if (m === 2) return "😕";
  if (m === 1) return "😞";
  return "—";
}
function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default async function HistoryPage() {
  const today = getJstTodayStr();

  // 直近30日の範囲（JST日基準）
  const from30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const fromKey = jstDayToUtcMidnight(from30.toISOString().slice(0, 10));

  const [health, moods] = await Promise.all([
    prisma.dailyHealth.findMany({
      where: { date: { gte: fromKey } },
      orderBy: { date: "desc" },
      select: { date: true, condition: true, note: true },
    }),
    prisma.moodLog.findMany({
      orderBy: { at: "desc" },
      take: 300,
      select: { at: true, mood: true, note: true },
    }),
  ]);

  type DayRow = {
    health?: { condition?: number | null; note?: string | null };
    moods: { at: Date; mood: number; note?: string | null }[];
  };
  const byDay = new Map<string, DayRow>();

  for (const h of health) {
    const key = new Date(h.date.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { moods: [] };
    cur.health = { condition: h.condition, note: h.note };
    byDay.set(key, cur);
  }
  for (const m of moods) {
    const key = new Date(m.at.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { moods: [] };
    cur.moods.push({ at: m.at, mood: m.mood, note: m.note });
    byDay.set(key, cur);
  }

  const rows = Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30)
    .map(([dateStr, v]) => {
      const avgMood = v.moods.length ? avg(v.moods.map((x) => x.mood)) : 0;
      const moodEmojis = v.moods.map((x) => moodEmojiFromInt(x.mood)).join(" ");
      const hasAnyNote =
        !!(v.health?.note && v.health.note.trim()) ||
        v.moods.some((x) => x.note && x.note.trim());
      return {
        dateStr,
        health: v.health ?? null,
        moods: v.moods.map((m) => ({
          atISO: m.at.toISOString(),
          mood: m.mood,
          note: m.note ?? null,
        })),
        moodEmojis,
        avgMood: v.moods.length ? avgMood.toFixed(2) : "—",
        hasAnyNote,
      };
    });

  const sevenCutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000 + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
  const rows7 = rows.filter((r) => r.dateStr >= sevenCutoff);
  const avgMood7 = rows7.length
    ? avg(rows7.map((r) => (r.avgMood === "—" ? 0 : Number(r.avgMood))).filter((n) => n > 0)).toFixed(2)
    : "—";
  const healthCount7 = {
    good: rows7.filter((r) => r.health?.condition === 3).length,
    normal: rows7.filter((r) => r.health?.condition === 2).length,
    bad: rows7.filter((r) => r.health?.condition === 1).length,
  };

  return (
    <main className="min-h-[100dvh] pb-[env(safe-area-inset-bottom) bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/70 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">履歴</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* サマリー */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">直近7日の平均気分</div>
            <div className="mt-1 text-2xl font-bold">{avgMood7}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">（1〜5｜😞1 〜 😄5）</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">直近7日の体調内訳</div>
            <div className="mt-1 text-sm">
              良い: <b>{healthCount7.good}</b> ／ 普通: <b>{healthCount7.normal}</b> ／ 悪い: <b>{healthCount7.bad}</b>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">（日次記録ベース）</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">今日</div>
            <div className="mt-1 text-lg">{today}</div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">JST基準</div>
          </div>
        </section>

        {/* 一覧 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">直近30日の記録</h2>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white dark:bg-gray-800 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              記録がありません
            </div>
          ) : (
            <HistoryTable rows={rows} />
          )}
        </section>
      </div>
    </main>
  );
}
