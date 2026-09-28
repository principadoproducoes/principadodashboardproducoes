export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    clerkSecretKeyConfigured: Boolean(process.env.CLERK_SECRET_KEY),
    clerkPublishableKeyConfigured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  });
}
