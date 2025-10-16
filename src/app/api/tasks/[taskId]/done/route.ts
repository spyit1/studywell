import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params; // ← ここがポイント

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { isDone: true },
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    // （fetchで呼ぶなら .json() しないこと。リダイレクトを使うなら本文は空です）
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  } catch (error: any) {
    console.error("Task DONE failed:", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
