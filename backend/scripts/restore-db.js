const { spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const { env } = require('../src/config/env');

function pgArgs(url) {
  const u = new URL(url);
  return {
    args: ['--host',u.hostname,'--port',u.port || '5432','--username',decodeURIComponent(u.username),'--dbname',u.pathname.slice(1)],
    password: decodeURIComponent(u.password || '')
  };
}
function run(command,args,options={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','inherit','inherit'],...options});
    child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`${command} exited with code ${code}`)));
  });
}
async function checksum(file){
  return new Promise((resolve,reject)=>{const hash=crypto.createHash('sha256');const input=fs.createReadStream(file);input.on('error',reject);input.on('data',d=>hash.update(d));input.on('end',()=>resolve(hash.digest('hex')));});
}
async function main(){
  const file=process.argv[2];
  if(!file) throw new Error('Usage: npm run restore:db -- /absolute/path/to/backup.dump');
  if(process.env.CONFIRM_RESTORE!=='YES') throw new Error('Restore blocked. Set CONFIRM_RESTORE=YES only after reviewing the target database.');
  if(!env.databaseUrl) throw new Error('DATABASE_URL is required');
  if(!fs.existsSync(file)) throw new Error('Backup file not found');
  const checksumFile=`${file}.sha256`;
  if(fs.existsSync(checksumFile)){
    const expected=fs.readFileSync(checksumFile,'utf8').trim().split(/\s+/)[0];
    const actual=await checksum(file);
    if(expected!==actual) throw new Error('Backup checksum verification failed');
  }
  const {args,password}=pgArgs(env.databaseUrl);
  await run('pg_restore',[...args,'--clean','--if-exists','--no-owner','--no-privileges',file],{env:{...process.env,PGPASSWORD:password}});
  console.log(JSON.stringify({ok:true,restored:file}));
}
main().catch(error=>{console.error(error.message);process.exit(1);});
