const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function db(){ const p=getPool(); if(!p) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return p; }
async function list(businessId,{limit=50,offset=0,status,from,to}={}){
  const r=await db().query(`SELECT b.*, c.full_name AS customer_name, d.code AS department_code
    FROM bookings b
    LEFT JOIN customers c ON c.id=b.customer_id
    LEFT JOIN departments d ON d.id=b.department_id
    WHERE b.business_id=$1
      AND ($4::text IS NULL OR b.status=$4)
      AND ($5::timestamptz IS NULL OR b.starts_at >= $5)
      AND ($6::timestamptz IS NULL OR b.starts_at <= $6)
    ORDER BY b.starts_at ASC LIMIT $2 OFFSET $3`,
    [businessId,Math.min(Number(limit)||50,100),Math.max(Number(offset)||0,0),status||null,from||null,to||null]);
  return r.rows;
}
async function create(businessId,input,actorUserId){
  const r=await db().query(`INSERT INTO bookings(business_id,customer_id,service_request_id,department_id,booking_type,starts_at,ends_at,status,assigned_to,notes,metadata)
    VALUES($1,$2,$3,(SELECT id FROM departments WHERE code=$4),$5,$6,$7,$8,$9,$10,$11::jsonb) RETURNING *`,
    [businessId,input.customerId||null,input.serviceRequestId||null,input.departmentCode||null,input.bookingType||'appointment',input.startsAt,input.endsAt||null,input.status||'pending',input.assignedTo||null,input.notes||null,JSON.stringify(input.metadata||{})]);
  await db().query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
    VALUES($1,$2,$3,'booking',$4,'created','Booking created',$5::jsonb)`,[businessId,actorUserId||null,input.customerId||null,r.rows[0].id,JSON.stringify({startsAt:input.startsAt})]);
  return r.rows[0];
}
async function update(businessId,id,input,actorUserId){
  const r=await db().query(`UPDATE bookings SET status=COALESCE($3,status),starts_at=COALESCE($4,starts_at),ends_at=COALESCE($5,ends_at),assigned_to=COALESCE($6,assigned_to),notes=COALESCE($7,notes)
    WHERE business_id=$1 AND id=$2 RETURNING *`,[businessId,id,input.status||null,input.startsAt||null,input.endsAt||null,input.assignedTo||null,input.notes||null]);
  if(r.rows[0]) await db().query(`INSERT INTO activity_log(business_id,actor_user_id,customer_id,entity_type,entity_id,action,summary,payload)
    VALUES($1,$2,$3,'booking',$4,'updated','Booking updated',$5::jsonb)`,[businessId,actorUserId||null,r.rows[0].customer_id,id,JSON.stringify(input||{})]);
  return r.rows[0]||null;
}
module.exports={list,create,update};
