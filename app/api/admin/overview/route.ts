import { requireAdminAccess } from "@/lib/authz";
import { getDb } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const sql = getDb();
  const [summary, upcoming, recent] = await Promise.all([
    sql\`
      SELECT
        (SELECT COUNT(*)::int FROM clients) AS clients,
        (SELECT COUNT(*)::int FROM projects WHERE status NOT IN ('completed','cancelled')) AS active_projects,
        (SELECT COUNT(*)::int FROM projects WHERE event_date >= CURRENT_DATE AND status NOT IN ('cancelled')) AS upcoming_events,
        (SELECT COUNT(*)::int FROM tasks WHERE status = 'pending') AS pending_tasks,
        COALESCE((SELECT SUM(budget_approved) FROM projects WHERE status NOT IN ('cancelled')), 0) AS approved_budget,
        COALESCE((SELECT SUM(guest_confirmed) FROM projects WHERE status NOT IN ('cancelled')), 0)::int AS confirmed_guests
    \`,
    sql\`
      SELECT id, name, event_type, status, event_date, city, venue, progress, guest_target, guest_confirmed
      FROM projects WHERE status NOT IN ('completed','cancelled')
      ORDER BY event_date NULLS LAST, created_at DESC LIMIT 8
    \`,
    sql\`
      SELECT id, action, created_at FROM activity_log ORDER BY created_at DESC LIMIT 8
    \`
  ]);
  return Response.json({user:access.user,summary:summary[0],upcoming,recent});
}
