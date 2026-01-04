"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getStoredUser } from "@/lib/auth";

export default function Header() {
  const router = useRouter();
  const [name, setName] = useState("Satpam");

  useEffect(() => {
    setName(getStoredUser()?.name || "Satpam");
  }, []);
  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };
  return (
    <header className="flex items-center justify-between bg-white px-4 py-3">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">
          SIAGA Guard
        </p>
        <h1 className="text-lg font-semibold text-slate-400">Halo, {name}</h1>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100"
      >
        Logout
      </button>
    </header>
  );
}
