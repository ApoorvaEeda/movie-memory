"use client";

import { useState, type FormEvent } from "react";
import { MOVIE_MAX, movieSchema } from "@/lib/validation";

interface Props {
  movie: string | null;
  /** Resolves on success, rejects (with a user-presentable message) on failure. */
  onSave: (movie: string) => Promise<void>;
}

export function MovieEditor({ movie, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function start() {
    setDraft(movie ?? "");
    setError(null);
    setEditing(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = movieSchema.safeParse(draft); // UX check only; the server is authoritative
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (parsed.data === movie) return setEditing(false);

    setError(null);
    setEditing(false); // optimistic: parent already shows the new title
    try {
      await onSave(parsed.data);
    } catch (err) {
      // Parent has rolled back; reopen with the draft so the user can retry.
      setDraft(parsed.data);
      setError(err instanceof Error ? err.message : "Couldn't save your movie.");
      setEditing(true);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Favorite movie</h2>
            <p data-testid="movie" className="mt-1 text-xl font-semibold">
              {movie ?? "Not set"}
            </p>
          </div>
          <button onClick={start} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
            Edit
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="movie-input" className="text-sm font-medium text-slate-500">
        Favorite movie
      </label>
      <input
        id="movie-input"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={MOVIE_MAX + 50}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
