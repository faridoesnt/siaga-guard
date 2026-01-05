import "./globals.css";
import type { ReactNode } from "react";
import AppLayout from "@/component/layout";

export const metadata = {
  title: "SIAGA Guard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-192x192.png"
        />
      </head>
      <body className="bg-[#F1F5F9] text-slate-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
