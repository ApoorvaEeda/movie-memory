import { prisma } from "@/lib/db";
import { json, jsonError, unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { meSelect } from "@/lib/users";
import { movieSchema } from "@/lib/validation";
import type { MeResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// PUT /api/me/movie  { movie: string } -> MeResponse
export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "VALIDATION", "Request body must be valid JSON.");
  }

  const parsed = movieSchema.safeParse((body as { movie?: unknown } | null)?.movie);
  if (!parsed.success) return jsonError(400, "VALIDATION", parsed.error.issues[0].message);

  try {
    // The target row comes from the session, never from the request body.
    const user = await prisma.user.update({
      where: { id: userId },
      data: { favoriteMovie: parsed.data },
      select: meSelect,
    });
    return json<MeResponse>(user);
  } catch (e) {
    console.error("update movie failed", e);
    return jsonError(500, "INTERNAL", "Couldn't save your movie. Please try again.");
  }
}
