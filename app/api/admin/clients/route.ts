import { requireAdminAccess } from "@/lib/authz";
import { getDb } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  const access = await requireAdminAccess();
  if (access.response) return access.response;

  const sql = getDb();

  const clients = await sql`
    SELECT
      c.id,
      c.name,
      c.company_name,
      c.email,
      c.phone,
      c.created_at,
      COUNT(p.id)::int AS project_count,
      COUNT(p.id) FILTER (
        WHERE p.status NOT IN ('completed', 'cancelled')
      )::int AS active_project_count
    FROM clients c
    LEFT JOIN projects p ON p.client_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;

  return Response.json({ clients });
}

export async function POST(request: Request) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const companyName =
    typeof body?.company_name === "string" ? body.company_name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!name) {
    return Response.json(
      { error: "Nome do cliente é obrigatório." },
      { status: 400 }
    );
  }

  const sql = getDb();

  const rows = await sql`
    INSERT INTO clients (name, company_name, email, phone)
    VALUES (${name}, ${companyName || null}, ${email || null}, ${phone || null})
    RETURNING id, name, company_name, email, phone, created_at
  `;

  const client = rows[0];

  await sql`
    INSERT INTO activity_log (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
      ${access.user?.id ?? null},
      'Cliente criado',
      'client',
      ${client.id},
      ${JSON.stringify({ name, company_name: companyName || null })}::jsonb
    )
  `;

  return Response.json({ client }, { status: 201 });
}
