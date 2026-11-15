"use client";

import type { FactState } from "@/hooks/useFact";

interface Props {
  movie: string | null;
  state: FactState;
  /** True while a movie change is in flight; the old fact would be misleading. */
  paused: boolean;
  onRefresh: () => void;
}

export function FactCard({ movie, state, paused, onRefresh }: Props) {
  return (
    <section aria-live="polite">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-500">Fun fact</h2>
        {state.status === "ready" && !paused && (
          <button onClick={onRefresh} className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline">
            New fact
          </button>
        )}
      </div>
      <div className="mt-2 min-h-[3.5rem]">
        {!movie ? (
          <p className="text-slate-500">Add a favorite movie to see a fun fact.</p>
        ) : paused || state.status === "loading" || state.status === "idle" ? (
          <div className="space-y-2" role="status" aria-label="Loading fact">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        ) : state.status === "error" ? (
          <div>
            <p role="alert" className="text-red-600">
              {state.error.message}
            </p>
            <button onClick={onRefresh} className="mt-2 text-sm font-medium underline">
              Try again
            </button>
          </div>
        ) : (
          <p className="leading-relaxed">{state.fact.content}</p>
        )}
      </div>
    </section>
  );
}
