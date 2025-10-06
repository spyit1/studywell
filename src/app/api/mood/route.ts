import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** 絵文字や文字列→数値 (😄=5…😞=1) */
function normalizeMood(input: unknown): number | null {
  if (typeof input === "number") {
    return input >= 1 && input <= 5 ? input : null;
  }
  if (typeof input === "string") {
    const map: Record<string, number> = {
      "😄": 5, "🙂": 4, "😐": 3, "😕": 2, "😞": 1,
      very_good: 5, good: 4, neutral: 3, bad: 2, very_bad: 1,
    };
    return map[input] ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { mood?: unknown; note?: string };
    const moodVal = normalizeMood(body.mood);
    if (!moodVal) {
      return NextResponse.json({ error: "invalid mood" }, { status: 400 });
    }

    const created = await prisma.moodLog.create({
      data: {
        mood: moodVal,
        ...(body.note ? { note: body.note } : {}), // ← note があればだけセット
        // at / createdAt は Prisma 側で default(now())
      },
      select: { id: true, mood: true, at: true },
    });

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    console.error("[/api/mood] error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
