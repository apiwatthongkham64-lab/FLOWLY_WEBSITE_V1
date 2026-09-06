const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function db(){ const p=getPool(); if(!p) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return p; }
async function list(businessId,{limit=50,offset=0,status,assignedTo}={}){
  const r=await db().query(`SELECT t.*, c.full_name AS customer_name, p.name AS project_name
    FROM tasks t LEFT JOIN customers c ON c.id=t.customer_id LEFT JOIN projects p ON p.id=t.project_id
    WHERE t.business_id=$1 AND ($4::text IS NULL OR t.status=$4) AND ($5::uuid IS NULL OR t.assigned_to=$5)
    ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, t.due_at NULLS LAST, t.created_at DESC
    LIMIT $2 OFFSET $3`,[businessId,Math.min(Number(limit)||50,100),Math.max(Number(offset)||0,0),status||null,assignedTo||null]);
  return r.rows;
}
async function create(businessId,input,actorUserId){
  const r=await db().query(`INSERT INTO tasks(business_id,project_id,service_request_id,customer_id,lead_id,title,description,status,priority,assigned_to,due_at,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [businessId,input.projectId||null,input.serviceRequestId||null,input.customerId||null,input.leadId||null,input.title,input.description||null,input.status||'todo',input.priority||'normal',input.assignedTo||null,input.dueAt||null,actorUserId||null]);
  await db().query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
    VALUES($1,$2,$3,'task',$4,'created','Task created',$5::jsonb)`,[businessId,actorUserId||null,input.customerId||null,r.rows[0].id,JSON.stringify({title:input.title,dueAt:input.dueAt||null})]);
  return r.rows[0];
}
async function update(businessId,id,input,actorUserId){
  const completedAt=input.status==='done' ? new Date().toISOString() : null;
  const r=await db().query(`UPDATE tasks SET status=COALESCE($3,status),priority=COALESCE($4,priority),assigned_to=COALESCE($5,assigned_to),due_at=COALESCE($6,due_at),description=COALESCE($7,description),completed_at=CASE WHEN $3='done' THEN COALESCE(completed_at,$8::timestamptz) WHEN $3 IS NOT NULL AND $3<>'done' THEN NULL ELSE completed_at END
    WHERE business_id=$1 AND id=$2 RETURNING *`,[businessId,id,input.status||null,input.priority||null,input.assignedTo||null,input.dueAt||null,input.description||null,completedAt]);
  if(r.rows[0]) await db().query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
    VALUES($1,$2,$3,'task',$4,'updated','Task updated',$5::jsonb)`,[businessId,actorUserId||null,r.rows[0].customer_id,id,JSON.stringify(input||{})]);
  return r.rows[0]||null;
}
module.exports={list,create,update};
