
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@prisma/client";

// タスクを更新するためのAPIコール (PUT /api/tasks/[id])
async function updateTask(taskId: string, taskData: Partial<Task>) {
  // 日付オブジェクトを日付文字列に変換
  const payload = {
    ...taskData,
    dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
  };

  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), 
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "タスクの更新に失敗しました。");
  }
  return await response.json(); 
}

// タスクを削除するためのAPIコール (DELETE /api/tasks/[id])
async function deleteTask(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "タスクの削除に失敗しました。");
  }
}

export default function TaskEditForm({ initialTask }: { initialTask: Task }) {
  const router = useRouter();
  const taskId = initialTask.id;
  
  // フォームの状態を初期データでセット
  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description || "");
  const [dueDate, setDueDate] = useState(initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().split('T')[0] : ""); 
  const [estimateMin, setEstimateMin] = useState(initialTask.estimateMin !== null ? String(initialTask.estimateMin) : "");
  const [importance, setImportance] = useState(initialTask.importance);
  const [isDone, setIsDone] = useState(initialTask.isDone);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 変更ボタン押下時の処理 (タスク更新)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // バリデーションチェック
    if (!title.trim()) {
      setError("タイトルは必須です。");
      setSaving(false);
      return;
    }
    if (importance < 1 || importance > 5) {
      setError("重要度は1から5の間で入力してください。");
      setSaving(false);
      return;
    }
    if (!dueDate) {
      setError("期限日は必須です。");
      setSaving(false);
      return;
    }
    
    // 送信データ
    const updatedData: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      estimateMin: estimateMin ? parseInt(estimateMin, 10) : null,
      importance: importance,
      isDone: isDone,
    };

    try {
      await updateTask(taskId, updatedData); 
      // 成功したらタスク一覧ページに戻る
      router.push("/tasks"); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  // 削除ボタン押下時の処理
  const handleDelete = async () => {
    // ⚠️ window.confirm の代わりに、カスタムモーダルUIを使用することが推奨される
    if (!confirm("本当にこのタスクを削除しますか？")) {
        return;
    }

    setSaving(true);
    setError(null);
    try {
      await deleteTask(taskId);
      // 削除成功したらタスク一覧ページに戻る
      router.push("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除中に予期せぬエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-6 bg-white shadow-xl rounded-lg p-6">
        
        <p className="text-sm text-gray-500">タスクID: {taskId}</p>
        
        {/* 1. タイトル (必須) */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
          />
        </div>

        {/* 2. 完了ステータス */}
        <div className="flex items-center">
          <input
            id="isDone"
            type="checkbox"
            checked={isDone}
            onChange={(e) => setIsDone(e.target.checked)}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="isDone" className="ml-2 block text-sm font-medium text-gray-700">
            完了済みとしてマークする
          </label>
        </div>


        {/* 3. 詳細 (任意) */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 4. 重要度 (必須) */}
          <div>
            <label htmlFor="importance" className="block text-sm font-medium text-gray-700">重要度 (1-5) <span className="text-red-500">*</span></label>
            <input
              id="importance"
              type="number"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
              min="1"
              max="5"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
            />
          </div>

          {/* 5. 期限 (必須) */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">期限日 <span className="text-red-500">*</span></label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
            />
          </div>
        </div>
        
        {/* 6. 見積もり時間 (任意) */}
        <div>
          <label htmlFor="estimateMin" className="block text-sm font-medium text-gray-700">所要時間 (分)</label>
          <input
            id="estimateMin"
            type="number"
            value={estimateMin}
            onChange={(e) => setEstimateMin(e.target.value)}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
            placeholder="例: 90"
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <p className="text-red-600 text-sm p-2 bg-red-50 rounded-md border border-red-300">
            {error}
          </p>
        )}

        {/* 変更ボタン */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
        >
          {saving ? "保存中..." : "変更を保存"}
        </button>
        
        {/* 削除ボタン */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition disabled:opacity-50 mt-4"
        >
          {saving ? "処理中..." : "このタスクを削除"}
        </button>
    </form>
  );
}