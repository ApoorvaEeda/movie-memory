"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, toApiError, type ApiError } from "@/lib/api";
import { factCache } from "@/lib/factCache";
import type { FactDTO } from "@/lib/types";

export type FactState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; fact: FactDTO }
  | { status: "error"; error: ApiError };

/**
 * Loads a fact for `movie` (null = nothing to load).
 * - Reuses a cached fact for up to 30s unless refresh() is called.
 * - A request id discards responses that arrive after the movie changed.
 */
export function useFact(movie: string | null) {
  const [state, setState] = useState<FactState>({ status: "idle" });
  const requestId = useRef(0);

  const load = useCallback(
    async (force: boolean) => {
      const id = ++requestId.current;
      if (!movie) {
        setState({ status: "idle" });
        return;
      }
      if (!force) {
        const cached = factCache.get(movie);
        if (cached) {
          setState({ status: "ready", fact: cached });
          return;
        }
      }
      setState({ status: "loading" });
      try {
        const { fact } = await api.getFact();
        if (id !== requestId.current) return;
        factCache.set(fact.movie, fact);
        setState({ status: "ready", fact });
      } catch (e) {
        if (id !== requestId.current) return;
        setState({ status: "error", error: toApiError(e) });
      }
    },
    [movie],
  );

  useEffect(() => {
    void load(false);
    return () => {
      requestId.current++; // invalidate in-flight work for the previous movie
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  return { state, refresh };
}
