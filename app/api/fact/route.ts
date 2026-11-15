import { prisma } from "@/lib/db";
import { json, jsonError, unauthorized } from "@/lib/http";
import { generateMovieFact } from "@/lib/openai";
import { getSessionUserId } from "@/lib/session";
import type { FactResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/fact -> FactResponse
// Always generates a fresh fact for the caller's *current* favorite movie (read from the DB,
// never from the client) and stores it. Reuse within 30s is a client-side concern.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteMovie: true } });
  if (!user) return unauthorized();
  if (!user.favoriteMovie) return jsonError(409, "NO_MOVIE", "Set a favorite movie first.");

  const movie = user.favoriteMovie;
  let content: string;
  try {
    content = await generateMovieFact(movie);
  } catch (e) {
    console.error("OpenAI fact generation failed", e);
    return jsonError(502, "UPSTREAM", "Couldn't generate a fact right now. Please try again.");
  }

  const fact = await prisma.fact.create({ data: { userId, movie, content } });
  return json<FactResponse>({
    fact: { id: fact.id, movie: fact.movie, content: fact.content, createdAt: fact.createdAt.toISOString() },
  });
}
