// app/api/weather/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  // fallback: 広島市
  const latitude = lat ?? "34.3853";
  const longitude = lon ?? "132.4553";

  // 天気
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", latitude);
  weatherUrl.searchParams.set("longitude", longitude);
  weatherUrl.searchParams.set("current_weather", "true");
  weatherUrl.searchParams.set("hourly", "temperature_2m,apparent_temperature,precipitation_probability");
  weatherUrl.searchParams.set("daily", "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  weatherUrl.searchParams.set("timezone", "Asia/Tokyo");

  // 逆ジオ（地名）
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  geoUrl.searchParams.set("latitude", latitude);
  geoUrl.searchParams.set("longitude", longitude);
  geoUrl.searchParams.set("language", "ja");
  geoUrl.searchParams.set("format", "json");

  try {
    const [wres, gres] = await Promise.all([
      fetch(weatherUrl.toString(), { next: { revalidate: 3600 } }),
      fetch(geoUrl.toString(),    { next: { revalidate: 3600 } }),
    ]);

    if (!wres.ok) throw new Error("weather api error");

    const data = await wres.json();

    let placeLabel = "";
    if (gres.ok) {
      const gj = await gres.json();
      const r = gj?.results?.[0];
      // 候補を良い感じに連結（例：中区・広島県・日本）
      const parts = [
        r?.name,             // 例: 中区 / 広島市 / 地名
        r?.admin2,           // 例: 広島市
        r?.admin1,           // 例: 広島県
        r?.country,          // 例: 日本
    ].filter((v) => typeof v === "string" && v.length > 0);
    placeLabel = parts.join("・")  
    }

    return NextResponse.json({ ok: true, data, placeLabel });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
