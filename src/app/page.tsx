// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { jstDayToUtcMidnight } from "@/lib/time";
import { healthCoefFromInt, moodCoef, dueCoef } from "@/lib/score";

// 👇 クライアント側のポップアップ（そのまま使用OK）
import HealthPrompt from "@/components/HealthPrompts";
import MoodPrompt from "@/components/MoodPrompt";

export const runtime = "nodejs";
export const revalidate = 0;

export default async function DashboardPage() {
  // ===== 今日の体調・気分を取得 =====
  const todayKey = jstDayToUtcMidnight(new Date().toISOString().slice(0, 10));

  // 今日の体調（dailyHealth）
  const todayHealth = await prisma.dailyHealth.findUnique({
    where: { date: todayKey },
    select: { condition: true }, // 1〜3 (悪1, 普2, 良3)
  });

  // 最新の気分（moodLog）
  const latestMood = await prisma.moodLog.findFirst({
    orderBy: { at: "desc" }, // createdAt の場合はここ変更
    select: { mood: true }, // 1〜5 (😞1〜😄5)
  });

  // ===== タスク取得 =====
  const baseTasks = await prisma.task.findMany({
    where: { isDone: false },
    select: {
      id: true,
      title: true,
      importance: true,
      dueDate: true,
    },
  });

  // ===== スコア算出 =====
  const hCoef = healthCoefFromInt(todayHealth?.condition);
  const mCoef = moodCoef(latestMood?.mood);

  const tasks = baseTasks
    .map((t) => {
      const score = t.importance * hCoef * mCoef * dueCoef(t.dueDate);
      return { ...t, score };
    })
    .sort((a, b) => b.score - a.score);

  const topTasks = tasks.slice(0, 3); // 上位3件だけ表示

  // ===== 画面描画 =====
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* ===== ポップアップ（ページ最上位でOK） ===== */}
      <HealthPrompt />
      <MoodPrompt />

      {/* ===== ヘッダー ===== */}
      <header className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold">StudyWell Dashboard</h1>

        {/* タスク追加ボタン */}
        <Link
          href="/tasks/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          ＋ タスク追加
        </Link>
      </header>

      {/* ===== メイン ===== */}
      <section className="p-6">
        {/* タスク一覧へ */}
        <div className="mb-8">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            タスク一覧へ →
          </Link>
        </div>

        {/* ===== 今日のおすすめ ===== */}
        <h2 className="text-xl font-semibold mb-3">今日のおすすめ</h2>

        {topTasks.length === 0 ? (
          <p className="text-gray-500">未完了のタスクはありません 🎉</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-2xl shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  重要度: {task.importance}　
                  期限:{" "}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("ja-JP")
                    : "なし"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  スコア: {task.score.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
