// タスク追加画面
"use client"; // フォーム操作のためクライアントコンポーネントに切り替え

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Linkコンポーネントの追加

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
    headers: {
      "Content-Type": "application/json",
    },
    // 日付オブジェクトはJSONにすると文字列になる（API側でDateに変換される）
    body: JSON.stringify(taskData), 
  });

  if (!response.ok) {
    // APIからのエラーレスポンスを解析してエラーメッセージを取得
    const errorData = await response.json();
    throw new Error(errorData.error || "タスクの登録に失敗しました。");
  }

  // 成功したら、作成されたタスクデータ（newTask）を返す
  return await response.json(); 
}


export default function NewTaskPage() {
  const router = useRouter();
  
  // フォームの入力状態を管理
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(""); // HTMLのinput type="date"に合わせる
  const [estimateMin, setEstimateMin] = useState<string>("");
  const [importance, setImportance] = useState(3); // デフォルト値は3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 入力値のバリデーション
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
    if (!dueDate){
      setError("期限日を入力してください。");
      setLoading(false);
      return;
    }

    // データの整形
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      // dueDate が空文字列でなければ Date オブジェクトに変換
      dueDate: dueDate ? new Date(dueDate) : null,
      // estimateMin が空でなければ数値に変換、空なら null
      estimateMin: estimateMin ? parseInt(estimateMin, 10) : null,
      importance: importance,
    };

    try {
      // サーバーにデータを送信（APIルート経由）
      await createTask(taskData); 

      // 成功したらタスク一覧ページに戻る
      router.push("/tasks"); 
    } catch (err) {
      // エラーメッセージを表示
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold">タスクを追加</h1>
        <Link 
          href="/tasks"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          &larr; タスク一覧へ
        </Link>
      </header>

      <section className="p-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-xl rounded-lg p-6">
          
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
              placeholder="例: Next.jsの学習を2時間"
            />
          </div>

          {/* 2. 詳細 (任意) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">詳細</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2 border"
              placeholder="具体的な手順や目的を記述"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 3. 重要度 (必須) */}
            <div>
              <label htmlFor="importance" className="block text-sm font-medium text-gray-700">重要度 (1-5)</label>
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

            {/* 4. 期限 (必須) */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">期限日</label>
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
          
          {/* 5. 見積もり時間 (任意) */}
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

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-lg text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
          >
            {loading ? "保存中..." : "タスクを登録"}
          </button>
        </form>
      </section>
    </main>
  );
}