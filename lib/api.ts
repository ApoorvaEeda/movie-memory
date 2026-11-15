import type { ApiErrorBody, ApiErrorCode, FactResponse, MeResponse } from "@/lib/types";

/** Every failure the UI can see is an ApiError: HTTP errors, network errors, bad bodies. */
export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = never reached the server
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export function toApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError(0, "INTERNAL", "Something went wrong. Please try again.");
}

function fallbackMessage(status: number) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status >= 500) return "The server had a problem. Please try again.";
  return "The request couldn't be completed.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Can't reach the server. Check your connection and try again.");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty or non-JSON body; handled below */
  }

  if (!res.ok) {
    const err = (body as Partial<ApiErrorBody> | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? (res.status === 401 ? "UNAUTHORIZED" : "INTERNAL"),
      err?.message ?? fallbackMessage(res.status),
    );
  }
  if (body === null) throw new ApiError(res.status, "BAD_RESPONSE", "Unexpected response from the server.");
  return body as T;
}

export const api = {
  getMe: () => request<MeResponse>("/api/me"),
  updateMovie: (movie: string) =>
    request<MeResponse>("/api/me/movie", { method: "PUT", body: JSON.stringify({ movie }) }),
  getFact: () => request<FactResponse>("/api/fact"),
};
