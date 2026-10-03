import { requireAdminAccess } from "@/lib/authz";
import { getDb } from "@/db/client";
export const runtime = "nodejs";
const statuses=["planning","production","event_day","completed","cancelled"] as const;
const clean=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number(v)||0;
export async function GET(){
 const access=await requireAdminAccess(); if(access.response)return access.response; const sql=getDb();
 const projects=await sql\`SELECT p.id,p.name,p.event_type,p.status,p.event_date,p.event_time,p.city,p.venue,p.description,p.budget_planned,p.budget_approved,p.guest_target,p.guest_confirmed,p.progress,p.client_id,c.name AS client_name,c.company_name AS client_company,COUNT(t.id)::int AS task_count,COUNT(t.id) FILTER(WHERE t.status='completed')::int AS completed_task_count FROM projects p LEFT JOIN clients c ON c.id=p.client_id LEFT JOIN tasks t ON t.project_id=p.id GROUP BY p.id,c.name,c.company_name ORDER BY p.event_date NULLS LAST,p.created_at DESC\`;
 return Response.json({projects});
}
export async function POST(request:Request){
 const access=await requireAdminAccess(); if(access.response)return access.response; const body=await request.json().catch(()=>null);
 const name=clean(body?.name),eventType=clean(body?.event_type),city=clean(body?.city),venue=clean(body?.venue),description=clean(body?.description),status=clean(body?.status)||"planning",eventDate=clean(body?.event_date),eventTime=clean(body?.event_time),clientId=clean(body?.client_id);
 const budgetPlanned=num(body?.budget_planned),budgetApproved=num(body?.budget_approved),guestTarget=Math.max(0,num(body?.guest_target)),progress=Math.min(100,Math.max(0,num(body?.progress)));
 if(!name)return Response.json({error:"Nome do projeto é obrigatório."},{status:400});
 if(!statuses.includes(status as typeof statuses[number]))return Response.json({error:"Status inválido."},{status:400});
 const sql=getDb();
 if(clientId){const c=await sql\`SELECT id FROM clients WHERE id=${clientId} LIMIT 1\`;if(!c[0])return Response.json({error:"Cliente não encontrado."},{status:400});}
 const rows=await sql\`INSERT INTO projects(client_id,name,event_type,status,event_date,event_time,city,venue,description,budget_planned,budget_approved,guest_target,progress) VALUES(${clientId||null},${name},${eventType||null},${status},${eventDate||null},${eventTime||null},${city||null},${venue||null},${description||null},${budgetPlanned},${budgetApproved},${guestTarget},${progress}) RETURNING id,name,event_type,status,event_date,event_time,city,venue,description,budget_planned,budget_approved,guest_target,guest_confirmed,progress,client_id\`;
 const project=rows[0];
 await sql\`INSERT INTO activity_log(actor_user_id,action,entity_type,entity_id,metadata) VALUES(${access.user?.id??null},'Projeto criado','project',${project.id},${JSON.stringify({name,client_id:clientId||null})}::jsonb)\`;
 return Response.json({project},{status:201});
}
export async function PATCH(request:Request){
 const access=await requireAdminAccess(); if(access.response)return access.response; const body=await request.json().catch(()=>null),id=clean(body?.id);
 if(!id)return Response.json({error:"ID do projeto é obrigatório."},{status:400});
 const name=clean(body?.name),eventType=clean(body?.event_type),city=clean(body?.city),venue=clean(body?.venue),description=clean(body?.description),status=clean(body?.status)||"planning",eventDate=clean(body?.event_date),eventTime=clean(body?.event_time),clientId=clean(body?.client_id);
 const budgetPlanned=num(body?.budget_planned),budgetApproved=num(body?.budget_approved),guestTarget=Math.max(0,num(body?.guest_target)),progress=Math.min(100,Math.max(0,num(body?.progress)));
 if(!name)return Response.json({error:"Nome do projeto é obrigatório."},{status:400});
 if(!statuses.includes(status as typeof statuses[number]))return Response.json({error:"Status inválido."},{status:400});
 const sql=getDb();
 if(clientId){const c=await sql\`SELECT id FROM clients WHERE id=${clientId} LIMIT 1\`;if(!c[0])return Response.json({error:"Cliente não encontrado."},{status:400});}
 const rows=await sql\`UPDATE projects SET client_id=${clientId||null},name=${name},event_type=${eventType||null},status=${status},event_date=${eventDate||null},event_time=${eventTime||null},city=${city||null},venue=${venue||null},description=${description||null},budget_planned=${budgetPlanned},budget_approved=${budgetApproved},guest_target=${guestTarget},progress=${progress},updated_at=NOW() WHERE id=${id} RETURNING id,name,event_type,status,event_date,event_time,city,venue,description,budget_planned,budget_approved,guest_target,guest_confirmed,progress,client_id\`;
 if(!rows[0])return Response.json({error:"Projeto não encontrado."},{status:404});
 await sql\`INSERT INTO activity_log(actor_user_id,action,entity_type,entity_id,metadata) VALUES(${access.user?.id??null},'Projeto atualizado','project',${id},${JSON.stringify({name})}::jsonb)\`;
 return Response.json({project:rows[0]});
}
export async function DELETE(request:Request){
 const access=await requireAdminAccess(); if(access.response)return access.response; const body=await request.json().catch(()=>null),id=clean(body?.id);
 if(!id)return Response.json({error:"ID do projeto é obrigatório."},{status:400}); const sql=getDb();
 const rows=await sql\`DELETE FROM projects WHERE id=${id} RETURNING id,name\`;
 if(!rows[0])return Response.json({error:"Projeto não encontrado."},{status:404});
 await sql\`INSERT INTO activity_log(actor_user_id,action,entity_type,entity_id,metadata) VALUES(${access.user?.id??null},'Projeto excluído','project',${id},${JSON.stringify({name:rows[0].name})}::jsonb)\`;
 return Response.json({deleted:true});
}