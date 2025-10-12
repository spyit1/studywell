import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------- GET /api/tasks/:taskId ----------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }   // ← Promiseで受ける
) {
  const { taskId } = await params;                       // ← await が必須

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    console.error("GET Task failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------- PUT /api/tasks/:taskId ----------
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }    // ← Promiseで受ける
) {
  const { taskId } = await params;                       // ← await が必須

  try {
    const body = await request.json().catch(() => ({} as any));
    const {
      title,
      description,
      dueDate,
      estimateMin,
      importance,
      isDone,
    } = body;

    // 入力バリデーション（サーバ側も最低限）
    if (typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const parsedDueDate =
      dueDate ? new Date(dueDate) : null;

    const parsedEstimateMin =
      estimateMin === null || estimateMin === undefined || estimateMin === ""
        ? null
        : Number.isFinite(Number(estimateMin))
          ? Number(estimateMin)
          : null;

    const parsedImportance = Number(importance);
    if (!Number.isFinite(parsedImportance) || parsedImportance < 1 || parsedImportance > 5) {
      return NextResponse.json({ error: "Importance must be 1..5." }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        description: typeof description === "string" ? description : null,
        dueDate: parsedDueDate,
        estimateMin: parsedEstimateMin,
        importance: parsedImportance,
        isDone: Boolean(isDone),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("PUT Task failed:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------- DELETE /api/tasks/:taskId ----------
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }    // ← Promiseで受ける
) {
  const { taskId } = await params;                       // ← await が必須

  try {
    await prisma.task.delete({ where: { id: taskId } });
    // 204はボディなしなので NextResponse.json は使わない
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error("DELETE Task failed:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
