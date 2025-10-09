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
      // isDone が false (未完了) のものを asc (昇順) で先に表示
      { isDone: "asc" },      
      // 期限が近い順に asc (昇順) で表示
      { dueDate: "asc" },     
      // 重要度が高い順に desc (降順) で表示
      { importance: "desc" }, 
    ],
  });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="p-4 bg-white shadow-md flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-800">全タスク一覧</h1>
        
        {/* ダッシュボードとタスク追加へのリンク */}
        <div className="space-x-4">
            <Link 
                href="/" 
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
            >
                &larr; ダッシュボードへ
            </Link>
             <Link
                href="/tasks/new"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium"
            >
                ＋ タスク追加
            </Link>
        </div>
      </header>

      <section className="p-6 max-w-4xl mx-auto">
        {tasks.length === 0 ? (
          // タスクがない場合の表示
          <div className="text-center p-12 bg-white rounded-xl shadow-lg mt-8">
            <p className="text-xl text-gray-500 mb-4">まだタスクがありません！</p>
            <Link 
              href="/tasks/new" 
              className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition"
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