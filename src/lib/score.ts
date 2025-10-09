// src/lib/score.ts

// 体調(1..3) → 係数
export function healthCoefFromInt(h: number | null | undefined) {
  if (h === 3) return 1.0;   // 良い
  if (h === 2) return 0.9;   // 普通
  if (h === 1) return 0.75;  // 悪い
  return 0.9;                // 未入力：やや低め
}

// 気分(1..5) → 係数（APIで数値化済み）
export function moodCoef(mood: number | null | undefined) {
  if (!mood) return 1.0;
  const m = Math.max(1, Math.min(5, mood));
  return 0.8 + 0.1 * m;      // 1→0.9, 3→1.1, 5→1.3
}

// 期限ブースト
export function dueCoef(due: Date | null | undefined) {
  if (!due) return 1.0;
  const diffH = (due.getTime() - Date.now()) / 36e5;
  if (diffH <= 24) return 1.2;  // 24h以内
  if (diffH <= 72) return 1.1;  // 3日以内
  return 1.0;
}
