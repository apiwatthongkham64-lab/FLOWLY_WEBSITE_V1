(function(){
  function roleLabel(role){return ({owner:'Owner',admin:'Admin',staff:'Staff'})[role]||role||'User'}
  async function start(){
    if(!window.FlowlyAuth)return;
    const user=await window.FlowlyAuth.guard({roles:['owner','admin','staff']});if(!user)return;
    const chip=document.createElement('div');chip.id='flowly-session-chip';chip.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9999;background:#0d0d0d;border:1px solid #6b5334;color:#e3ba79;padding:10px 12px;border-radius:12px;font:12px/1.35 Arial,sans-serif;box-shadow:0 12px 35px #0008';
    chip.innerHTML=`<b>${roleLabel(user.role)}</b> · ${user.name||user.email}<button id="flowlyLogout" style="margin-left:10px;background:transparent;border:0;color:#aaa;cursor:pointer">Logout</button>`;document.body.appendChild(chip);
    document.getElementById('flowlyLogout').onclick=async()=>{try{await window.FlowlyAuth.logout()}finally{location.href='login.html'}};
    document.documentElement.dataset.flowlyRole=user.role;
    document.querySelectorAll('[data-role]').forEach(el=>{const roles=el.dataset.role.split(',').map(x=>x.trim());if(!roles.includes(user.role))el.hidden=true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
