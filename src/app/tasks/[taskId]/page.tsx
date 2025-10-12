// ✅ 修正後
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TaskEditForm from "./TaskEditForm";

export default async function EditTaskPage(
  { params }: { params: Promise<{ taskId: string }> }   // ← Promiseで受ける
) {
  const { taskId } = await params;                       // ← ここでawait

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-6">
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-300 mb-4">エラー</h1>
          <p className="text-red-700 dark:text-red-300">指定されたタスクは見つかりませんでした。</p>
          <Link href="/tasks" className="mt-4 inline-flex rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700">
            &larr; タスク一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">タスク編集・詳細</h1>
        <Link href="/tasks" className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 text-sm">
          &larr; タスク一覧へ
        </Link>
      </header>
      <section className="p-6 max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
          <TaskEditForm initialTask={task} />
        </div>
      </section>
    </main>
  );
}
