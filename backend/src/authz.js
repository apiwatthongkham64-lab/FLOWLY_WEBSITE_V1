const ROLE_PERMISSIONS = Object.freeze({
  owner: ['business:read','business:write','members:manage','customers:read','customers:write','leads:read','leads:write','requests:read','bookings:read','bookings:write','tasks:read','tasks:write','activity:read','workflows:write','intelligence:read','automation:approve'],
  admin: ['business:read','business:write','customers:read','customers:write','leads:read','leads:write','requests:read','bookings:read','bookings:write','tasks:read','tasks:write','activity:read','workflows:write','intelligence:read'],
  staff: ['business:read','customers:read','leads:read','leads:write','requests:read','bookings:read','bookings:write','tasks:read','tasks:write','activity:read','workflows:write']
});
function permissionsForRole(role){ return ROLE_PERMISSIONS[role] || []; }
function hasPermission(user, permission){
  if (!user) return false;
  const base = permissionsForRole(user.role);
  const extra = Array.isArray(user.permissions) ? user.permissions : [];
  return base.includes(permission) || extra.includes(permission);
}
module.exports = { ROLE_PERMISSIONS, permissionsForRole, hasPermission };
