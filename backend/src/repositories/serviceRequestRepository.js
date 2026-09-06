const { getPool }=require('../config/db');const { HttpError }=require('../utils/httpError');
function db(){const p=getPool();if(!p)throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED');return p;}
async function createPublic({businessId,departmentCode,contact,requestType,summary,details,requestedFor,referenceNo}){
 const pool=db(); const client=await pool.connect();
 try{await client.query('BEGIN');
   let customerId=null;
   const match=await client.query(`SELECT id FROM customers WHERE business_id=$1 AND ((NULLIF($2,'') IS NOT NULL AND phone=$2) OR (NULLIF($3,'') IS NOT NULL AND lower(email)=lower($3))) ORDER BY updated_at DESC LIMIT 1`,[businessId,contact.phone||'',contact.email||'']);
   if(match.rows[0]) customerId=match.rows[0].id;
   else {const c=await client.query(`INSERT INTO customers(business_id,full_name,email,phone,preferred_channel,profile) VALUES($1,$2,$3,$4,'phone',$5::jsonb) RETURNING id`,[businessId,contact.name,contact.email||null,contact.phone||null,JSON.stringify({source:'customer_front'})]); customerId=c.rows[0].id;}
   const lead=await client.query(`INSERT INTO leads(business_id,customer_id,department_id,source,title,description,stage,priority,metadata) VALUES($1,$2,(SELECT id FROM departments WHERE code=$3),'customer_front',$4,$5,'new','normal',$6::jsonb) RETURNING id`,[businessId,customerId,departmentCode,summary||requestType,summary||null,JSON.stringify({referenceNo,requestType})]);
   const r=await client.query(`INSERT INTO service_requests(business_id,customer_id,lead_id,department_id,request_type,reference_no,status,requested_for,summary,details,source) VALUES($1,$2,$3,(SELECT id FROM departments WHERE code=$4),$5,$6,'new',$7,$8,$9::jsonb,'customer_front') RETURNING *`,[businessId,customerId,lead.rows[0].id,departmentCode,requestType,referenceNo,requestedFor||null,summary||null,JSON.stringify(details||{})]);
   await client.query(`INSERT INTO activity_log(business_id,customer_id,entity_type,entity_id,action,summary,payload) VALUES($1,$2,'service_request',$3,'created','Customer Front request created',$4::jsonb)`,[businessId,customerId,r.rows[0].id,JSON.stringify({referenceNo,departmentCode,leadId:lead.rows[0].id})]);
   await client.query('COMMIT');return r.rows[0];
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
async function list(businessId,{limit=50,offset=0,status}){const r=await db().query(`SELECT sr.*,d.code AS department_code,c.full_name AS customer_name,c.email AS customer_email,c.phone AS customer_phone FROM service_requests sr LEFT JOIN departments d ON d.id=sr.department_id LEFT JOIN customers c ON c.id=sr.customer_id WHERE sr.business_id=$1 AND ($4::text IS NULL OR sr.status=$4) ORDER BY sr.created_at DESC LIMIT $2 OFFSET $3`,[businessId,Math.min(Number(limit)||50,100),Math.max(Number(offset)||0,0),status||null]);return r.rows;}
module.exports={createPublic,list};
