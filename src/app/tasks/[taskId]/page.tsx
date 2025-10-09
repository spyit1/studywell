// タスク詳細

import { prisma } from "@/lib/prisma"; // サーバー側でPrismaを使用
import Link from "next/link";
import TaskEditForm from "./TaskEditForm"; // フォームロジックを分離したクライアントコンポーネント

// ==========================================================
// サーバーコンポーネント: データ取得とレンダリングを担う
// ==========================================================
export default async function EditTaskPage({ params }: { params: { taskId: string } }) {
  const taskId = params.taskId; // 💡 サーバーコンポーネントなので、このアクセス方法で警告は出ない

  let taskData = null;
  let error = null;

  try {
    // 1. サーバー側でPrismaを使って直接タスクを取得
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      error = "指定されたタスクは見つかりませんでした。";
    } else {
      taskData = task;
    }
  } catch (e) {
    console.error("Task fetching error:", e);
    error = "タスクの読み込み中にサーバーエラーが発生しました。";
  }

  // エラー/未発見の表示
  if (error || !taskData) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
        <div className="max-w-lg mx-auto bg-white shadow-xl rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
            <p className="text-red-600">{error}</p>
            <Link href="/tasks" className="text-blue-600 hover:underline mt-4 block">
                &larr; タスク一覧に戻る
            </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">タスク編集・詳細</h1>
        <Link 
          href="/tasks"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          &larr; タスク一覧へ
        </Link>
      </header>

      <section className="p-6 max-w-lg mx-auto">
        {/* クライアントコンポーネントにデータを渡す */}
        <TaskEditForm initialTask={taskData} />
      </section>
    </main>
  );
}