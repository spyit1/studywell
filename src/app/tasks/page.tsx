// タスク一覧表示
import Link from "next/link";
import { prisma } from "@/lib/prisma"; // DB接続
import TaskItem from "@/components/TaskItem";

// キャッシュを無効化して、常に最新のデータを表示
export const revalidate = 0;

export default async function TasksPage() {
  // 1. 全タスクを並び替えルールに従って取得
  const tasks = await prisma.task.findMany({
    orderBy: [
      { isDone: "asc" },      // 未完了を先に
      { dueDate: "asc" },     // 締切が近い順
      { importance: "desc" }, // 重要度が高い順
    ],
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="p-4 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold">全タスク一覧</h1>

        {/* ダッシュボードとタスク追加へのリンク */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 text-sm"
          >
            &larr; ダッシュボードへ
          </Link>
          <Link
            href="/tasks/new"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700 text-sm"
          >
            ＋ タスク追加
          </Link>
        </div>
      </header>

      <section className="p-6 max-w-4xl mx-auto">
        {tasks.length === 0 ? (
          // タスクがない場合の表示
          <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-8 border border-gray-200 dark:border-gray-700">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4">まだタスクがありません！</p>
            <Link
              href="/tasks/new"
              className="inline-flex items-center justify-center px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition"
            >
              最初のタスクを追加する
            </Link>
          </div>
        ) : (
          // タスクがある場合は TaskItem を使って一覧表示
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
