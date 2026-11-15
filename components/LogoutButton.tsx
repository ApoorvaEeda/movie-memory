"use client";

import { signOut } from "next-auth/react";
import { factCache } from "@/lib/factCache";

export function LogoutButton() {
  return (
    <button
      onClick={() => {
        factCache.clear();
        void signOut({ callbackUrl: "/" });
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
    >
      Log out
    </button>
  );
}
