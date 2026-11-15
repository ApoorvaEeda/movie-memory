import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** The authenticated user's DB id, or null. The ONLY source of identity on the server. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
