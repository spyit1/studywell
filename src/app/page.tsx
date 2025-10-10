// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { jstDayToUtcMidnight } from "@/lib/time";
import { healthCoefFromInt, moodCoef, dueCoef } from "@/lib/score";

import WeatherCard from "@/components/WeatherCard";

// クライアントのポップアップ
import HealthPrompt from "@/components/HealthPrompts";
import MoodPrompt from "@/components/MoodPrompt";

export const runtime = "nodejs";
export const revalidate = 0;

/* ---------- 小さなUI/表示ユーティリティ ---------- */

function conditionLabelFromInt(c?: number | null) {
  if (c === 3) return "良い";
  if (c === 2) return "普通";
  if (c === 1) return "悪い";
  return "未入力";
}

function moodEmojiFromInt(m?: number | null) {
  if (m === 5) return "😄";
  if (m === 4) return "🙂";
  if (m === 3) return "😐";
  if (m === 2) return "😕";
  if (m === 1) return "😞";
  return "—";
}

function importanceStars(n: number) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

function dueBadge(due?: Date | null) {
  if (!due) return { text: "期限なし", className: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200" };
  const h = (due.getTime() - Date.now()) / 36e5;
  if (h < 0) return { text: "期限超過", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" };
  if (h <= 24) return { text: "今日まで", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200" };
  if (h <= 72) return { text: "3日以内", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" };
  return { text: "余裕あり", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" };
}

function humanizeDue(due?: Date | null) {
  if (!due) return "—";
  const ms = due.getTime() - Date.now();
  const h = Math.round(ms / 36e5);
  if (h < 0) return `過ぎて${Math.abs(h)}時間`;
  if (h === 0) return "〜1時間";
  if (h < 24) return `あと${h}時間`;
  const d = Math.round(h / 24);
  return `あと${d}日`;
}

/* -------------------------------------------------- */

export default async function DashboardPage() {
  // 体調・気分を取得
  const todayKey = jstDayToUtcMidnight(new Date().toISOString().slice(0, 10));

  const [todayHealth, latestMood, baseTasks] = await Promise.all([
    prisma.dailyHealth.findUnique({ where: { date: todayKey }, select: { condition: true } }),
    prisma.moodLog.findFirst({ orderBy: { at: "desc" }, select: { mood: true } }),
    prisma.task.findMany({
      where: { isDone: false },
      select: { id: true, title: true, importance: true, dueDate: true, createdAt: true },
    }),
  ]);

  // 係数
  const hCoef = healthCoefFromInt(todayHealth?.condition);
  const mCoef = moodCoef(latestMood?.mood);

  // スコア計算
  const scored = baseTasks
    .map((t) => {
      const dCoef = dueCoef(t.dueDate);
      const score = t.importance * hCoef * mCoef * dCoef;
      return {
        ...t,
        score,
        _coef: { h: hCoef, m: mCoef, d: dCoef },
      };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 6); // 表示数を少し増やす

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* ポップアップ（モーダル） */}
      <HealthPrompt />
      <MoodPrompt />

      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/70 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">StudyWell Dashboard</h1>
          <nav className="flex items-center gap-2">
            <Link
              href="/tasks/new"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700"
            >
              ＋ タスク追加
            </Link>
            <Link
              href="/tasks"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              タスク一覧
            </Link>
            <Link
              href="/history"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              気分・体調の履歴
            </Link>
            {/* ← 追加：設定ページへ */}
            <Link
              href="/settings"
              className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              設定
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* ステータスサマリー */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">今日の体調</div>
            <div className="mt-1 text-lg font-semibold">
              {conditionLabelFromInt(todayHealth?.condition)}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              係数: {hCoef.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">現在の気分</div>
            <div className="mt-1 text-lg font-semibold">
              {moodEmojiFromInt(latestMood?.mood)}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              係数: {mCoef.toFixed(2)}
            </div>
          </div>
          <WeatherCard />
        </section>

        {/* おすすめタスク */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">今日のおすすめ</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{top.length}件</span>
          </div>

          {top.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white dark:bg-gray-800 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              未完了のタスクはありません 🎉
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {top.map((t, idx) => {
                const badge = dueBadge(t.dueDate);
                const scoreTip = `詳細:
- 重要度: ${t.importance}
- 体調係数: ${t._coef.h.toFixed(2)}
- 気分係数: ${t._coef.m.toFixed(2)}
- 期限係数: ${t._coef.d.toFixed(2)}
= スコア: ${t.score.toFixed(2)}`;

                const isTop = idx === 0; // ← 最優先（先頭1件）

                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl shadow hover:shadow-md transition border
                                ${isTop ? "" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}
                    style={isTop ? { background: "var(--highlight-bg)", borderColor: "rgba(0,0,0,0.08)" } : undefined}
                    title={isTop ? "最優先タスク（設定で色を変更できます）" : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold leading-tight">{t.title}</h3>
                      <span
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700/60"
                        title={scoreTip}
                      >
                        {t.score.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`text-xs rounded-full px-2 py-1 font-medium ${badge.className}`}>
                        {badge.text}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t.dueDate ? humanizeDue(t.dueDate) : "—"}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      重要度：<span title={`${t.importance}/5`}>{importanceStars(t.importance)}</span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <form action={`/api/tasks/${t.id}/done`} method="post">
                        <button className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700">
                          完了
                        </button>
                      </form>
                      <form action={`/api/tasks/${t.id}/snooze`} method="post">
                        <button className="px-3 py-1 rounded-xl bg-gray-800 text-white text-sm hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600">
                          後で
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
