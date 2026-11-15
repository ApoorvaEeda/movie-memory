import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

// Landing spot after Google sign-in: first-time users -> onboarding, returning -> dashboard.
export default async function PostLogin() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteMovie: true } });
  if (!user) redirect("/api/auth/signout"); // stale session for a deleted user; avoids a redirect loop
  redirect(user.favoriteMovie ? "/dashboard" : "/onboarding");
}
