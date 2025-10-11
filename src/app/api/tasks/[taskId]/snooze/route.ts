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
