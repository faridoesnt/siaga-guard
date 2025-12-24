import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SIAGA Guard",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body className="bg-slate-900 text-slate-50">
        {children}
      </body>
    </html>
  );
}

