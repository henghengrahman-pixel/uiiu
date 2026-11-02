import net from 'node:net';
import path from 'node:path';
export const PART_SECONDS=300;
export function partCount(duration){if(!Number.isFinite(duration)||duration<=0)throw Error('Durasi tidak valid');return Math.ceil(duration/PART_SECONDS)}
export function partWindow(duration,index){const count=partCount(duration);if(!Number.isInteger(index)||index<0||index>=count)throw Error('Part tidak valid');return {start:index*PART_SECONDS,duration:Math.min(PART_SECONDS,duration-index*PART_SECONDS)}}
export function safeSlug(v){return String(v||'FILM').normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-').toUpperCase().slice(0,70)||'FILM'}
export function filename(title,n){return `MWG-${safeSlug(title)}-PART-${String(n).padStart(2,'0')}.mp4`}
export function validYouTubeURL(input){let u;try{u=new URL(input)}catch{return false}if(u.protocol!=='https:'||u.username||u.password||u.port)return false;const host=u.hostname.toLowerCase();if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host))return false;if(host==='youtu.be')return /^\/[\w-]{11}$/.test(u.pathname);if(u.pathname==='/watch')return /^[\w-]{11}$/.test(u.searchParams.get('v')||'');return /^\/(shorts|live)\/[\w-]{11}$/.test(u.pathname)}
export function parsePreset(data={}){const size=Math.max(6,Math.min(28,Number(data.size)||12));const opacity=Math.max(.1,Math.min(1,Number(data.opacity)||.55));const position=['top-left','top-right','bottom-left','bottom-right'].includes(data.position)?data.position:'top-right';return {size,opacity,position}}
export function assertSafeName(name){return path.basename(name)===name && !/[\x00-\x1f]/.test(name)}
