import { describe, expect, it } from "vitest";
import { FACT_TTL_MS, FactCache } from "@/lib/factCache";
import type { FactDTO } from "@/lib/types";

const fact = (movie: string): FactDTO => ({ id: "f1", movie, content: "x", createdAt: new Date(0).toISOString() });

describe("FactCache", () => {
  it("reuses a fact inside the 30s window", () => {
    const c = new FactCache();
    c.set("Alien", fact("Alien"), 1_000);
    expect(c.get("Alien", 1_000 + FACT_TTL_MS - 1)).not.toBeNull();
  });

  it("expires at 30s", () => {
    const c = new FactCache();
    c.set("Alien", fact("Alien"), 1_000);
    expect(c.get("Alien", 1_000 + FACT_TTL_MS)).toBeNull();
  });

  it("never serves a fact for a different movie", () => {
    const c = new FactCache();
    c.set("Alien", fact("Alien"), 1_000);
    expect(c.get("Aliens", 1_001)).toBeNull();
  });

  it("clear() invalidates", () => {
    const c = new FactCache();
    c.set("Alien", fact("Alien"), 1_000);
    c.clear();
    expect(c.get("Alien", 1_001)).toBeNull();
  });
});
