"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/post-login" })}
      className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-700"
    >
      Sign in with Google
    </button>
  );
}
