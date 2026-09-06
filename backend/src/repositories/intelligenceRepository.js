const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');
function db(){ const p=getPool(); if(!p) throw new HttpError(503,'PostgreSQL is not configured','DATABASE_NOT_CONFIGURED'); return p; }

async function snapshot(businessId, departmentCode){
  const p=db();
  const params=[businessId,departmentCode||null];
  const [leads,requests,tasks,bookings,activity,memories]=await Promise.all([
    p.query(`SELECT l.*,d.code AS department_code,c.full_name AS customer_name
      FROM leads l LEFT JOIN departments d ON d.id=l.department_id LEFT JOIN customers c ON c.id=l.customer_id
      WHERE l.business_id=$1 AND ($2::text IS NULL OR d.code=$2)
      ORDER BY l.created_at DESC LIMIT 250`,params),
    p.query(`SELECT sr.*,d.code AS department_code,c.full_name AS customer_name
      FROM service_requests sr LEFT JOIN departments d ON d.id=sr.department_id LEFT JOIN customers c ON c.id=sr.customer_id
      WHERE sr.business_id=$1 AND ($2::text IS NULL OR d.code=$2)
      ORDER BY sr.created_at DESC LIMIT 250`,params),
    p.query(`SELECT t.*,l.department_id,d.code AS department_code,c.full_name AS customer_name
      FROM tasks t LEFT JOIN leads l ON l.id=t.lead_id LEFT JOIN departments d ON d.id=l.department_id LEFT JOIN customers c ON c.id=t.customer_id
      WHERE t.business_id=$1 AND ($2::text IS NULL OR d.code=$2 OR l.id IS NULL)
      ORDER BY t.created_at DESC LIMIT 250`,params),
    p.query(`SELECT b.*,d.code AS department_code,c.full_name AS customer_name
      FROM bookings b LEFT JOIN departments d ON d.id=b.department_id LEFT JOIN customers c ON c.id=b.customer_id
      WHERE b.business_id=$1 AND ($2::text IS NULL OR d.code=$2)
      ORDER BY b.starts_at ASC LIMIT 250`,params),
    p.query(`SELECT a.* FROM activity_log a WHERE a.business_id=$1 ORDER BY a.created_at DESC LIMIT 300`,[businessId]),
    p.query(`SELECT cm.*,c.full_name AS customer_name FROM customer_memory cm JOIN customers c ON c.id=cm.customer_id
      WHERE cm.business_id=$1 AND cm.is_active=true ORDER BY cm.updated_at DESC LIMIT 250`,[businessId])
  ]);
  return {leads:leads.rows,requests:requests.rows,tasks:tasks.rows,bookings:bookings.rows,activity:activity.rows,memories:memories.rows};
}

async function upsertInsight(businessId, insight){
  const r=await db().query(`INSERT INTO ai_insights
    (business_id,customer_id,department_id,insight_type,title,summary,priority,score,recommendation,status,evidence,expires_at,source_key,generated_by)
    VALUES($1,$2,(SELECT id FROM departments WHERE code=$3),$4,$5,$6,$7,$8,$9,'open',$10::jsonb,$11,$12,$13)
    ON CONFLICT (business_id,source_key) WHERE source_key IS NOT NULL AND status='open'
    DO UPDATE SET customer_id=EXCLUDED.customer_id,department_id=EXCLUDED.department_id,insight_type=EXCLUDED.insight_type,
      title=EXCLUDED.title,summary=EXCLUDED.summary,priority=EXCLUDED.priority,score=EXCLUDED.score,
      recommendation=EXCLUDED.recommendation,evidence=EXCLUDED.evidence,expires_at=EXCLUDED.expires_at,
      generated_by=EXCLUDED.generated_by,updated_at=now()
    RETURNING *`,[businessId,insight.customerId||null,insight.departmentCode||null,insight.type,insight.title,insight.summary,
      insight.priority||'normal',insight.score??null,insight.recommendation||null,JSON.stringify(insight.evidence||[]),insight.expiresAt||null,
      insight.sourceKey||null,insight.generatedBy||'flowly_rules_v1']);
  return r.rows[0];
}

async function listInsights(businessId,{department,status='open',limit=50}={}){
  const r=await db().query(`SELECT ai.*,d.code AS department_code,c.full_name AS customer_name
    FROM ai_insights ai LEFT JOIN departments d ON d.id=ai.department_id LEFT JOIN customers c ON c.id=ai.customer_id
    WHERE ai.business_id=$1 AND ($2::text IS NULL OR d.code=$2) AND ($3::text IS NULL OR ai.status=$3)
    ORDER BY CASE ai.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, ai.score DESC NULLS LAST, ai.created_at DESC
    LIMIT $4`,[businessId,department||null,status||null,Math.min(Number(limit)||50,100)]);
  return r.rows;
}

async function updateStatus(businessId,id,status){
  const r=await db().query(`UPDATE ai_insights SET status=$3,updated_at=now() WHERE business_id=$1 AND id=$2 RETURNING *`,[businessId,id,status]);
  return r.rows[0]||null;
}

module.exports={snapshot,upsertInsight,listInsights,updateStatus};
