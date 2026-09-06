const crypto=require('crypto');
function hashPassword(password){const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync(String(password),salt,64).toString('hex');return `scrypt$${salt}$${hash}`;}
function verifyPassword(password,stored){if(!stored||!stored.startsWith('scrypt$'))return false;const [,salt,hex]=stored.split('$');const candidate=crypto.scryptSync(String(password),salt,64);const expected=Buffer.from(hex,'hex');return candidate.length===expected.length&&crypto.timingSafeEqual(candidate,expected);}
module.exports={hashPassword,verifyPassword};
