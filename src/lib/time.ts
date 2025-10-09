// src/lib/time.ts

/**
 * "YYYY-MM-DD" (JST) を受け取り、
 * その日の JST 00:00 の瞬間を表す UTC Date を返す。
 * 引数省略時は「今日(JST)」。
 *
 * 例: jstDayToUtcMidnight("2025-10-09") -> 2025-10-08T15:00:00.000Z
 */
export function jstDayToUtcMidnight(dayJst?: string): Date {
  // 今日(JST)の年月日をまず決める
  const nowUtc = new Date();
  const nowJstMs = nowUtc.getTime() + 9 * 60 * 60 * 1000;
  const nowJst = new Date(nowJstMs);

  let y = nowJst.getUTCFullYear();
  let m = nowJst.getUTCMonth(); // 0-11
  let d = nowJst.getUTCDate();

  if (dayJst) {
    const m2 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayJst);
    if (!m2) throw new Error("invalid dayJst format");
    y = Number(m2[1]);
    m = Number(m2[2]) - 1;
    d = Number(m2[3]);
  }

  // JST 00:00 の UTC 瞬間 = Date.UTC(y,m,d,0:00 JST) - 9h
  const utcMs = Date.UTC(y, m, d, 0, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(utcMs);
}

/**
 * 今日(JST)の "YYYY-MM-DD" を返す。
 * 例: "2025-10-09"
 */
export function getJstTodayStr(): string {
  const nowUtc = new Date();
  const nowJstMs = nowUtc.getTime() + 9 * 60 * 60 * 1000;
  const nowJst = new Date(nowJstMs);
  const y = nowJst.getUTCFullYear();
  const m = nowJst.getUTCMonth() + 1;
  const d = nowJst.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * 今日(JST)のキー（= JST 00:00 を指す UTC Date）を返す。
 * Prisma の findUnique({ where: { date } }) と一致させる用途。
 */
export function getJstTodayKey(): Date {
  return jstDayToUtcMidnight(getJstTodayStr());
}
