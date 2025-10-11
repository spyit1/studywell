// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { SettingsProvider } from "@/components/SettingsProvider"; // ← 追加

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyWell",
  description: "Health × Mood × Tasks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 先に localStorage を読んで .dark を付与（ダークモードのチラつき防止）
    <html lang="ja" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var raw = localStorage.getItem("studywell.settings");
    var theme = raw ? (JSON.parse(raw).theme || "light") : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    // ハイライト色のCSS変数も初期反映（任意）
    var color = raw ? (JSON.parse(raw).highlightColor || "#ef4444") : "#ef4444";
    document.documentElement.style.setProperty("--highlight-color", color);
    document.documentElement.style.setProperty("--highlight-bg", "rgba("
      + parseInt(color.slice(1,3),16) + ","
      + parseInt(color.slice(3,5),16) + ","
      + parseInt(color.slice(5,7),16) + ",0.16)");
  } catch(e) {}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
      >
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
