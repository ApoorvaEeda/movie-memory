import { prisma } from "@/lib/db";
import { json, unauthorized } from "@/lib/http";
import { getSessionUserId } from "@/lib/session";
import { meSelect } from "@/lib/users";
import type { MeResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/me -> MeResponse
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: meSelect });
  if (!user) return unauthorized();
  return json<MeResponse>(user);
}
