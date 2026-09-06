const { spawn } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { env } = require('../src/config/env');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
function pgArgs(url) {
  const u = new URL(url);
  return {
    args: ['--format=custom','--no-owner','--no-privileges','--host',u.hostname,'--port',u.port || '5432','--username',decodeURIComponent(u.username),'--dbname',u.pathname.slice(1)],
    password: decodeURIComponent(u.password || '')
  };
}
function run(command, args, options={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','inherit','inherit'],...options});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error(`${command} exited with code ${code}`)));
  });
}
async function sha256(file) {
  return new Promise((resolve,reject)=>{
    const hash=crypto.createHash('sha256');
    const input=fs.createReadStream(file);
    input.on('error',reject); input.on('data',d=>hash.update(d)); input.on('end',()=>resolve(hash.digest('hex')));
  });
}
async function main(){
  if(!env.databaseUrl) throw new Error('DATABASE_URL is required');
  await fsp.mkdir(env.backupDir,{recursive:true});
  const file=path.join(env.backupDir,`flowly-${stamp()}.dump`);
  const {args,password}=pgArgs(env.databaseUrl);
  await run('pg_dump',[...args,'--file',file],{env:{...process.env,PGPASSWORD:password}});
  const digest=await sha256(file);
  await fsp.writeFile(`${file}.sha256`,`${digest}  ${path.basename(file)}\n`,'utf8');
  const stat=await fsp.stat(file);
  console.log(JSON.stringify({ok:true,backup:file,bytes:stat.size,sha256:digest}));
}
main().catch(error=>{console.error(error.message);process.exit(1);});
