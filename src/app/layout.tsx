// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { SettingsProvider } from "@/components/SettingsProvider";

export const dynamic = "force-dynamic";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyWell",
  description: "Health × Mood × Tasks",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("studywell-theme")?.value; // "dark" | "light" | undefined
  const htmlClass = themeCookie === "dark" ? "dark" : "";

  return (
    <html lang="ja" className={htmlClass} suppressHydrationWarning>
      <head>
        {/* ✅ モバイル必須：ビューポート / セーフエリア / テーマ色 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f9fafb"  media="(prefers-color-scheme: light)" />
        <meta name="color-scheme" content="dark light" />

        {/* ✅ PWA 対応（任意だが推奨） */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/maskable-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  try {
    var raw = localStorage.getItem("studywell.settings");
    var s = raw ? JSON.parse(raw) : {};
    var theme = s.theme || "${themeCookie ?? "light"}";

    // SSRのclassと同期（初回チラつき防止）
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // 次回以降のSSRのため Cookie 同期
    document.cookie = "studywell-theme=" + theme + "; Path=/; Max-Age=31536000; SameSite=Lax";

    // ハイライト色
    var color = s.highlightColor || "#ef4444";
    document.documentElement.style.setProperty("--highlight-color", color);
    document.documentElement.style.setProperty(
      "--highlight-bg",
      "rgba(" +
        parseInt(color.slice(1,3),16) + "," +
        parseInt(color.slice(3,5),16) + "," +
        parseInt(color.slice(5,7),16) + ",0.16)"
    );

    // ✅ 設定を即時反映するためのブリッジ（設定画面から呼ぶ）
    window.__studywellSetSettings = function(next) {
      try {
        localStorage.setItem("studywell.settings", JSON.stringify(next));
        // テーマ即時反映 + Cookie同期
        if (next.theme === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        document.cookie = "studywell-theme=" + next.theme + "; Path=/; Max-Age=31536000; SameSite=Lax";
        // ハイライト色反映
        var c = next.highlightColor || "#ef4444";
        document.documentElement.style.setProperty("--highlight-color", c);
        document.documentElement.style.setProperty(
          "--highlight-bg",
          "rgba(" +
            parseInt(c.slice(1,3),16) + "," +
            parseInt(c.slice(3,5),16) + "," +
            parseInt(c.slice(5,7),16) + ",0.16)"
        );
      } catch (e) {}
    };
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased
                    bg-gray-50 text-gray-900
                    dark:bg-gray-900 dark:text-gray-100
                    min-h-screen
                    pb-[env(safe-area-inset-bottom)]  /* ✅ iOSホームバー回避 */
                    touch-manipulation                /* ✅ タップ反応改善 */
                    `}
      >
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
