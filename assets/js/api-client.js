(function () {
  const API_BASE = window.FLOWLY_API_BASE || (window.location.protocol === 'file:' ? 'http://localhost:8787/api/v1' : '/api/v1');
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{'Content-Type':'application/json',...(options.headers||{})}, ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body?.error?.message || `HTTP ${response.status}`);
    return body;
  }
  window.FlowlyAPI = {
    baseUrl: API_BASE,
    health: () => request('/health'),
    login: (email,password) => request('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
    me: () => request('/auth/me'), logout: () => request('/auth/logout',{method:'POST'}),
    business: () => request('/businesses/me'),
    updateBusiness: (data) => request('/businesses/me',{method:'PATCH',body:JSON.stringify(data)}),
    customers: (q='') => request(`/customers${q?`?q=${encodeURIComponent(q)}`:''}`),
    createCustomer: (data) => request('/customers',{method:'POST',body:JSON.stringify(data)}),
    leads: (stage='') => request(`/leads${stage?`?stage=${encodeURIComponent(stage)}`:''}`),
    createLead: (data) => request('/leads',{method:'POST',body:JSON.stringify(data)}),
    serviceRequests: () => request('/service-requests'),
    createPublicRequest: (data) => request('/service-requests/public',{method:'POST',body:JSON.stringify(data)}),
    intelligence: (department) => request(`/intelligence/overview?department=${encodeURIComponent(department||'professional')}`)
  };
})();
