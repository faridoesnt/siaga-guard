"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/login";

  return (
    <>
      {showHeader && <Header />}
      {children}
    </>
  );
}
