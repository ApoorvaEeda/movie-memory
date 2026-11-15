import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";

function mockFetch(status: number, body: unknown) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const fn = vi.fn().mockResolvedValue(new Response(payload, { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("returns the parsed body on success", async () => {
    const me = { id: "1", name: "Ada", email: "a@x.com", image: null, favoriteMovie: "Alien" };
    mockFetch(200, me);
    await expect(api.getMe()).resolves.toEqual(me);
  });

  it("maps a 401 to an unauthorized ApiError", async () => {
    mockFetch(401, { error: { code: "UNAUTHORIZED", message: "Please sign in." } });
    const err = await api.getMe().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, code: "UNAUTHORIZED", message: "Please sign in." });
    expect(err.isUnauthorized).toBe(true);
  });

  it("uses a friendly fallback for a 500 with a non-JSON body", async () => {
    mockFetch(500, "<html>boom</html>");
    const err = await api.getFact().catch((e) => e);
    expect(err).toMatchObject({ status: 500, code: "INTERNAL" });
    expect(err.message).toMatch(/server had a problem/i);
  });

  it("surfaces server validation messages", async () => {
    mockFetch(400, { error: { code: "VALIDATION", message: "Please enter a movie title" } });
    await expect(api.updateMovie("")).rejects.toMatchObject({ status: 400, message: "Please enter a movie title" });
  });

  it("normalises a network failure to ApiError(NETWORK)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api.getMe()).rejects.toMatchObject({ status: 0, code: "NETWORK" });
  });

  it("sends the movie as a JSON PUT", async () => {
    const fn = mockFetch(200, { id: "1", name: null, email: null, image: null, favoriteMovie: "Heat" });
    await api.updateMovie("Heat");
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe("/api/me/movie");
    expect(init).toMatchObject({ method: "PUT", body: JSON.stringify({ movie: "Heat" }) });
  });
});
