// app/history/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { jstDayToUtcMidnight, getJstTodayStr } from "@/lib/time";

export const runtime = "nodejs";
export const revalidate = 0;

type HealthCondInt = 1 | 2 | 3; // 悪い=1, 普通=2, 良い=3

function conditionLabelFromInt(c?: number | null) {
  if (c === 3) return "良い";
  if (c === 2) return "普通";
  if (c === 1) return "悪い";
  return "—";
}

function moodEmojiFromInt(m?: number | null) {
  if (m === 5) return "😄";
  if (m === 4) return "🙂";
  if (m === 3) return "😐";
  if (m === 2) return "😕";
  if (m === 1) return "😞";
  return "—";
}

function fmtDateJST(d: Date) {
  // 表示はJST。ここではローカルでOK
  return new Date(d).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default async function HistoryPage() {
  // 直近30日の体調（dailyHealth）と直近100件の気分（moodLog）を取得
  const today = getJstTodayStr();
  const from30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fromKey = jstDayToUtcMidnight(from30.toISOString().slice(0, 10));

  const [health, moods] = await Promise.all([
    prisma.dailyHealth.findMany({
      where: { date: { gte: fromKey } },
      orderBy: { date: "desc" },
      select: { date: true, condition: true, note: true },
    }),
    prisma.moodLog.findMany({
      orderBy: { at: "desc" }, // createdAt を使っているなら置き換え
      take: 100,
      select: { at: true, mood: true, note: true },
    }),
  ]);

  // サマリーのために直近7日を抽出
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const health7 = health.filter(h => h.date >= jstDayToUtcMidnight(sevenDaysAgo.toISOString().slice(0,10)));
  const moods7 = moods.filter(m => m.at >= sevenDaysAgo);

  const avgMood7 = avg(moods7.map(m => m.mood)).toFixed(2);
  const healthCount7 = {
    good: health7.filter(h => h.condition === 3).length,
    normal: health7.filter(h => h.condition === 2).length,
    bad: health7.filter(h => h.condition === 1).length,
  };

  // 日付ごと（JST日単位）にマージした一覧（直近30日分）
  // key: YYYY-MM-DD, 値: { health?: 1|2|3, moods: number[] }
  const byDay = new Map<string, { health?: HealthCondInt; moods: number[] }>();
  // 体調
  for (const h of health) {
    const key = new Date(h.date.getTime() + 9 * 3600_000).toISOString().slice(0, 10); // JST日付
    byDay.set(key, { ...(byDay.get(key) ?? { moods: [] }), health: h.condition as HealthCondInt });
  }
  // 気分（同日の複数記録は配列）
  for (const m of moods) {
    const key = new Date(m.at.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { moods: [] };
    cur.moods.push(m.mood);
    byDay.set(key, cur);
  }
  // 表示用に降順ソート
  const rows = Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">履歴</h1>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50">Dashboard</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* サマリー */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="text-sm text-gray-500">直近7日の平均気分</div>
            <div className="mt-1 text-2xl font-bold">{avgMood7}</div>
            <div className="mt-1 text-xs text-gray-500">（1〜5｜😞1 〜 😄5）</div>
          </div>
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="text-sm text-gray-500">直近7日の体調内訳</div>
            <div className="mt-1 text-sm">
              良い: <b>{healthCount7.good}</b> ／ 普通: <b>{healthCount7.normal}</b> ／ 悪い: <b>{healthCount7.bad}</b>
            </div>
            <div className="mt-1 text-xs text-gray-500">（日次記録ベース）</div>
          </div>
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="text-sm text-gray-500">今日</div>
            <div className="mt-1 text-lg">{today}</div>
            <div className="mt-1 text-xs text-gray-500">JST基準</div>
          </div>
        </section>

        {/* 一覧テーブル */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">直近30日の記録</h2>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
              記録がありません
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left">日付</th>
                    <th className="px-4 py-2 text-left">体調</th>
                    <th className="px-4 py-2 text-left">気分（複数可）</th>
                    <th className="px-4 py-2 text-left">平均気分</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([dateStr, v]) => {
                    const avgMood = v.moods.length ? avg(v.moods).toFixed(2) : "—";
                    const moodEmojis = v.moods.length ? v.moods.map(moodEmojiFromInt).join(" ") : "—";
                    return (
                      <tr key={dateStr} className="border-t">
                        <td className="px-4 py-2">{dateStr}</td>
                        <td className="px-4 py-2">{conditionLabelFromInt(v.health)}</td>
                        <td className="px-4 py-2">{moodEmojis}</td>
                        <td className="px-4 py-2">{avgMood}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
