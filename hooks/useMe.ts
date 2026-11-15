"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, toApiError, type ApiError } from "@/lib/api";
import { factCache } from "@/lib/factCache";
import type { MeResponse } from "@/lib/types";

export type MeState =
  | { status: "loading" }
  | { status: "ready"; me: MeResponse }
  | { status: "error"; error: ApiError };

export function useMe() {
  const [state, setState] = useState<MeState>({ status: "loading" });
  const meRef = useRef<MeResponse | null>(null);
  meRef.current = state.status === "ready" ? state.me : null;

  const reload = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", me: await api.getMe() });
    } catch (e) {
      setState({ status: "error", error: toApiError(e) });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * Optimistic update: show the new title immediately, roll back and rethrow
   * if the server rejects it. The fact cache is only invalidated on success;
   * on failure the old title is restored, so its cached fact is still valid.
   */
  const saveMovie = useCallback(async (movie: string) => {
    const prev = meRef.current;
    if (!prev) return;
    setState({ status: "ready", me: { ...prev, favoriteMovie: movie } });
    try {
      const updated = await api.updateMovie(movie);
      factCache.clear();
      setState({ status: "ready", me: updated });
    } catch (e) {
      setState({ status: "ready", me: prev });
      throw toApiError(e);
    }
  }, []);

  return { state, reload, saveMovie };
}
