import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache"; // revalidatePath を使用してキャッシュをクリアする

type RouteContext = {
    params: { taskId: string };
};


// タスク完了処理 (POST /api/tasks/[taskId]/done)
//  isDone を true に設定する
export async function POST(request: Request, { params }: RouteContext) {
    const taskId = params.taskId;
    
    try {
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                isDone: true,
            },
        });

        // 💡 完了処理後、ダッシュボードとタスク一覧ページのキャッシュを再検証する
        revalidatePath('/'); // ダッシュボード
        revalidatePath('/tasks'); // タスク一覧

        // 💡 処理成功後、ダッシュボードへリダイレクトする
        // status 302 (Found) を使用して一時的なリダイレクトを行う
        return NextResponse.redirect(new URL('/', request.url), { status: 302 });
        
    } catch (error: any) {
        console.error("Task DONE failed:", error);
        
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}