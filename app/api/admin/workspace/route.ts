import { requireAdminAccess } from "@/lib/authz";
import { getDb } from "@/db/client";

export const runtime = "nodejs";

const resources = ["tasks","milestones","budget","suppliers","team","guests","files","messages","activity"] as const;
type Resource = typeof resources[number];

function validResource(value: string | null): value is Resource {
  return !!value && resources.includes(value as Resource);
}

async function projectExists(sql: any, projectId: string) {
  const rows = await sql.query("SELECT id FROM projects WHERE id = $1 LIMIT 1", [projectId]);
  return !!rows[0];
}

export async function GET(request: Request) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const projectId = searchParams.get("project_id");
  if (!validResource(resource)) return Response.json({ error: "Recurso inválido." }, { status: 400 });

  const sql: any = getDb();
  let items: any[] = [];

  if (resource === "tasks") {
    items = await sql.query("SELECT id, project_id, title, description, category, status, due_date, completed_at, sort_order, created_at, updated_at FROM tasks " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY status, due_date NULLS LAST, sort_order, created_at", projectId ? [projectId] : []);
  } else if (resource === "milestones") {
    items = await sql.query("SELECT id, project_id, title, description, milestone_date, milestone_time, sort_order, created_at FROM milestones " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY milestone_date, milestone_time NULLS LAST, sort_order", projectId ? [projectId] : []);
  } else if (resource === "budget") {
    items = await sql.query("SELECT b.id,b.project_id,b.description,b.category,b.supplier_id,b.planned_amount,b.approved_amount,b.paid_amount,b.approval,b.notes,b.created_at,b.updated_at,s.name AS supplier_name FROM budget_items b LEFT JOIN suppliers s ON s.id=b.supplier_id " + (projectId ? "WHERE b.project_id = $1 " : "") + "ORDER BY b.created_at DESC", projectId ? [projectId] : []);
  } else if (resource === "suppliers") {
    items = await sql.query("SELECT id,project_id,name,category,contact_name,email,phone,status,notes,created_at,updated_at FROM suppliers " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY name", projectId ? [projectId] : []);
  } else if (resource === "team") {
    items = await sql.query("SELECT id,project_id,name,role,email,phone,notes,created_at FROM team_members " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY name", projectId ? [projectId] : []);
  } else if (resource === "guests") {
    items = await sql.query("SELECT id,project_id,name,email,phone,status,plus_ones,notes,created_at,updated_at FROM guests " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY name", projectId ? [projectId] : []);
  } else if (resource === "files") {
    items = await sql.query("SELECT id,project_id,name,storage_key,mime_type,size_bytes,category,created_at FROM files " + (projectId ? "WHERE project_id = $1 " : "") + "ORDER BY created_at DESC", projectId ? [projectId] : []);
  } else if (resource === "messages") {
    items = await sql.query("SELECT m.id,m.project_id,m.body,m.created_at,u.display_name AS author_name FROM messages m LEFT JOIN users u ON u.id=m.author_user_id " + (projectId ? "WHERE m.project_id = $1 " : "") + "ORDER BY m.created_at DESC", projectId ? [projectId] : []);
  } else if (resource === "activity") {
    items = await sql.query("SELECT a.id,a.project_id,a.action,a.entity_type,a.entity_id,a.metadata,a.created_at,u.display_name AS actor_name FROM activity_log a LEFT JOIN users u ON u.id=a.actor_user_id " + (projectId ? "WHERE a.project_id = $1 " : "") + "ORDER BY a.created_at DESC LIMIT 100", projectId ? [projectId] : []);
  }

  return Response.json({ items });
}

export async function POST(request: Request) {
  const access = await requireAdminAccess();
  if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  const resource = typeof body?.resource === "string" ? body.resource : "";
  if (!validResource(resource) || resource === "activity") return Response.json({ error: "Recurso inválido." }, { status: 400 });

  const sql = getDb();
  const projectId = typeof body?.project_id === "string" ? body.project_id : "";
  if (!projectId || !(await projectExists(sql, projectId))) return Response.json({ error: "Selecione um projeto válido." }, { status: 400 });

  let row: any;
  if (resource === "tasks") {
    const title = String(body?.title || "").trim();
    if (!title) return Response.json({ error: "Título da tarefa é obrigatório." }, { status: 400 });
    const r = await sql.query("INSERT INTO tasks (project_id,title,description,category,status,due_date,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [projectId,title,body?.description || null,body?.category || null,body?.status || "pending",body?.due_date || null,Number(body?.sort_order)||0]); row=r[0];
  } else if (resource === "milestones") {
    const title=String(body?.title||"").trim(), d=String(body?.milestone_date||"").trim();
    if(!title||!d) return Response.json({error:"Título e data do marco são obrigatórios."},{status:400});
    const r=await sql.query("INSERT INTO milestones (project_id,title,description,milestone_date,milestone_time,sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",[projectId,title,body?.description||null,d,body?.milestone_time||null,Number(body?.sort_order)||0]); row=r[0];
  } else if (resource === "budget") {
    const description=String(body?.description||"").trim();
    if(!description) return Response.json({error:"Descrição do item é obrigatória."},{status:400});
    const r=await sql.query("INSERT INTO budget_items (project_id,description,category,supplier_id,planned_amount,approved_amount,paid_amount,approval,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",[projectId,description,body?.category||null,body?.supplier_id||null,Number(body?.planned_amount)||0,Number(body?.approved_amount)||0,Number(body?.paid_amount)||0,body?.approval||"pending",body?.notes||null]); row=r[0];
  } else if (resource === "suppliers") {
    const name=String(body?.name||"").trim();
    if(!name) return Response.json({error:"Nome do fornecedor é obrigatório."},{status:400});
    const r=await sql.query("INSERT INTO suppliers (project_id,name,category,contact_name,email,phone,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",[projectId,name,body?.category||null,body?.contact_name||null,body?.email||null,body?.phone||null,body?.status||"Cotação",body?.notes||null]); row=r[0];
  } else if (resource === "team") {
    const name=String(body?.name||"").trim();
    if(!name) return Response.json({error:"Nome do integrante é obrigatório."},{status:400});
    const r=await sql.query("INSERT INTO team_members (project_id,name,role,email,phone,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",[projectId,name,body?.role||null,body?.email||null,body?.phone||null,body?.notes||null]); row=r[0];
  } else if (resource === "guests") {
    const name=String(body?.name||"").trim();
    if(!name) return Response.json({error:"Nome do convidado é obrigatório."},{status:400});
    const r=await sql.query("INSERT INTO guests (project_id,name,email,phone,status,plus_ones,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[projectId,name,body?.email||null,body?.phone||null,body?.status||"pending",Number(body?.plus_ones)||0,body?.notes||null]); row=r[0];
  } else if (resource === "files") {
    const name=String(body?.name||"").trim(), key=String(body?.storage_key||"").trim();
    if(!name||!key) return Response.json({error:"Nome e link/chave do arquivo são obrigatórios."},{status:400});
    const r=await sql.query("INSERT INTO files (project_id,uploaded_by_user_id,name,storage_key,mime_type,size_bytes,category) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",[projectId,access.user?.id||null,name,key,body?.mime_type||null,body?.size_bytes?Number(body.size_bytes):null,body?.category||null]); row=r[0];
  } else if (resource === "messages") {
    const message=String(body?.body||"").trim();
    if(!message) return Response.json({error:"Mensagem não pode ficar vazia."},{status:400});
    const r=await sql.query("INSERT INTO messages (project_id,author_user_id,body) VALUES ($1,$2,$3) RETURNING *",[projectId,access.user?.id||null,message]); row=r[0];
  }

  await sql.query("INSERT INTO activity_log (project_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5,$6)",[projectId,access.user?.id||null,"Registro criado",resource,row?.id||null,JSON.stringify({resource})]);
  return Response.json({ item: row }, { status: 201 });
}

export async function PATCH(request: Request) {
  const access=await requireAdminAccess(); if(access.response)return access.response;
  const body=await request.json().catch(()=>null); const resource=typeof body?.resource==="string"?body.resource:""; const id=typeof body?.id==="string"?body.id:"";
  if(!validResource(resource)||resource==="activity"||!id)return Response.json({error:"Dados inválidos."},{status:400});
  const sql=getDb();
  let row:any;
  if(resource==="tasks"){const r=await sql.query("UPDATE tasks SET title=$1,description=$2,category=$3,status=$4,due_date=$5,sort_order=$6,completed_at=CASE WHEN $4='completed' THEN COALESCE(completed_at,NOW()) ELSE NULL END,updated_at=NOW() WHERE id=$7 RETURNING *",[String(body?.title||"").trim(),body?.description||null,body?.category||null,body?.status||"pending",body?.due_date||null,Number(body?.sort_order)||0,id]);row=r[0]}
  else if(resource==="milestones"){const r=await sql.query("UPDATE milestones SET title=$1,description=$2,milestone_date=$3,milestone_time=$4,sort_order=$5 WHERE id=$6 RETURNING *",[String(body?.title||"").trim(),body?.description||null,body?.milestone_date||null,body?.milestone_time||null,Number(body?.sort_order)||0,id]);row=r[0]}
  else if(resource==="budget"){const r=await sql.query("UPDATE budget_items SET description=$1,category=$2,supplier_id=$3,planned_amount=$4,approved_amount=$5,paid_amount=$6,approval=$7,notes=$8,updated_at=NOW() WHERE id=$9 RETURNING *",[String(body?.description||"").trim(),body?.category||null,body?.supplier_id||null,Number(body?.planned_amount)||0,Number(body?.approved_amount)||0,Number(body?.paid_amount)||0,body?.approval||"pending",body?.notes||null,id]);row=r[0]}
  else if(resource==="suppliers"){const r=await sql.query("UPDATE suppliers SET name=$1,category=$2,contact_name=$3,email=$4,phone=$5,status=$6,notes=$7,updated_at=NOW() WHERE id=$8 RETURNING *",[String(body?.name||"").trim(),body?.category||null,body?.contact_name||null,body?.email||null,body?.phone||null,body?.status||null,body?.notes||null,id]);row=r[0]}
  else if(resource==="team"){const r=await sql.query("UPDATE team_members SET name=$1,role=$2,email=$3,phone=$4,notes=$5 WHERE id=$6 RETURNING *",[String(body?.name||"").trim(),body?.role||null,body?.email||null,body?.phone||null,body?.notes||null,id]);row=r[0]}
  else if(resource==="guests"){const r=await sql.query("UPDATE guests SET name=$1,email=$2,phone=$3,status=$4,plus_ones=$5,notes=$6,updated_at=NOW() WHERE id=$7 RETURNING *",[String(body?.name||"").trim(),body?.email||null,body?.phone||null,body?.status||"pending",Number(body?.plus_ones)||0,body?.notes||null,id]);row=r[0]}
  else if(resource==="files"){const r=await sql.query("UPDATE files SET name=$1,storage_key=$2,mime_type=$3,size_bytes=$4,category=$5 WHERE id=$6 RETURNING *",[String(body?.name||"").trim(),String(body?.storage_key||"").trim(),body?.mime_type||null,body?.size_bytes?Number(body.size_bytes):null,body?.category||null,id]);row=r[0]}
  else if(resource==="messages"){const r=await sql.query("UPDATE messages SET body=$1 WHERE id=$2 RETURNING *",[String(body?.body||"").trim(),id]);row=r[0]}
  if(!row)return Response.json({error:"Registro não encontrado."},{status:404});
  await sql.query("INSERT INTO activity_log (project_id,actor_user_id,action,entity_type,entity_id,metadata) SELECT project_id,$1,'Registro atualizado',$2,id,$3::jsonb FROM "+({tasks:"tasks",milestones:"milestones",budget:"budget_items",suppliers:"suppliers",team:"team_members",guests:"guests",files:"files",messages:"messages"} as Record<string,string>)[resource]+" WHERE id=$4",[access.user?.id||null,resource,JSON.stringify({resource}),id]);
  return Response.json({item:row});
}

export async function DELETE(request: Request) {
  const access=await requireAdminAccess(); if(access.response)return access.response;
  const body=await request.json().catch(()=>null); const resource=typeof body?.resource==="string"?body.resource:""; const id=typeof body?.id==="string"?body.id:"";
  if(!validResource(resource)||resource==="activity"||!id)return Response.json({error:"Dados inválidos."},{status:400});
  const table=({tasks:"tasks",milestones:"milestones",budget:"budget_items",suppliers:"suppliers",team:"team_members",guests:"guests",files:"files",messages:"messages"} as Record<string,string>)[resource];
  const sql=getDb();
  const old=await sql.query("SELECT project_id FROM "+table+" WHERE id=$1 LIMIT 1",[id]);
  if(!old[0])return Response.json({error:"Registro não encontrado."},{status:404});
  await sql.query("DELETE FROM "+table+" WHERE id=$1",[id]);
  await sql.query("INSERT INTO activity_log (project_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'Registro excluído',$3,$4,$5)",[old[0].project_id,access.user?.id||null,resource,id,JSON.stringify({resource})]);
  return Response.json({deleted:id});
}
