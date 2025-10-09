
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // DB接続（Prismaクライアント）

//タスク作成API
//HTTP POSTメソッドでタスクデータを受け取り、データベースに保存する。
export async function POST(request: Request) {
  try {
    // 1. リクエストボディのJSONを解析
    const body = await request.json();
    
    // 必要なデータフィールドを構造化代入で抽出
    const {
      title,
      description,
      dueDate,
      estimateMin,
      importance,
    } = body;

    // 2. バリデーションチェック (タイトルの必須チェック)
    if (!title || typeof title !== 'string' || title.trim() === '') {
      // タイトルがない場合は400エラー (Bad Request) を返す
      return NextResponse.json({ error: "Title is required and must be a non-empty string." }, { status: 400 });
    }
    
    // 3. データの整形と型変換
    // dueDateは文字列で送られてくるため、Prisma用にDateオブジェクトに変換（存在しない場合は undefined）
    const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

    // estimateMinとimportanceは数値としてパース（存在しない場合は undefined/デフォルト値3）
    const parsedEstimateMin = estimateMin !== null && estimateMin !== '' ? parseInt(estimateMin, 10) : undefined;
    const parsedImportance = importance ? parseInt(importance, 10) : 3;

    // 4. Prismaを使ってデータベースに新しいタスクを作成
    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description,
        dueDate: parsedDueDate,
        estimateMin: parsedEstimateMin,
        importance: parsedImportance,
        isDone: false, // 新規作成時は常に未完了
      },
    });

    // 5. 成功レスポンスを返す (201 Created)
    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error("Task creation failed:", error);
    
    // 6. 予期せぬエラーが発生した場合のレスポンス (500 Internal Server Error)
    return NextResponse.json(
      { error: "Internal Server Error: Failed to create task." },
      { status: 500 }
    );
  }
}