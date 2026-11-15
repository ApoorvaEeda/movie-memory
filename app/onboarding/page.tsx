import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteMovie: true } });
  if (!user) redirect("/api/auth/signout");
  if (user.favoriteMovie) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome! One quick question</h1>
        <p className="mt-1 text-slate-600">What's your favorite movie?</p>
      </div>
      <OnboardingForm />
    </main>
  );
}
