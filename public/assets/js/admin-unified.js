(function(){
  'use strict';
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const cfg={
    'spa-admin-demo.html':{name:'Spa & Wellness',key:'spa-',core:['Dashboard','CRM','Bookings','Team','Services','Reports','AI']},
    'beauty-admin-demo.html':{name:'Beauty & Salon',key:'beauty-',core:['Dashboard','CRM','Bookings','Team','Services','Reports','AI']},
    'clinic-admin-demo.html':{name:'Clinic & Healthcare',key:'clinic-',core:['Dashboard','CRM','Appointments','Team','Services','Reports','AI']},
    'hotel-admin-demo.html':{name:'Hotel & Hospitality',key:'hotel-',core:['Dashboard','CRM','Reservations','Operations','Services','Reports','AI']},
    'restaurant-admin-demo.html':{name:'Food & Restaurant',key:'restaurant-',core:['Dashboard','CRM','Orders','Operations','Menu','Reports','AI']},
    'construction-admin-demo.html':{name:'Construction & Services',key:'construction-',core:['Dashboard','CRM','Quotations','Projects','Services','Reports','AI']},
    'professional-admin-demo.html':{name:'Professional Business',key:'professional-',core:['Dashboard','CRM','Proposals','Projects','Services','Reports','AI']}
  }[file];
  if(!cfg) return;
  const content=document.querySelector('.content'); if(!content) return;
  const bar=document.createElement('div'); bar.className='flowly-admin-standard';
  bar.innerHTML=`<div class="flowly-admin-standard__left"><div class="flowly-admin-standard__mark">F</div><div class="flowly-admin-standard__text"><strong>FLOWLY UNIFIED ADMIN</strong><span>${cfg.name} · shared business operating structure</span></div></div><div class="flowly-admin-modules">${cfg.core.map((x,i)=>`<span class="${i===0?'active':''}">${x}</span>`).join('')}</div>`;
  content.insertBefore(bar,content.firstChild);
  const req=document.createElement('div'); req.className='flowly-front-request'; req.id='flowlyFrontRequest';
  bar.insertAdjacentElement('afterend',req);
  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  try{
    const d=JSON.parse(localStorage.getItem('flowly-demo-contact-'+cfg.key)||'{}');
    if(d && d.name){
      const when=d.updatedAt?new Date(d.updatedAt).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'}):'-';
      req.innerHTML=`<div class="flowly-front-request__top"><strong>LATEST CUSTOMER FRONT REQUEST</strong><span class="flowly-front-request__badge">Demo data received</span></div><div class="flowly-front-request__grid"><div class="flowly-front-request__item"><small>Contact</small><b>${esc(d.name)}</b></div><div class="flowly-front-request__item"><small>Phone</small><b>${esc(d.phone)}</b></div><div class="flowly-front-request__item"><small>Email</small><b>${esc(d.email||'-')}</b></div><div class="flowly-front-request__item"><small>Updated</small><b>${esc(when)}</b></div><div class="flowly-front-request__item flowly-front-request__note"><small>Note</small><b>${esc(d.note||'ไม่มีรายละเอียดเพิ่มเติม')}</b></div></div>`;
      req.classList.add('show');
    }
  }catch(e){}
  const navButtons=[...document.querySelectorAll('#nav button')];
  function syncCore(){
    const active=navButtons.find(b=>b.classList.contains('active'));
    const id=(active&&active.dataset.view)||'overview';
    const map={overview:0,customers:1,guests:1,clients:1,bookings:2,reservations:2,quotations:2,therapists:3,stylists:3,rooms:3,projects:3,services:4,reports:5,ai:6};
    const idx=map[id]??0; document.querySelectorAll('.flowly-admin-modules span').forEach((x,i)=>x.classList.toggle('active',i===idx));
    try{localStorage.setItem('flowly-admin-last-'+cfg.key,id)}catch(e){}
  }
  navButtons.forEach(b=>b.addEventListener('click',()=>setTimeout(syncCore,0)));
  window.addEventListener('hashchange',()=>setTimeout(syncCore,0)); syncCore();
  const note=document.createElement('div'); note.className='flowly-admin-footer-note'; note.textContent='FLOWLY Demo · Unified Admin Foundation · Frontend only — backend connection comes next'; content.appendChild(note);
})();
