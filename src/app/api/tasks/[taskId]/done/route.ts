import { prisma } from "@/lib/prisma";

// POST /api/tasks/:taskId/done
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  await prisma.task.update({ where: { id: taskId }, data: { isDone: true } });
  return new Response(null, { status: 204 }); // ← 204で終了（リダイレクトしない）
}
