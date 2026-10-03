import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db/client";

export type AppRole = "owner" | "admin" | "producer" | "client";

export async function getCurrentUserAccess() {
  const { userId } = await auth();
  if (!userId) return null;
  const sql = getDb();
  const rows = await sql\`
    SELECT id, clerk_user_id, email, display_name, role
    FROM users
    WHERE clerk_user_id = ${userId}
    LIMIT 1
  \`;
  if (!rows[0]) return null;
  return rows[0] as { id:string; clerk_user_id:string; email:string|null; display_name:string|null; role:AppRole };
}

export async function requireAdminAccess() {
  const user = await getCurrentUserAccess();
  if (!user || !["owner", "admin"].includes(user.role)) {
    return { user:null, response:Response.json({error:"Forbidden"},{status:403}) };
  }
  return { user, response:null };
}
