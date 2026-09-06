const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { demoUsers } = require('../data/demoUsers');
const userRepository = require('../repositories/userRepository');
const { verifyPassword } = require('../utils/password');
const { HttpError } = require('../utils/httpError');
const { permissionsForRole } = require('../authz');
function sign(user){ return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: env.jwtIssuer, audience: env.jwtAudience }); }
function publicUser(user){ const {password,password_hash,...safe}=user; return safe; }
function enrich(user){ return {...user, permissions: permissionsForRole(user.role)}; }
async function login(email,password){
  if(env.authMode==='demo'){
    const user=demoUsers.find(x=>x.email.toLowerCase()===String(email||'').toLowerCase());
    if(!user||user.password!==password)throw new HttpError(401,'Invalid email or password','INVALID_CREDENTIALS');
    const safe=enrich(publicUser(user)); return {user:safe,token:sign(safe)};
  }
  if(env.authMode!=='database')throw new HttpError(500,'Unsupported AUTH_MODE','AUTH_MODE_INVALID');
  const row=await userRepository.findByEmail(email);
  if(!row||row.status!=='active'||!verifyPassword(password,row.password_hash))throw new HttpError(401,'Invalid email or password','INVALID_CREDENTIALS');
  if(!row.business_id||row.membership_status!=='active')throw new HttpError(403,'No active business membership','MEMBERSHIP_REQUIRED');
  const safe=enrich({id:row.id,email:row.email,name:row.display_name,role:row.role,businessId:row.business_id,businessName:row.business_name,businessSlug:row.business_slug});
  await userRepository.touchLastLogin(row.id); return {user:safe,token:sign(safe)};
}
module.exports={login,publicUser};
