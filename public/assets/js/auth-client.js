(function(){
  const API=(window.FLOWLY_API_BASE||(window.location.protocol==='file:'?'http://localhost:8787/api/v1':'/api/v1')).replace(/\/$/,'');
  async function request(path,opts={}){const res=await fetch(API+path,{credentials:'include',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});let body={};try{body=await res.json()}catch{}if(!res.ok){const e=new Error(body?.error?.message||body?.message||`HTTP ${res.status}`);e.status=res.status;e.code=body?.error?.code||body?.code;throw e}return body}
  const auth={
    login:(email,password)=>request('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
    me:()=>request('/auth/me'),
    logout:()=>request('/auth/logout',{method:'POST'}),
    guard:async function(options={}){try{const x=await this.me();const user=x.data?.user||x.user;window.FLOWLY_USER=user;document.dispatchEvent(new CustomEvent('flowly:auth',{detail:user}));if(options.roles&&options.roles.length&&!options.roles.includes(user.role)){location.replace(options.forbidden||'index.html');return null}return user}catch(e){const next=encodeURIComponent(location.pathname.split('/').pop()+location.search+location.hash);location.replace((options.login||'login.html')+'?next='+next);return null}}
  };
  window.FlowlyAuth=auth;
})();
