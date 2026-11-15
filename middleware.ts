import { withAuth } from "next-auth/middleware";

// First line of defence for pages. Pages and API routes re-check the session themselves.
export default withAuth({ pages: { signIn: "/" } });

export const config = { matcher: ["/dashboard/:path*", "/onboarding/:path*", "/post-login"] };
