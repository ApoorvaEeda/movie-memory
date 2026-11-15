"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { MOVIE_MAX, movieSchema } from "@/lib/validation";

export function OnboardingForm() {
  const router = useRouter();
  const [movie, setMovie] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = movieSchema.safeParse(movie); // UX check; server re-validates
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setError(null);
    setSubmitting(true);
    try {
      await api.updateMovie(parsed.data);
      router.replace("/dashboard");
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.isUnauthorized) return router.replace("/");
      setError(apiErr.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="movie" className="sr-only">
        Favorite movie
      </label>
      <input
        id="movie"
        autoFocus
        value={movie}
        onChange={(e) => setMovie(e.target.value)}
        maxLength={MOVIE_MAX + 50}
        placeholder="e.g. The Princess Bride"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
