"use client";

import { useEffect, useState } from "react";
import { useFact } from "@/hooks/useFact";
import { useMe } from "@/hooks/useMe";
import { Avatar } from "@/components/Avatar";
import { FactCard } from "@/components/FactCard";
import { LogoutButton } from "@/components/LogoutButton";
import { MovieEditor } from "@/components/MovieEditor";

export function DashboardClient() {
  const { state, reload, saveMovie } = useMe();
  const [saving, setSaving] = useState(false);

  const movie = state.status === "ready" ? state.me.favoriteMovie : null;
  // While a save is in flight the fact for the old title is hidden and nothing is fetched.
  const fact = useFact(saving ? null : movie);

  useEffect(() => {
    if (state.status === "error" && state.error.isUnauthorized) window.location.assign("/");
  }, [state]);

  async function handleSave(next: string) {
    setSaving(true);
    try {
      await saveMovie(next);
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10" role="status" aria-label="Loading dashboard">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-200" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-xl px-6 py-10">
        <p role="alert" className="text-red-600">
          {state.error.message}
        </p>
        <button onClick={reload} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
          Retry
        </button>
      </main>
    );
  }

  const { me } = state;
  const displayName = me.name ?? me.email?.split("@")[0] ?? "Movie fan";

  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-10">
      <header className="flex items-center gap-4">
        <Avatar src={me.image} name={me.name} email={me.email} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{displayName}</h1>
          <p className="truncate text-sm text-slate-500">{me.email ?? "No email on file"}</p>
        </div>
        <LogoutButton />
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <MovieEditor movie={me.favoriteMovie} onSave={handleSave} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <FactCard movie={me.favoriteMovie} state={fact.state} paused={saving} onRefresh={fact.refresh} />
      </div>
    </main>
  );
}
