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

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  const sql = getDb();

  await sql`
    INSERT INTO users (clerk_user_id, email, display_name)
    VALUES (
      ${userId},
      ${primaryEmail},
      ${displayName}
    )
    ON CONFLICT (clerk_user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      updated_at = NOW()
  `;

  const accessRows = await sql\`
    SELECT role FROM users WHERE clerk_user_id = ${userId} LIMIT 1
  \`;
  const role = accessRows[0]?.role ?? "client";

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
      p.progress,
      COALESCE(
        json_agg(
          json_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'category', t.category,
            'status', t.status,
            'due_date', t.due_date,
            'completed_at', t.completed_at,
            'sort_order', t.sort_order
          )
          ORDER BY t.sort_order, t.due_date NULLS LAST, t.created_at
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
      ) AS tasks
    FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id
    LEFT JOIN users u ON u.id = pm.user_id
    LEFT JOIN tasks t ON t.project_id = p.id
    WHERE EXISTS (
      SELECT 1
      FROM users viewer
      WHERE viewer.clerk_user_id = ${userId}
        AND (
          viewer.role IN ('owner', 'admin')
          OR EXISTS (
            SELECT 1
            FROM project_members member
            WHERE member.project_id = p.id
              AND member.user_id = viewer.id
          )
        )
    )
    GROUP BY p.id
    ORDER BY p.event_date NULLS LAST, p.created_at DESC
  `;

  return Response.json({ projects, role });
}
