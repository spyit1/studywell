// タスク追加画面
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// データベースに保存するための実際の API コール
async function createTask(taskData: {
  title: string;
  description: string;
  dueDate: Date | null;
  estimateMin: number | null;
  importance: number;
}) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "タスクの登録に失敗しました。");
  }

  return await response.json();
}

export default function NewTaskPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // yyyy-mm-dd
  const [estimateMin, setEstimateMin] = useState<string>("");
  const [importance, setImportance] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!title.trim()) {
      setError("タイトルは必須です。");
      setLoading(false);
      return;
    }
    if (importance < 1 || importance > 5) {
      setError("重要度は1から5の間で入力してください。");
      setLoading(false);
      return;
    }
    if (!dueDate) {
      setError("期限日を入力してください。");
      setLoading(false);
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      estimateMin: estimateMin ? parseInt(estimateMin, 10) : null,
      importance,
    };

    try {
      await createTask(taskData);
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // 入力の共通クラス（ダーク対応）
  const inputCls =
    "mt-1 block w-full rounded-md border p-2 shadow-sm " +
    "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 " +
    "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700";

  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">タスクを追加</h1>
        <Link
          href="/tasks"
          className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 text-sm"
        >
          &larr; タスク一覧へ
        </Link>
      </header>

      <section className="p-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* 1. タイトル (必須) */}
          <div>
            <label htmlFor="title" className={labelCls}>
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputCls}
              placeholder="例: Next.jsの学習を2時間"
            />
          </div>

          {/* 2. 詳細 (任意) */}
          <div>
            <label htmlFor="description" className={labelCls}>詳細</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="具体的な手順や目的を記述"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 3. 重要度 (必須) */}
            <div>
              <label htmlFor="importance" className={labelCls}>重要度 (1-5)</label>
              <input
                id="importance"
                type="number"
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value))}
                min={1}
                max={5}
                required
                className={inputCls}
              />
            </div>

            {/* 4. 期限 (必須) */}
            <div>
              <label htmlFor="dueDate" className={labelCls}>期限日</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
          </div>

          {/* 5. 見積もり時間 (任意) */}
          <div>
            <label htmlFor="estimateMin" className={labelCls}>所要時間 (分)</label>
            <input
              id="estimateMin"
              type="number"
              value={estimateMin}
              onChange={(e) => setEstimateMin(e.target.value)}
              min={1}
              className={inputCls}
              placeholder="例: 90"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <p className="text-red-600 dark:text-red-300 text-sm p-2 bg-red-50 dark:bg-red-900/30 rounded-md border border-red-300 dark:border-red-700">
              {error}
            </p>
          )}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-md shadow-lg text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            {loading ? "保存中..." : "タスクを登録"}
          </button>
        </form>
      </section>
    </main>
  );
}
