const repo=require('../repositories/intelligenceRepository');

const departmentAliases={
  spa:'spa_wellness',beauty:'beauty_salon',clinic:'clinic_healthcare',hotel:'hotel_hospitality',
  restaurant:'food_restaurant',construction:'construction_services',professional:'professional_business'
};
const departmentLabels={
  spa_wellness:'Spa & Wellness',beauty_salon:'Beauty & Salon',clinic_healthcare:'Clinic & Healthcare',
  hotel_hospitality:'Hotel & Hospitality',food_restaurant:'Food & Restaurant',construction_services:'Construction & Services',professional_business:'Professional Business'
};
function normalizeDepartment(value){return departmentAliases[value]||value||null;}
function hoursUntil(value){if(!value)return null;return (new Date(value).getTime()-Date.now())/3600000;}
function daysSince(value){if(!value)return null;return (Date.now()-new Date(value).getTime())/86400000;}
function priorityFor(score){return score>=90?'urgent':score>=75?'high':score>=45?'normal':'low';}
function clamp(n){return Math.max(0,Math.min(100,Math.round(n)));}

function buildLeadInsights(rows,departmentCode){
  const out=[];
  for(const l of rows){
    if(['won','lost'].includes(l.stage))continue;
    let score=20;
    if(l.priority==='urgent')score+=35; else if(l.priority==='high')score+=25; else if(l.priority==='normal')score+=10;
    if(l.stage==='proposal')score+=30; else if(l.stage==='qualified')score+=22; else if(l.stage==='contacted')score+=12;
    const follow=hoursUntil(l.next_follow_up_at); if(follow!==null&&follow<0)score+=30; else if(follow!==null&&follow<=24)score+=22;
    const age=daysSince(l.updated_at||l.created_at); if(age!==null&&age>3)score+=Math.min(18,age*2);
    score=clamp(score);
    if(score<55)continue;
    const overdue=follow!==null&&follow<0;
    out.push({sourceKey:`lead:${l.id}`,type:'lead_priority',customerId:l.customer_id,departmentCode:l.department_code||departmentCode,
      title:overdue?'Lead follow-up overdue':'Lead needs attention',
      summary:`${l.customer_name||l.title} · stage ${l.stage} · priority ${l.priority}`,
      priority:priorityFor(score),score,
      recommendation:overdue?'Follow up now, review the latest customer context, then set the next concrete step.':'Review this lead today and move it to the next clear stage.',
      evidence:[{kind:'lead',id:l.id,stage:l.stage,priority:l.priority,nextFollowUpAt:l.next_follow_up_at,updatedAt:l.updated_at}]});
  }
  return out;
}
function buildTaskInsights(rows,departmentCode){
  const out=[];
  for(const t of rows){if(['done','cancelled'].includes(t.status))continue;const due=hoursUntil(t.due_at);let score=t.priority==='urgent'?70:t.priority==='high'?55:35;if(due!==null&&due<0)score+=35;else if(due!==null&&due<=24)score+=25;else if(due!==null&&due<=48)score+=15;score=clamp(score);if(score<60)continue;
    out.push({sourceKey:`task:${t.id}`,type:'task_risk',customerId:t.customer_id,departmentCode:t.department_code||departmentCode,title:due!==null&&due<0?'Task overdue':'Task deadline approaching',summary:`${t.title}${t.customer_name?` · ${t.customer_name}`:''}`,priority:priorityFor(score),score,recommendation:due!==null&&due<0?'Resolve or reassign this task now and record the next action.':'Confirm owner and completion plan before the deadline.',evidence:[{kind:'task',id:t.id,status:t.status,priority:t.priority,dueAt:t.due_at}]});
  }return out;
}
function buildRequestInsights(rows,departmentCode){
  const out=[];for(const r of rows){if(['completed','cancelled'].includes(r.status))continue;const age=daysSince(r.updated_at||r.created_at);let score=r.status==='new'?55:r.status==='reviewing'?48:30;if(age!==null&&age>1)score+=Math.min(35,age*8);score=clamp(score);if(score<60)continue;out.push({sourceKey:`request:${r.id}`,type:'request_follow_up',customerId:r.customer_id,departmentCode:r.department_code||departmentCode,title:r.status==='new'?'New customer request needs review':'Customer request is waiting',summary:`${r.reference_no} · ${r.customer_name||'Customer'} · ${r.status}`,priority:priorityFor(score),score,recommendation:'Review the request, confirm the next step, and create a booking or follow-up task if appropriate.',evidence:[{kind:'service_request',id:r.id,status:r.status,referenceNo:r.reference_no,createdAt:r.created_at}]});}return out;
}
function buildBookingInsights(rows,departmentCode){
  const upcoming=rows.filter(b=>!['completed','cancelled','no_show'].includes(b.status)).map(b=>({...b,h:hoursUntil(b.starts_at)})).filter(b=>b.h!==null&&b.h>=0&&b.h<=24);
  if(!upcoming.length)return[];const score=clamp(45+Math.min(50,upcoming.length*8));return[{sourceKey:`booking-window:${departmentCode||'all'}:${new Date().toISOString().slice(0,10)}`,type:'operational_load',departmentCode,title:'Upcoming booking workload',summary:`${upcoming.length} booking(s) start within the next 24 hours.`,priority:priorityFor(score),score,recommendation:'Confirm readiness, assignments, and any unresolved customer requests before the busiest window.',evidence:upcoming.slice(0,10).map(b=>({kind:'booking',id:b.id,startsAt:b.starts_at,status:b.status,customer:b.customer_name}))}];
}
function buildMemorySignal(memories,departmentCode){
  if(!memories.length)return null;return{sourceKey:`memory:${departmentCode||'all'}:${new Date().toISOString().slice(0,10)}`,type:'customer_memory',departmentCode,title:'Customer context is available',summary:`FLOWLY has ${memories.length} active customer memory item(s) available for more relevant follow-up.`,priority:'normal',score:52,recommendation:'Use recent customer context before contacting high-priority customers. Do not expose sensitive notes outside authorized staff.',evidence:memories.slice(0,5).map(m=>({kind:'customer_memory',customerId:m.customer_id,memoryType:m.memory_type,memoryKey:m.memory_key}))};
}

