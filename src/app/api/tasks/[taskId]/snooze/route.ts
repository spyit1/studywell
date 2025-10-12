
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 期限延長の日数に関する定数
const DEFAULT_DAYS = 1;
const MAX_DAYS = 30;

// 動的ルートパラメータの型定義
type RouteContext = {
    params: { taskId: string };
};

// POST /api/tasks/[taskId]/snooze (タスクを後で処理し、期限を延長する)
export async function POST(request: Request, { params }: RouteContext) {
    const taskId = params.taskId;

    try {
        // 1. リクエストボディから延長日数 (days) を読み込む
        // Next.jsのRequestオブジェクトからbodyを読み込む
        const body = await request.json().catch(() => ({} as any));
        let days = Number(body?.days);
        
        // 値のバリデーションと制限
        if (!Number.isFinite(days) || days < 1) {
            days = DEFAULT_DAYS;
        }
        days = Math.min(MAX_DAYS, days); // 30日を上限とする

        // 2. 現在のタスクを取得（期限日計算の基準とするため）
        const existingTask = await prisma.task.findUnique({ 
            where: { id: taskId },
            select: { dueDate: true } // dueDateだけあればOK
        });

        if (!existingTask) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // 3. 新しい期限日を計算
        // 基準日: 既存のdueDate、なければ現在時刻
        const base = existingTask.dueDate ?? new Date();
        // 新しい期限日: 基準日 + days日
        const nextDueDate = new Date(base.getTime() + days * 24 * 3600 * 1000);

        // 4. タスクを更新 (dueDateのみ更新)
        await prisma.task.update({
            where: { id: taskId },
            data: {
                dueDate: nextDueDate, 
                // createdAtは更新しない (createdAt更新は優先度リセットのロジック)
            },
        });

        // 5. 画面に即時反映させるためのキャッシュ再検証
        // 💡 期限日が変わったので、関連ページのキャッシュを再検証する
        revalidatePath('/');
        revalidatePath('/tasks');

        // 6. 成功後、ダッシュボードへリダイレクト
        // status 302 (Found) を使用して一時的なリダイレクトを行う
        // クライアント側でfetchを行う場合、リダイレクト先へ自動的に遷移する
        return NextResponse.redirect(new URL('/', request.url), { status: 302 });
        
    } catch (error: any) {
        console.error("Task SNOOZE (dueDate) failed:", error);
        
        // Prismaのエラーハンドリング (タスクが見つからなかった場合など)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/*
// app/api/tasks/[taskId]/snooze/route.ts
import { prisma } from "@/lib/prisma";

const DEFAULT_DAYS = 1;
const MAX_DAYS = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // body.days を読む（なければデフォルト）
  const body = await req.json().catch(() => ({} as any));
  let days = Number(body?.days);
  if (!Number.isFinite(days)) days = DEFAULT_DAYS;
  days = Math.min(MAX_DAYS, Math.max(1, days));

  const t = await prisma.task.findUnique({ where: { id: taskId } });
  if (!t) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const base = t.dueDate ?? new Date();
  const next = new Date(base.getTime() + days * 24 * 3600 * 1000);

  await prisma.task.update({ where: { id: taskId }, data: { dueDate: next } });

  return new Response(null, { status: 204 });
}
*/