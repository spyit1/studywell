import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_DAYS = 1;
const MAX_DAYS = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params; // ← ここがポイント

  try {
    const body = await request.json().catch(() => ({} as any));
    let days = Number(body?.days);
    if (!Number.isFinite(days) || days < 1) days = DEFAULT_DAYS;
    days = Math.min(MAX_DAYS, days);

    const t = await prisma.task.findUnique({
      where: { id: taskId },
      select: { dueDate: true },
    });
    if (!t) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const base = t.dueDate ?? new Date();
    const nextDueDate = new Date(base.getTime() + days * 24 * 3600 * 1000);

    await prisma.task.update({
      where: { id: taskId },
      data: { dueDate: nextDueDate },
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  } catch (error: any) {
    console.error("Task SNOOZE (dueDate) failed:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
