const { getPool }=require('../config/db');
const { HttpError }=require('../utils/httpError');
function db(){const p=getPool();if(!p)throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED');return p;}
async function list(businessId,{limit=50,offset=0,q=''}){
 const vals=[businessId,Math.min(Number(limit)||50,100),Math.max(Number(offset)||0,0),`%${q}%`];
 const r=await db().query(`SELECT id,full_name,email,phone,status,tags,last_contact_at,created_at,updated_at FROM customers
 WHERE business_id=$1 AND ($4='' OR full_name ILIKE $4 OR COALESCE(email,'') ILIKE $4 OR COALESCE(phone,'') ILIKE $4)
 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,vals); return r.rows;
}
async function create(businessId,input){
 const r=await db().query(`INSERT INTO customers(business_id,full_name,email,phone,preferred_channel,tags,profile)
 VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,[businessId,input.fullName,input.email||null,input.phone||null,input.preferredChannel||null,input.tags||[],JSON.stringify(input.profile||{})]);return r.rows[0];
}
async function update(businessId,id,input){
 const r=await db().query(`UPDATE customers SET full_name=COALESCE($3,full_name),email=COALESCE($4,email),phone=COALESCE($5,phone),status=COALESCE($6,status),tags=COALESCE($7,tags),profile=CASE WHEN $8::jsonb IS NULL THEN profile ELSE profile||$8::jsonb END WHERE business_id=$1 AND id=$2 RETURNING *`,[businessId,id,input.fullName||null,input.email||null,input.phone||null,input.status||null,input.tags||null,input.profile?JSON.stringify(input.profile):null]); return r.rows[0]||null;
}
module.exports={list,create,update};
