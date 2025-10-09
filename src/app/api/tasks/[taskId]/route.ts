
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// タスクIDの型定義
type RouteContext = {
    params: { taskId: string };
};

// ==========================================================
// 1. タスク取得 (GET /api/tasks/[taskId])
// ==========================================================
export async function GET(
    request: Request, 
    { params }: { params: { taskId: string } } 
) {
    const taskId = params.taskId;

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            // タスクが見つからない場合は 404 Not Found
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        return NextResponse.json(task, { status: 200 });
    } catch (error) {
        console.error("GET Task failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


// ==========================================================
// 2. タスク更新 (PUT /api/tasks/[taskId])
// ==========================================================
export async function PUT(
    request: Request, 
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;

    try {
        const body = await request.json();
        const {
            title,
            description,
            dueDate,
            estimateMin,
            importance,
            isDone, // 完了ステータスの更新も可能にする
        } = body;
        
        // 簡易バリデーション (クライアント側でしっかりやるが、サーバー側でも確認)
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return NextResponse.json({ error: "Title is required." }, { status: 400 });
        }
        
        // データの整形
        const parsedDueDate = dueDate ? new Date(dueDate) : null;
        const parsedEstimateMin = estimateMin !== null && estimateMin !== '' ? parseInt(estimateMin, 10) : null;
        const parsedImportance = importance ? parseInt(importance, 10) : 3;

        // DB更新
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: title.trim(),
                description: description,
                dueDate: parsedDueDate,
                estimateMin: parsedEstimateMin,
                importance: parsedImportance,
                isDone: isDone,
            },
        });

        return NextResponse.json(updatedTask, { status: 200 });
    } catch (error: any) {
        console.error("PUT Task failed:", error);
        // IDが見つからなかった場合の Prisma エラーコード P2025 をチェック
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


// ==========================================================
// 3. タスク削除 (DELETE /api/tasks/[taskId])
// ==========================================================
export async function DELETE(
    request: Request, 
    { params }: { params: { taskId: string } }
) {
    const taskId = params.taskId;
    
    try {
        await prisma.task.delete({
            where: { id: taskId },
        });
        
        // 削除成功時は 204 No Content を返すのが一般的
        return new NextResponse(null, { status: 204 }); 
    } catch (error: any) {
        console.error("DELETE Task failed:", error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}