import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
    params: { taskId: string };
};


//タスクを後で処理 (POST /api/tasks/[taskId]/snooze)
//createdAt を現在時刻に更新し、優先度スコアリングをリセットする
export async function POST(request: Request, { params }: RouteContext) {
    const taskId = params.taskId;
    
    try {
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                // createdAt を現在時刻に更新
                createdAt: new Date(), 
                // isDone はそのまま (false)
            },
        });

        // 💡 優先度が変わったので、ダッシュボードとタスク一覧ページのキャッシュを再検証する
        revalidatePath('/');
        revalidatePath('/tasks');

        // 💡 処理成功後、ダッシュボードへリダイレクトする
        // status 302 (Found) を使用して一時的なリダイレクトを行う
        return NextResponse.redirect(new URL('/', request.url), { status: 302 });
        
    } catch (error: any) {
        console.error("Task SNOOZE failed:", error);
        
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}