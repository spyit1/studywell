// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

export default async function DashboardPage() {
  // 未完了タスクから、重要度の高い順・期限の近い順で上位3件
  const topTasks = await prisma.task.findMany({
    where: { isDone: false },
    orderBy: [
      { importance: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      title: true,
      importance: true,
      dueDate: true,
    },
    take: 3,
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* ヘッダー */}
      <header className="p-4 bg-white shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold">StudyWell Dashboard</h1>

        {/* タスク追加ボタン（右上） */}
        <Link
          href="/tasks/new"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          ＋ タスク追加
        </Link>
      </header>

      {/* メインセクション */}
      <section className="p-6">
        {/* タスク一覧ボタン */}
        <div className="mb-8">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            タスク一覧へ →
          </Link>
        </div>

        {/* 今日のおすすめタスク */}
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
                  重要度: {task.importance} / 期限:{" "}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("ja-JP")
                    : "なし"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
