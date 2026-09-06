const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function db(){ const p=getPool(); if(!p) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return p; }
async function list(businessId,{limit=50,offset=0,entityType,customerId}={}){
  const r=await db().query(`SELECT a.*,u.display_name AS actor_name,c.full_name AS customer_name
    FROM activity_log a LEFT JOIN users u ON u.id=a.actor_user_id LEFT JOIN customers c ON c.id=a.customer_id
    WHERE a.business_id=$1 AND ($4::text IS NULL OR a.entity_type=$4) AND ($5::uuid IS NULL OR a.customer_id=$5)
    ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,[businessId,Math.min(Number(limit)||50,100),Math.max(Number(offset)||0,0),entityType||null,customerId||null]);
  return r.rows;
}
module.exports={list};
