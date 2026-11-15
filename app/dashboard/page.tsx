import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteMovie: true } });
  if (!user) redirect("/api/auth/signout");
  if (!user.favoriteMovie) redirect("/onboarding");

  return <DashboardClient />;
}
