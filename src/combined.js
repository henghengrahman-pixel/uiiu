import 'dotenv/config';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';

const directory=path.resolve(process.env.DATA_DIR||'/data');
if(process.env.STORAGE_MODE!=='local')throw Error('Combined mode requires STORAGE_MODE=local');
if(process.env.NODE_ENV==='production'&&directory==='/app/data')throw Error('DATA_DIR must point to mounted persistent volume, e.g. /data');
await mkdir(directory,{recursive:true});
const writableProbe=path.join(directory,`.mwg-write-${process.pid}`);
try{await writeFile(writableProbe,'ok');await unlink(writableProbe)}catch(err){throw Error(`Local Railway Volume is not writable at ${directory}: ${err.message}`)}
const children=[];let shuttingDown=false;let exitTimer;
function shutdown(code=0){
  if(shuttingDown)return;
  shuttingDown=true;
  for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');
  exitTimer=setTimeout(()=>{for(const child of children)if(child.exitCode===null)child.kill('SIGKILL');process.exit(code)},10000);
  exitTimer.unref();
  Promise.all(children.map(child=>new Promise(resolve=>child.exitCode!==null?resolve():child.once('exit',resolve)))).then(()=>{clearTimeout(exitTimer);process.exit(code)});
}
process.on('SIGTERM',()=>shutdown(0));process.on('SIGINT',()=>shutdown(0));
for(const name of ['server','worker']){
  const child=spawn(process.execPath,[new URL(`./${name}.js`,import.meta.url).pathname],{
    stdio:'inherit',env:{...process.env,STORAGE_MODE:'local',DATA_DIR:directory,MWG_COMBINED:'1'}});
  children.push(child);
  child.on('error',err=>{console.error(`MWG ${name} process error`,err);shutdown(1)});
  child.on('exit',(code,signal)=>{if(!shuttingDown){console.error(`MWG ${name} exited (code=${code}, signal=${signal}); stopping whole service`);shutdown(1)}});
}
console.log('MWG combined mode: website and worker running with local Volume',directory);