async function generate({businessId,department}){
  const departmentCode=normalizeDepartment(department);const data=await repo.snapshot(businessId,departmentCode);
  const candidates=[...buildLeadInsights(data.leads,departmentCode),...buildTaskInsights(data.tasks,departmentCode),...buildRequestInsights(data.requests,departmentCode),...buildBookingInsights(data.bookings,departmentCode)];
  const mem=buildMemorySignal(data.memories,departmentCode);if(mem)candidates.push(mem);
  candidates.sort((a,b)=>(b.score||0)-(a.score||0));
  const saved=[];for(const item of candidates.slice(0,25))saved.push(await repo.upsertInsight(businessId,item));
  return {department:departmentCode,label:departmentLabels[departmentCode]||'All Departments',generatedAt:new Date().toISOString(),counts:{leads:data.leads.length,requests:data.requests.length,tasks:data.tasks.length,bookings:data.bookings.length,activity:data.activity.length,memories:data.memories.length},insights:saved};
}

async function overview({businessId,department,refresh=false}){
  const departmentCode=normalizeDepartment(department);if(refresh)await generate({businessId,department:departmentCode});
  let insights=await repo.listInsights(businessId,{department:departmentCode,status:'open',limit:20});
  if(!insights.length){await generate({businessId,department:departmentCode});insights=await repo.listInsights(businessId,{department:departmentCode,status:'open',limit:20});}
  const top=insights[0]||null;return{businessId,department:departmentCode,label:departmentLabels[departmentCode]||'All Departments',generatedAt:new Date().toISOString(),mode:'real_business_data',priorityScore:top?.score??0,nextBestAction:top?.recommendation||'No urgent action detected. Continue normal operations.',topInsight:top,insights,automation:{status:'preview_only',requiresApproval:true}};
}
module.exports={generate,overview,normalizeDepartment};
