const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function pool(){ const p=getPool(); if(!p) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return p; }
async function confirmRequest({businessId,userId,requestId,startsAt,endsAt,assignedTo,taskDueAt,taskTitle}){
  const client=await pool().connect();
  try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT sr.*,d.code AS department_code FROM service_requests sr LEFT JOIN departments d ON d.id=sr.department_id WHERE sr.business_id=$1 AND sr.id=$2 FOR UPDATE`,[businessId,requestId]);
    const req=q.rows[0]; if(!req) throw new HttpError(404,'Service request not found','REQUEST_NOT_FOUND');
    if(['completed','cancelled'].includes(req.status)) throw new HttpError(409,'Request can no longer be confirmed','REQUEST_STATE_CONFLICT');
    const updated=(await client.query(`UPDATE service_requests SET status='confirmed',assigned_to=COALESCE($3,assigned_to) WHERE business_id=$1 AND id=$2 RETURNING *`,[businessId,requestId,assignedTo||null])).rows[0];
    if(req.lead_id) await client.query(`UPDATE leads SET stage=CASE WHEN stage='new' THEN 'qualified' ELSE stage END,next_follow_up_at=COALESCE($3,next_follow_up_at) WHERE business_id=$1 AND id=$2`,[businessId,req.lead_id,taskDueAt||null]);
    let booking=null;
    if(startsAt){ booking=(await client.query(`INSERT INTO bookings(business_id,customer_id,service_request_id,department_id,booking_type,starts_at,ends_at,status,assigned_to,notes,metadata)
      VALUES($1,$2,$3,$4,'appointment',$5,$6,'confirmed',$7,'Created from confirmed service request',$8::jsonb) RETURNING *`,[businessId,req.customer_id,requestId,req.department_id,startsAt,endsAt||null,assignedTo||null,JSON.stringify({source:'workflow_confirm'})])).rows[0]; }
    const followup=(await client.query(`INSERT INTO tasks(business_id,service_request_id,customer_id,lead_id,title,status,priority,assigned_to,due_at,created_by)
      VALUES($1,$2,$3,$4,$5,'todo','normal',$6,$7,$8) RETURNING *`,[businessId,requestId,req.customer_id,req.lead_id,taskTitle||`Follow up ${req.reference_no}`,assignedTo||userId||null,taskDueAt||null,userId||null])).rows[0];
    await client.query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
      VALUES($1,$2,$3,'service_request',$4,'confirmed','Request confirmed and workflow created',$5::jsonb)`,[businessId,userId||null,req.customer_id,requestId,JSON.stringify({bookingId:booking?.id||null,taskId:followup.id})]);
    await client.query('COMMIT'); return {request:updated,booking,followUpTask:followup};
  }catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
async function scheduleLeadFollowUp({businessId,userId,leadId,dueAt,assignedTo,title}){
  const client=await pool().connect();
  try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT * FROM leads WHERE business_id=$1 AND id=$2 FOR UPDATE`,[businessId,leadId]); const lead=q.rows[0];
    if(!lead) throw new HttpError(404,'Lead not found','LEAD_NOT_FOUND');
    await client.query(`UPDATE leads SET next_follow_up_at=$3,stage=CASE WHEN stage='new' THEN 'contacted' ELSE stage END WHERE business_id=$1 AND id=$2`,[businessId,leadId,dueAt]);
    const task=(await client.query(`INSERT INTO tasks(business_id,customer_id,lead_id,title,status,priority,assigned_to,due_at,created_by)
      VALUES($1,$2,$3,$4,'todo',$5,$6,$7,$8) RETURNING *`,[businessId,lead.customer_id,leadId,title||`Follow up: ${lead.title}`,lead.priority||'normal',assignedTo||userId||null,dueAt,userId||null])).rows[0];
    await client.query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
      VALUES($1,$2,$3,'lead',$4,'follow_up_scheduled','Lead follow-up scheduled',$5::jsonb)`,[businessId,userId||null,lead.customer_id,leadId,JSON.stringify({taskId:task.id,dueAt})]);
    await client.query('COMMIT'); return {leadId,task};
  }catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
module.exports={confirmRequest,scheduleLeadFollowUp};
