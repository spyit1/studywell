// タスク表示のコンポーネント
import { Task } from "@prisma/client"; 
import Link from "next/link";

const TaskItem = ({ task }: { task: Task }) => {
  // 重要度に応じて左側のボーダーの色を変える
  // 3: default, 4 or 5: high, 1 or 2: low 
  const urgencyColor = task.importance >= 4 ? "border-red-500" : task.importance >= 2 ? "border-yellow-500" : "border-gray-300";
  
  // 完了したタスクのスタイル（薄くして、打ち消し線を入れる）
  const doneStyle = task.isDone 
    ? "opacity-60 line-through bg-green-50 shadow-inner" 
    : "bg-white hover:shadow-lg";

  return (
    // タスクをクリックしたら詳細ページへ遷移 (例: /tasks/cuid123)
    <Link 
      href={`/tasks/${task.id}`} 
      className={`block p-4 border-l-8 ${urgencyColor} rounded-xl shadow transition duration-200 ease-in-out ${doneStyle}`}
    >
      <div className="flex justify-between items-start">
        <h2 className={`text-xl font-semibold ${task.isDone ? 'text-gray-500' : 'text-gray-800'}`}>
          {task.title}
        </h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${task.isDone ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
          {task.isDone ? "✅ 完了" : "⏳ 未完了"}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        期限: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ja-JP") : "なし"}
        <span className="ml-4">重要度: {task.importance}</span>
      </p>
    </Link>
  );
};

export default TaskItem;