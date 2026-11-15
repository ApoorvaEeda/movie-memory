import type { FactDTO } from "@/lib/types";

export const FACT_TTL_MS = 30_000;

/**
 * Holds the single most recent fact. Keyed by movie, so a fact for an old
 * title can never be served for a new one, even if invalidation is missed.
 */
export class FactCache {
  private entry: { movie: string; fact: FactDTO; at: number } | null = null;

  get(movie: string, now = Date.now()): FactDTO | null {
    const e = this.entry;
    if (!e || e.movie !== movie || now - e.at >= FACT_TTL_MS) return null;
    return e.fact;
  }

  set(movie: string, fact: FactDTO, now = Date.now()) {
    this.entry = { movie, fact, at: now };
  }

  clear() {
    this.entry = null;
  }
}

export const factCache = new FactCache();
