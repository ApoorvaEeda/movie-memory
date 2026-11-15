import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { SignInButton } from "@/components/SignInButton";

export default async function Landing() {
  if (await getSessionUserId()) redirect("/post-login");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-5xl" aria-hidden>🎬</div>
      <h1 className="text-3xl font-semibold tracking-tight">Movie Memory</h1>
      <p className="text-slate-600">Tell us your favorite movie and we'll bring you fun facts about it.</p>
      <SignInButton />
    </main>
  );
}
