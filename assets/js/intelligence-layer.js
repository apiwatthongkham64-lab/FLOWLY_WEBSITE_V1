(function(){
  'use strict';
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const config={
    'spa-admin-demo.html':{
      dept:'Spa & Wellness', signal:'Evening demand rising', score:86,
      insight:'ช่วง 18:00–20:00 มีแนวโน้มคิวแน่นกว่าปกติ',
      reason:'Aroma Massage และลูกค้ากลับมาใช้บริการหลังเลิกงานมีสัดส่วนสูงขึ้น',
      actions:['เปิด Slot เพิ่ม 2 ช่วงเวลา','เตรียม Therapist เพิ่ม 1 คน','ส่ง Follow-up ลูกค้าเก่า 7 ราย'],
      memory:'จำบริการโปรด ช่วงเวลาที่สะดวก Therapist ที่เคยใช้ และประวัติการกลับมาใช้บริการ'
    },
    'beauty-admin-demo.html':{
      dept:'Beauty & Salon', signal:'Follow-up opportunity', score:83,
      insight:'มีลูกค้า 9 รายถึงรอบติดตามหลังบริการในสัปดาห์นี้',
      reason:'ประวัติบริการและรอบการกลับมาใช้บริการบ่งชี้โอกาสจองซ้ำสูง',
      actions:['ส่งข้อความ Follow-up แบบส่วนตัว','เสนอ Slot ที่ Stylist เดิมว่าง','จัดกลุ่มลูกค้าที่มีโอกาสกลับมาสูง'],
      memory:'จำทรง/บริการที่เคยทำ Stylist ที่ชอบ ความถี่การใช้บริการ และ Note สำคัญ'
    },
    'clinic-admin-demo.html':{
      dept:'Clinic & Healthcare', signal:'Operational follow-up', score:80,
      insight:'มี Appointment 6 รายที่ควรยืนยันและติดตามก่อนถึงเวลานัด',
      reason:'ระบบโฟกัสงานบริการและการดำเนินงานเท่านั้น ไม่วินิจฉัยหรือให้คำแนะนำทางการแพทย์',
      actions:['ยืนยันนัดหมายที่ยัง Pending','เตือนเอกสาร/ข้อมูลที่ต้องเตรียม','สรุปภาระงานทีมตามช่วงเวลา'],
      memory:'จำประวัติการติดต่อ นัดหมาย ความต้องการด้านบริการ และบริบทการให้บริการที่ได้รับอนุญาต'
    },
    'hotel-admin-demo.html':{
      dept:'Hotel & Hospitality', signal:'Arrival workload', score:84,
      insight:'ช่วง Check-in วันนี้มีแขกเข้าพักหนาแน่น 2 ช่วงเวลา',
      reason:'Reservation และสถานะห้องแสดงภาระงาน Front Desk สูงกว่าค่าเฉลี่ย',
      actions:['เตรียมห้อง Priority ก่อนเวลา','จัดลำดับ Check-in ตาม ETA','ส่ง Pre-arrival reminder ให้แขกที่ยังไม่ยืนยันเวลา'],
      memory:'จำประเภทห้อง ความต้องการพิเศษ ช่องทางการจอง และประวัติการเข้าพัก'
    },
    'restaurant-admin-demo.html':{
      dept:'Food & Restaurant', signal:'Service peak ahead', score:82,
      insight:'ช่วง Dinner มีแนวโน้ม Reservation และ Walk-in กระจุกตัว',
      reason:'จำนวน Booking และรูปแบบ Order ใน Demo ชี้ว่าช่วง 18:30–20:00 จะหนาแน่น',
      actions:['เตรียมโต๊ะและทีมก่อน Peak','ติดตาม Reservation ที่ยังไม่ Confirm','ดันเมนูที่ทำเร็วในช่วงคิวหนาแน่น'],
      memory:'จำเมนูโปรด ข้อจำกัดอาหาร ประวัติการจอง และรูปแบบการกลับมาใช้บริการ'
    },
    'construction-admin-demo.html':{
      dept:'Construction & Services', signal:'Quotation follow-up', score:88,
      insight:'มีใบเสนอราคา 4 รายการที่ควรติดตามก่อนโอกาสปิดงานลดลง',
      reason:'ระยะเวลาหลังส่ง Quotation และสถานะ Lead แสดงว่าบางรายอยู่ในช่วงตัดสินใจ',
      actions:['ติดตาม Quotation Priority 2 ราย','ตรวจ Project ที่เสี่ยงเลยกำหนด','สรุป Cost vs Progress ของงานที่กำลังดำเนินการ'],
      memory:'จำหน้างาน งบประมาณ ความต้องการ ขอบเขตงาน ผู้ติดต่อ และประวัติการเสนอราคา'
    },
    'professional-admin-demo.html':{
      dept:'Professional Business', signal:'Proposal pipeline', score:89,
      insight:'มี Proposal 6 รายการรอติดตาม และ 3 รายมีโอกาสเดินหน้าสูง',
      reason:'ระยะเวลาหลัง Consultation สถานะ Proposal และ Client activity ชี้ว่าควร Follow-up วันนี้',
      actions:['ติดตาม Proposal Priority 3 ราย','สรุป Client context ก่อนโทรกลับ','เตือน Task/Deadline ที่ครบกำหนดภายใน 48 ชม.'],
      memory:'จำโจทย์ธุรกิจ เป้าหมาย Client ประวัติ Consultation Proposal และ Next Step ล่าสุด'
    }
  }[file];
  if(!config) return;

  const css=document.createElement('style');
  css.textContent=`
  .flowly-intel-strip{margin:0 0 14px;border:1px solid #5d482d;border-radius:14px;background:linear-gradient(135deg,rgba(226,183,117,.10),rgba(10,9,8,.98));padding:14px 16px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}
  .flowly-intel-orb{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;border:1px solid #80633d;color:#e3ba79;background:#15110d;font-weight:700}.flowly-intel-copy strong{display:block;color:#ead4ae;font-size:11px;letter-spacing:.08em}.flowly-intel-copy span{display:block;color:#9f9589;font-size:11px;margin-top:4px}.flowly-intel-score{font-family:Georgia,serif;color:#e3ba79;font-size:24px}.flowly-intel-score small{display:block;font-family:inherit;font-size:8px;color:#746b61;letter-spacing:.10em;text-align:right}
  .flowly-ai-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.flowly-ai-card{border:1px solid #5d482d;border-radius:14px;background:radial-gradient(circle at 92% 0,rgba(219,169,93,.14),transparent 42%),#0f0d0b;padding:20px}.flowly-ai-card h3{font-family:Georgia,serif;font-weight:400;color:#e3ba79;font-size:23px;margin:12px 0 8px}.flowly-ai-card p{color:#aaa095;font-size:12px;line-height:1.7}.flowly-ai-actions{display:grid;gap:8px;margin-top:14px}.flowly-ai-action{border:1px solid #30271d;border-radius:10px;padding:11px 12px;display:flex;gap:10px;align-items:flex-start}.flowly-ai-action b{color:#e3ba79}.flowly-ai-action span{font-size:11px;color:#b1a69a}.flowly-memory{margin-top:12px;border-top:1px solid #30271d;padding-top:12px;color:#91877d;font-size:11px;line-height:1.65}.flowly-automation{display:grid;gap:8px}.flowly-automation div{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #282119;padding:10px 0;font-size:11px;color:#aaa095}.flowly-automation div:last-child{border-bottom:0}.flowly-automation em{font-style:normal;color:#86c69b}.flowly-api-note{margin-top:12px;color:#70675e;font-size:9px;letter-spacing:.06em}
  @media(max-width:800px){.flowly-intel-strip{grid-template-columns:auto 1fr}.flowly-intel-score{grid-column:2}.flowly-ai-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  const content=document.querySelector('.content');
  const anchor=document.querySelector('.flowly-front-request');
  if(content){
    const strip=document.createElement('div'); strip.className='flowly-intel-strip';
    strip.innerHTML=`<div class="flowly-intel-orb">✧</div><div class="flowly-intel-copy"><strong>FLOWLY INTELLIGENCE · ${config.dept}</strong><span>${config.signal} · AI Demo reads business context and recommends the next useful action.</span></div><div class="flowly-intel-score">${config.score}<small>PRIORITY SCORE</small></div>`;
    if(anchor) anchor.insertAdjacentElement('afterend',strip); else content.insertBefore(strip,content.firstChild);
  }

  const ai=document.getElementById('ai');
  if(ai){
    ai.innerHTML=`<div class="section-head"><div><h2>FLOWLY Intelligence</h2><p>Remember → Analyze → Recommend → Automate repetitive work</p></div><span class="ai-badge">AI BUSINESS COPILOT · DEMO</span></div>
    <div class="flowly-ai-grid">
      <div class="flowly-ai-card"><span class="ai-badge">NEXT BEST ACTION</span><h3>${config.insight}</h3><p>${config.reason}</p><div class="flowly-ai-actions">${config.actions.map((a,i)=>`<div class="flowly-ai-action"><b>0${i+1}</b><span>${a}</span></div>`).join('')}</div><div class="flowly-memory"><b style="color:#dfc194">Smart Customer Memory:</b> ${config.memory}</div></div>
      <div class="flowly-ai-card"><span class="ai-badge">SMART AUTOMATION</span><h3>จาก Insight สู่ Action</h3><div class="flowly-automation"><div><span>Detect priority</span><em>Ready</em></div><div><span>Prepare follow-up</span><em>Suggested</em></div><div><span>Create reminder/task</span><em>Suggested</em></div><div><span>Owner approval</span><em>Required</em></div></div><p class="flowly-api-note">V2.24 is frontend intelligence simulation. Real AI/data actions will connect through the backend API layer in the next development phase.</p></div>
    </div>`;
  }

  window.FLOWLY_INTELLIGENCE={department:config.dept,version:'2.24',mode:'frontend-demo',functions:['remember','analyze','recommend','automate']};
})();
