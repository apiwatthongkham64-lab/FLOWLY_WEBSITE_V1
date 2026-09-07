(function(){
  'use strict';
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const configs=[
    ['spa-', 'Spa & Wellness', 'spa-admin-demo.html', 'confirmBooking'],
    ['beauty-', 'Beauty & Salon', 'beauty-admin-demo.html', 'confirmBooking'],
    ['clinic-', 'Clinic & Healthcare', 'clinic-admin-demo.html', 'confirmBooking'],
    ['hotel-', 'Hotel & Hospitality', 'hotel-admin-demo.html', 'confirmBooking'],
    ['restaurant-', 'Food & Restaurant', 'restaurant-admin-demo.html', 'confirmReservation'],
    ['construction-', 'Construction & Services', 'construction-admin-demo.html', 'confirmReservation'],
    ['professional-', 'Professional Business', 'professional-admin-demo.html', 'confirmConsultation']
  ];
  const cfg=configs.find(x=>file.startsWith(x[0]));
  if(!cfg || !file.includes('customer-demo')) return;
  const [,department,adminPage,confirmFn]=cfg;
  const content=document.getElementById('bookingContent')||document.getElementById('requestContent');
  const confirmation=document.getElementById('confirmation');
  if(!content||!confirmation) return;
  const storageKey='flowly-demo-contact-'+cfg[0];

  function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  function saved(){try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch(e){return {}}}
  function formHTML(){const d=saved();return `
    <div class="flowly-contact-form" id="flowlyContactForm">
      <h5 class="flowly-contact-form__title">ข้อมูลสำหรับยืนยัน Demo</h5>
      <p class="flowly-contact-form__hint">กรอกข้อมูลตัวอย่างเพื่อทดลองขั้นตอนก่อนส่งต่อไปยัง Business Admin · ข้อมูลอยู่ใน Browser เครื่องนี้เท่านั้น</p>
      <div class="flowly-form-grid">
        <div class="flowly-field"><label>ชื่อผู้ติดต่อ *</label><input id="flowlyName" autocomplete="name" value="${esc(d.name)}" placeholder="เช่น Apiwat"></div>
        <div class="flowly-field"><label>เบอร์โทร *</label><input id="flowlyPhone" inputmode="tel" autocomplete="tel" value="${esc(d.phone)}" placeholder="08x-xxx-xxxx"></div>
        <div class="flowly-field full"><label>อีเมล</label><input id="flowlyEmail" type="email" autocomplete="email" value="${esc(d.email)}" placeholder="name@business.com"></div>
        <div class="flowly-field full"><label>รายละเอียดเพิ่มเติม</label><textarea id="flowlyNote" placeholder="สิ่งที่ต้องการแจ้งทีมงานเพิ่มเติม">${esc(d.note)}</textarea></div>
      </div>
      <label class="flowly-consent"><input id="flowlyConsent" type="checkbox" ${d.consent?'checked':''}> <span>ยืนยันว่าเป็นการทดลอง Demo เท่านั้น ยังไม่มีการส่งข้อมูลไปยัง Server หรือการชำระเงินจริง</span></label>
      <div class="flowly-form-error" id="flowlyFormError">กรุณากรอกชื่อ เบอร์โทรที่ถูกต้อง และยืนยัน Demo ก่อนดำเนินการต่อ</div>
      <div class="flowly-demo-badge">● FRONTEND DEMO · LOCAL ONLY</div>
    </div>`}
  function mount(){
    if(document.getElementById('flowlyContactForm')) return;
    const confirmButton=[...content.querySelectorAll('button')].find(b=>/ยืนยัน|ส่งคำขอ/.test(b.textContent||''));
    if(!confirmButton) return;
    const actions=confirmButton.closest('.booking-actions,.request-actions');
    if(actions) actions.insertAdjacentHTML('beforebegin',formHTML());
    else content.insertAdjacentHTML('beforeend',formHTML());
  }
  function validate(){
    mount();
    const name=document.getElementById('flowlyName'), phone=document.getElementById('flowlyPhone'), email=document.getElementById('flowlyEmail'), note=document.getElementById('flowlyNote'), consent=document.getElementById('flowlyConsent'), err=document.getElementById('flowlyFormError');
    if(!name||!phone||!consent) return false;
    [name,phone].forEach(x=>x.classList.remove('error'));
    const digits=phone.value.replace(/\D/g,'');
    let ok=true;
    if(name.value.trim().length<2){name.classList.add('error');ok=false}
    if(digits.length<9||digits.length>10){phone.classList.add('error');ok=false}
    if(!consent.checked) ok=false;
    if(err) err.classList.toggle('show',!ok);
    if(!ok){document.getElementById('flowlyContactForm')?.scrollIntoView({behavior:'smooth',block:'center'});return false}
    const payload={name:name.value.trim(),phone:phone.value.trim(),email:(email?.value||'').trim(),note:(note?.value||'').trim(),consent:true,department,updatedAt:new Date().toISOString()};
    localStorage.setItem(storageKey,JSON.stringify(payload));
    const ref='FL-'+Date.now().toString(36).toUpperCase().slice(-6);
    sessionStorage.setItem('flowly-demo-ref',ref);
    sessionStorage.setItem('flowly-demo-name',payload.name);
    submitToApi(payload, ref);
    return true;
  }

  function departmentKey(){return cfg[0].replace('-','');}
  async function submitToApi(payload, ref){
    if(!window.FlowlyAPI?.createPublicRequest) return;
    try{
      const result=await window.FlowlyAPI.createPublicRequest({
        businessSlug: window.FLOWLY_BUSINESS_SLUG || 'flowly-demo',
        department: departmentKey(),
        requestType: departmentKey()==='restaurant'?'reservation':(departmentKey()==='professional'?'consultation':'inquiry'),
        referenceNo: ref,
        contact:{name:payload.name,phone:payload.phone,email:payload.email},
        summary: payload.note || `${department} Customer Front request`,
        details:{department,label:department,note:payload.note,source:'flowly-static-demo'}
      });
      sessionStorage.setItem('flowly-api-sync','synced');
      if(result?.data?.referenceNo) sessionStorage.setItem('flowly-demo-ref',result.data.referenceNo);
    }catch(_error){
      sessionStorage.setItem('flowly-api-sync','local-fallback');
    }
  }

  const original=window[confirmFn];
  if(typeof original==='function'){
    window[confirmFn]=function(){
      if(!validate()) return;
      original.apply(this,arguments);
      setTimeout(enhanceConfirmation,0);
    };
  }
  function enhanceConfirmation(){
    if(!confirmation || confirmation.querySelector('.flowly-confirm-meta')) return;
    const d=saved(), ref=sessionStorage.getItem('flowly-demo-ref')||'FLOWLY-DEMO';
    const button=confirmation.querySelector('button');
    const block=document.createElement('div');
    block.className='flowly-confirm-meta';
    block.innerHTML=`<b>Demo Reference:</b> ${esc(ref)}<br><b>ผู้ติดต่อ:</b> ${esc(d.name)} · ${esc(d.phone)}<br><b>สถานะ:</b> พร้อมส่งต่อ Workflow ไปยัง Business Admin`;
    if(button) confirmation.insertBefore(block,button); else confirmation.appendChild(block);
    const link=document.createElement('a');link.className='flowly-admin-link';link.href=adminPage;link.textContent='ดูข้อมูลฝั่ง Business Admin →';confirmation.appendChild(link);
  }
  const obs=new MutationObserver(mount);obs.observe(content,{childList:true,subtree:true});mount();
})();
