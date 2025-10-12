"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@prisma/client";

// API helpers（変更なし）
async function updateTask(taskId: string, taskData: Partial<Task>) {
  const payload = {
    ...taskData,
    dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
  };
  const res = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "タスクの更新に失敗しました。");
  }
  return res.json();
}
async function deleteTask(taskId: string) {
  const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "タスクの削除に失敗しました。");
  }
}

export default function TaskEditForm({ initialTask }: { initialTask: Task }) {
  const router = useRouter();
  const taskId = initialTask.id;

  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description || "");
  const [dueDate, setDueDate] = useState(
    initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().split("T")[0] : ""
  );
  const [estimateMin, setEstimateMin] = useState(
    initialTask.estimateMin !== null ? String(initialTask.estimateMin) : ""
  );
  const [importance, setImportance] = useState(initialTask.importance);
  const [isDone, setIsDone] = useState(initialTask.isDone);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!title.trim()) return setError("タイトルは必須です。"), setSaving(false);
    if (importance < 1 || importance > 5)
      return setError("重要度は1から5の間で入力してください。"), setSaving(false);
    if (!dueDate) return setError("期限日は必須です。"), setSaving(false);

    const updatedData: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      estimateMin: estimateMin ? parseInt(estimateMin, 10) : null,
      importance,
      isDone,
    };

    try {
      await updateTask(taskId, updatedData);
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当にこのタスクを削除しますか？")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTask(taskId);
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除中に予期せぬエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  // 共通クラス：フォームコントロール
  const ctrl =
    "mt-1 block w-full rounded-md border shadow-sm p-2 " +
    // light
    "bg-white text-gray-900 border-gray-300 placeholder-gray-400 " +
    "focus:border-emerald-500 focus:ring-emerald-500 " +
    // dark
    "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-400 " +
    "dark:focus:ring-emerald-500 dark:focus:border-emerald-500 " +
    // ring offset（ダークでグローが沈まないように）
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white " +
    "dark:focus:ring-offset-gray-900";

  return (
    <form
      onSubmit={handleUpdate}
      className="
        space-y-6 rounded-lg p-6 shadow-xl
        bg-white text-gray-900
        dark:bg-gray-800 dark:text-gray-100 dark:shadow-none
      "
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">タスクID: {taskId}</p>

      {/* タイトル */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={ctrl}
          placeholder="Next.jsの勉強"
        />
      </div>

      {/* 完了 */}
      <div className="flex items-center">
        <input
          id="isDone"
          type="checkbox"
          checked={isDone}
          onChange={(e) => setIsDone(e.target.checked)}
          className="
            h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500
            dark:border-gray-600
          "
        />
        <label htmlFor="isDone" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          完了済みとしてマークする
        </label>
      </div>

      {/* 詳細 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          詳細
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={ctrl}
          placeholder="ウェブアプリの作成"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 重要度 */}
        <div>
          <label htmlFor="importance" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            重要度 (1-5) <span className="text-red-500">*</span>
          </label>
          <input
            id="importance"
            type="number"
            value={importance}
            onChange={(e) => setImportance(parseInt(e.target.value))}
            min={1}
            max={5}
            required
            className={ctrl}
          />
        </div>

        {/* 期限 */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            期限日 <span className="text-red-500">*</span>
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className={`${ctrl} dark:[color-scheme:dark]`} // ← ネイティブ日付ピッカーもダーク化
          />
        </div>
      </div>

      {/* 見積もり */}
      <div>
        <label htmlFor="estimateMin" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          所要時間 (分)
        </label>
        <input
          id="estimateMin"
          type="number"
          value={estimateMin}
          onChange={(e) => setEstimateMin(e.target.value)}
          min={1}
          className={ctrl}
          placeholder="例: 90"
        />
      </div>

      {/* エラー */}
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-950/40 rounded-md border border-red-300 dark:border-red-800">
          {error}
        </p>
      )}

      {/* 保存 */}
      <button
        type="submit"
        disabled={saving}
        className="
          w-full py-3 px-4 rounded-md text-lg font-medium text-white transition
          bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white
          disabled:opacity-50
          dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-offset-gray-900
        "
      >
        {saving ? "保存中..." : "変更を保存"}
      </button>

      {/* 削除 */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={saving}
        className="
          w-full py-3 px-4 rounded-md text-lg font-medium text-white transition mt-4
          bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white
          disabled:opacity-50
          dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-offset-gray-900
        "
      >
        {saving ? "処理中..." : "このタスクを削除"}
      </button>
    </form>
  );
}
