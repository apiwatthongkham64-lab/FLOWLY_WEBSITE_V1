const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function db(){ const pool=getPool(); if(!pool) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return pool; }

async function getForMember(businessId, userId) {
  const result = await db().query(`
    SELECT b.id,b.name,b.slug,b.business_type,b.timezone,b.locale,b.status,b.settings,
           bm.role,bm.permissions,
           COALESCE(json_agg(json_build_object('code',d.code,'name',d.name,'enabled',bd.is_enabled)
             ORDER BY d.sort_order) FILTER (WHERE d.id IS NOT NULL),'[]'::json) AS departments
    FROM businesses b
    JOIN business_members bm ON bm.business_id=b.id AND bm.user_id=$2 AND bm.status='active'
    LEFT JOIN business_departments bd ON bd.business_id=b.id
    LEFT JOIN departments d ON d.id=bd.department_id
    WHERE b.id=$1
    GROUP BY b.id,bm.role,bm.permissions
  `,[businessId,userId]);
  return result.rows[0]||null;
}

async function updateProfile(businessId, values) {
  const result = await db().query(`
    UPDATE businesses SET
      name=COALESCE($2,name), business_type=COALESCE($3,business_type),
      timezone=COALESCE($4,timezone), locale=COALESCE($5,locale),
      settings=CASE WHEN $6::jsonb IS NULL THEN settings ELSE settings || $6::jsonb END
    WHERE id=$1 RETURNING id,name,slug,business_type,timezone,locale,status,settings,updated_at
  `,[businessId,values.name||null,values.businessType||null,values.timezone||null,values.locale||null,values.settings?JSON.stringify(values.settings):null]);
  return result.rows[0]||null;
}

async function findBySlug(slug){
  const result=await db().query('SELECT id,name,slug,status FROM businesses WHERE lower(slug)=lower($1) AND status IN (\'active\',\'trial\')',[slug]);
  return result.rows[0]||null;
}
module.exports={getForMember,updateProfile,findBySlug};
