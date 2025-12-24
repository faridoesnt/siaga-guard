"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "./auth";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router, pathname]);

  return ready;
}

