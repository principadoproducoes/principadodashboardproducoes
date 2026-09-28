export const runtime = "nodejs";

function keyMode(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("pk_live_") || value.startsWith("sk_live_")) return "live";
  if (value.startsWith("pk_test_") || value.startsWith("sk_test_")) return "test";
  return "other";
}

export async function GET() {
  return Response.json({
    clerkSecretKeyConfigured: Boolean(process.env.CLERK_SECRET_KEY),
    clerkPublishableKeyConfigured: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    clerkSecretKeyMode: keyMode(process.env.CLERK_SECRET_KEY),
    clerkPublishableKeyMode: keyMode(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  });
}
