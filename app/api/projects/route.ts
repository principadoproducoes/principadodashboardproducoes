import { auth, currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;

  const sql = getDb();

  await sql`
    INSERT INTO users (clerk_user_id, email, name)
    VALUES (
      ${userId},
      ${primaryEmail},
      ${[user.firstName, user.lastName].filter(Boolean).join(" ") || null}
    )
    ON CONFLICT (clerk_user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = NOW()
  `;

  const projects = await sql`
    SELECT
      p.id,
      p.name,
      p.event_type,
      p.status,
      p.event_date,
      p.event_time,
      p.city,
      p.venue,
      p.description,
      p.budget_planned,
      p.budget_approved,
      p.guest_target,
      p.guest_confirmed,
      p.progress
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    JOIN users u ON u.id = pm.user_id
    WHERE u.clerk_user_id = ${userId}
    ORDER BY p.event_date NULLS LAST, p.created_at DESC
  `;

  return Response.json({ projects });
}
