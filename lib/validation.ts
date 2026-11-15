import { z } from "zod";

export const MOVIE_MIN = 1;
export const MOVIE_MAX = 100;

// Single source of truth: used by the API route (authoritative) and by the
// forms (UX only, so users get instant feedback).
export const movieSchema = z
  .string({ required_error: "Movie is required", invalid_type_error: "Movie must be text" })
  .trim()
  .min(MOVIE_MIN, "Please enter a movie title")
  .max(MOVIE_MAX, `Title must be ${MOVIE_MAX} characters or fewer`);
