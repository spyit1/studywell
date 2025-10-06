import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** "YYYY-MM-DD" (JST日付) → JST 00:00 の瞬間を表す Date(UTC) に正規化 */
function jstDayToUtcMidnight(dayJst?: string): Date {
  // dayJst 無指定なら「今日(JST)」
  const now = new Date();
  const nowJstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const nowJst = new Date(nowJstMs);

  let y = nowJst.getUTCFullYear();
  let m = nowJst.getUTCMonth();
  let d = nowJst.getUTCDate();

  if (dayJst) {
    const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayJst);
    if (!m2) throw new Error("invalid dayJst format");
    y = Number(m2[1]);
    m = Number(m2[2]) - 1;
    d = Number(m2[3]);
  }

  // JST 00:00 のUTC瞬間 = Date.UTC(y,m,d,0:00 JST) から 9時間引く
  const jstMidnightUtcMs = Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(jstMidnightUtcMs);
}

/** 文字列→数値 (良い=3, 普通=2, 悪い=1) */
function normalizeCondition(input: unknown): number | null {
  if (typeof input === "number") {
    if (input >= 1 && input <= 3) return input;
    return null;
  }
  if (typeof input === "string") {
    const map: Record<string, number> = { "良い": 3, "普通": 2, "悪い": 1, good: 3, normal: 2, bad: 1 };
    return map[input] ?? null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { condition, note, dayJst } = (await req.json()) as {
      condition?: unknown;
      note?: string;
      dayJst?: string; // "YYYY-MM-DD" (JST)
    };

    const condVal = normalizeCondition(condition);
    if (!condVal) {
      return NextResponse.json({ error: "invalid condition" }, { status: 400 });
    }

    let date: Date;
    try {
      date = jstDayToUtcMidnight(dayJst);
    } catch {
      return NextResponse.json({ error: "invalid dayJst format" }, { status: 400 });
    }

    // 1日1回制約: date をユニークキーに upsert
    const created = await prisma.dailyHealth.upsert({
      where: { date },
      update: { condition: condVal, note },
      create: { date, condition: condVal, note },
      select: { id: true, date: true, condition: true },
    });

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    console.error("[/api/health] error", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
