const { env } = require('../config/env');
const authService = require('../services/authService');
const audit = require('../services/securityAuditService');
const { HttpError } = require('../utils/httpError');

function cookieOptions(){
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  };
}

async function login(req,res){
  const {email,password}=req.body||{};
  if(!email||!password)throw new HttpError(400,'Email and password are required','VALIDATION_ERROR');
  try {
    const result=await authService.login(email,password);
    req.user = result.user;
    await audit.record(req, 'auth.login', true, { actorUserId: result.user.id, businessId: result.user.businessId, email: String(email).toLowerCase() });
    res.cookie(env.cookieName,result.token,cookieOptions());
    res.json({ok:true,data:{user:result.user,session:{expiresIn:env.jwtExpiresIn}}});
  } catch (error) {
    await audit.record(req, 'auth.login', false, { email: String(email||'').toLowerCase(), code: error.code || 'LOGIN_FAILED' });
    throw error;
  }
}
async function me(req,res){ res.json({ok:true,data:{user:req.user}}); }
async function logout(req,res){
  await audit.record(req, 'auth.logout', true, {});
  res.clearCookie(env.cookieName,{...cookieOptions(),maxAge:0});
  res.json({ok:true,data:{loggedOut:true}});
}
module.exports={login,me,logout};
