// components/WeatherCard.tsx
"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  temp: number | null;
  apparent: number | null;
  max: number | null;
  min: number | null;
  pop: number | null;
  code: number | null;
  label: string; // 表示用の地名
};

function iconFromCode(code: number | null) {
  if (code == null) return "🌡️";
  if ([0].includes(code)) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([56, 57, 66, 67].includes(code)) return "🌦️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

export default function WeatherCard() {
  const [w, setW] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(lat?: number, lon?: number, fallbackHint = "") {
      const q = lat && lon ? `?lat=${lat}&lon=${lon}` : "";
      try {
        const res = await fetch(`/api/weather${q}`);
        const json = await res.json();
        if (!json?.ok || cancelled) return;

        const d = json.data;
        const now = d.current_weather;
        const daily = d.daily;
        const todayIdx = 0;

        const label: string =
          (json.placeLabel as string) && typeof json.placeLabel === "string"
            ? json.placeLabel
            : fallbackHint || "";

        setW({
          temp: now?.temperature ?? null,
          apparent: d.hourly?.apparent_temperature?.[0] ?? null,
          max: daily?.temperature_2m_max?.[todayIdx] ?? null,
          min: daily?.temperature_2m_min?.[todayIdx] ?? null,
          pop: daily?.precipitation_probability_max?.[todayIdx] ?? null,
          code: now?.weathercode ?? null,
          label,
        });
      } catch {
        // noop
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // 位置情報は1回だけ
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude, "現在値"),
        () => load(undefined, undefined, "広島市周辺")
      );
    } else {
      load(undefined, undefined, "広島市周辺");
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  if (!w) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">天気</div>
        <div className="mt-1 text-gray-500 dark:text-gray-400">取得に失敗しました</div>
      </div>
    );
  }

  const icon = iconFromCode(w.code);

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        天気{w.label ? `（${w.label}）` : ""}
      </div>
      <div className="mt-1 text-lg font-semibold flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span>{w.temp != null ? `${Math.round(w.temp)}°C` : "—"}</span>
        {w.apparent != null && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            体感 {Math.round(w.apparent)}°C
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex gap-3">
        {w.max != null && <span>↑{Math.round(w.max)}°C</span>}
        {w.min != null && <span>↓{Math.round(w.min)}°C</span>}
        {w.pop != null && <span>降水確率 {w.pop}%</span>}
      </div>
    </div>
  );
}
