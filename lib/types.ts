// API contract shared by route handlers and the client wrapper.

export interface MeResponse {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  favoriteMovie: string | null;
}

export interface FactDTO {
  id: string;
  movie: string;
  content: string;
  createdAt: string; // ISO 8601
}

export interface FactResponse {
  fact: FactDTO;
}

export type ApiErrorCode =
  | "UNAUTHORIZED" // 401
  | "VALIDATION" // 400
  | "NO_MOVIE" // 409
  | "UPSTREAM" // 502 (OpenAI failed)
  | "INTERNAL" // 500
  | "NETWORK" // client-only: fetch itself failed
  | "BAD_RESPONSE"; // client-only: 2xx with unreadable body

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}
