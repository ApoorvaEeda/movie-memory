import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", async (orig) => {
  const actual = await orig<typeof import("@/lib/api")>();
  return { ...actual, api: { getMe: vi.fn(), updateMovie: vi.fn(), getFact: vi.fn() } };
});

import { api, ApiError } from "@/lib/api";
import { MovieEditor } from "@/components/MovieEditor";
import { factCache } from "@/lib/factCache";
import { useMe } from "@/hooks/useMe";

const me = (favoriteMovie: string) => ({ id: "u1", name: "Ada", email: "ada@x.com", image: null, favoriteMovie });
const mocked = vi.mocked(api);

function Harness() {
  const { state, saveMovie } = useMe();
  if (state.status !== "ready") return <p>loading</p>;
  return <MovieEditor movie={state.me.favoriteMovie} onSave={saveMovie} />;
}

async function edit(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(await screen.findByRole("button", { name: "Edit" }));
  const input = screen.getByRole("textbox", { name: /favorite movie/i });
  await user.clear(input);
  await user.type(input, text);
}

beforeEach(() => {
  vi.resetAllMocks();
  factCache.clear();
  mocked.getMe.mockResolvedValue(me("Alien"));
});

describe("movie edit flow", () => {
  it("updates optimistically, then confirms and invalidates the fact cache", async () => {
    let resolve!: (v: ReturnType<typeof me>) => void;
    mocked.updateMovie.mockReturnValue(new Promise((r) => (resolve = r)));
    factCache.set("Alien", { id: "f", movie: "Alien", content: "x", createdAt: "" });
    const user = userEvent.setup();
    render(<Harness />);

    await edit(user, "  Heat  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Visible immediately, before the server has answered; input sent trimmed.
    expect(screen.getByTestId("movie")).toHaveTextContent("Heat");
    expect(mocked.updateMovie).toHaveBeenCalledWith("Heat");

    resolve(me("Heat"));
    await waitFor(() => expect(factCache.get("Alien")).toBeNull());
    expect(screen.getByTestId("movie")).toHaveTextContent("Heat");
  });

  it("reverts and shows an error when the server fails, keeping the cache", async () => {
    mocked.updateMovie.mockRejectedValue(new ApiError(500, "INTERNAL", "The server had a problem."));
    factCache.set("Alien", { id: "f", movie: "Alien", content: "x", createdAt: "" });
    const user = userEvent.setup();
    render(<Harness />);

    await edit(user, "Heat");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server had a problem.");
    // Editor reopened with the draft; the underlying value rolled back.
    expect(screen.getByRole("textbox", { name: /favorite movie/i })).toHaveValue("Heat");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("movie")).toHaveTextContent("Alien");
    expect(factCache.get("Alien")).not.toBeNull();
  });

  it("Cancel makes no request", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await edit(user, "Heat");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocked.updateMovie).not.toHaveBeenCalled();
    expect(screen.getByTestId("movie")).toHaveTextContent("Alien");
  });

  it("rejects an empty title client-side without a request", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await edit(user, "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/enter a movie title/i);
    expect(mocked.updateMovie).not.toHaveBeenCalled();
  });
});
