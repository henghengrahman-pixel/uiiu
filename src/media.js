import {spawn} from 'node:child_process';import fs from 'node:fs/promises';
export async function exec(bin,args,{signal,onLine,timeout=0}={}){return new Promise((resolve,reject)=>{const child=spawn(bin,args,{stdio:['ignore','pipe','pipe'],signal});let stdout='',stderr='';let timer;if(timeout)timer=setTimeout(()=>child.kill('SIGKILL'),timeout);for(const [stream,name] of [[child.stdout,'out'],[child.stderr,'err']]){let buffer='';stream.on('data',c=>{const s=c.toString();if(name==='out')stdout=(stdout+s).slice(-100000);else stderr=(stderr+s).slice(-20000);buffer+=s;const lines=buffer.split(/\r?\n|\r/);buffer=lines.pop()||'';for(const line of lines)onLine?.(line,name)})}child.on('error',reject);child.on('close',(code)=>{clearTimeout(timer);if(code===0)resolve({stdout,stderr});else reject(Error(`${bin} exited ${code}: ${stderr.slice(-1400)}`))})})}
export async function probe(file){const r=await exec('ffprobe',['-v','error','-show_entries','format=duration:stream=index,codec_type,width,height','-of','json',file],{timeout:60000});const p=JSON.parse(r.stdout);const duration=Number(p.format?.duration);if(!Number.isFinite(duration)||duration<=0||!p.streams?.some(s=>s.codec_type==='video'))throw Error('File bukan video yang valid');return {duration,streams:p.streams}}
export function renderArgs({source,logo,dest,start,duration,number,preset}){const {size,opacity,position}=preset;const width=Math.round(1080*size/100);const xp=position.endsWith('right')?'W-w-36':'36';const yp=position.startsWith('top')?'36':'H-h-36';const text=`PART ${String(number).padStart(2,'0')}`;
const filters=[`[0:v]scale=1080:1350:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1[film]`,`color=c=black:s=1080x1920:r=30[bg]`,`[bg][film]overlay=(W-w)/2:(H-h)/2:shortest=1[base]`];let v='base';if(logo){filters.push(`[1:v]scale=${width}:-1:flags=lanczos,format=rgba,colorchannelmixer=aa=${opacity}[wm]`,`[base][wm]overlay=${xp}:${yp}:format=auto[stamped]`);v='stamped'}filters.push(`[${v}]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${text}':fontcolor=white:fontsize=70:borderw=2:bordercolor=black@0.4:x=(w-text_w)/2:y=h-240:fix_bounds=1[out]`);
const args=['-hide_banner','-nostdin','-y','-ss',String(start),'-i',source];if(logo)args.push('-loop','1','-i',logo);args.push('-filter_complex',filters.join(';'),'-map','[out]','-map','0:a:0?','-t',String(duration),'-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-ac','2','-ar','48000','-movflags','+faststart','-max_muxing_queue_size','1024',dest);return args}

/** Arguments are passed directly to spawn; no shell or arbitrary yt-dlp flags from users. */
export function downloaderArgs(url,dest,{maxBytes=21474836480}={}){
  if(!Number.isSafeInteger(Number(maxBytes))||Number(maxBytes)<=0)throw Error('MAX_SOURCE_BYTES tidak valid');
  return ['--no-playlist','--no-progress','--no-config','--no-call-home',
    '--js-runtimes','deno','--restrict-filenames','--max-filesize',String(maxBytes),
    '--format','bv*+ba/b','--merge-output-format','mp4',
    '--print','after_move:filepath','--output',dest,'--',url];
}
export function classifyDownloadError(err){
  const msg=String(err?.message||err);
  if(/Sign in to confirm you.re not a bot|confirm you.re not a bot|HTTP Error 403|This video is private|Video unavailable|members.only|not available in your country|age.restricted|login required/i.test(msg))
    return {retryable:false,message:'YouTube menolak akses video atau meminta verifikasi. Gunakan sumber yang diizinkan atau upload MP4 milik Anda. Detail: '+msg.slice(-900)};
  if(/No supported JavaScript runtime|deno.*not found|unknown option.*js-runtimes/i.test(msg))
    return {retryable:false,message:'Runtime yt-dlp/Deno tidak tersedia. Periksa Dockerfile worker dan versi yt-dlp. Detail: '+msg.slice(-900)};
  if(/Unsupported URL|Unable to extract|Requested format is not available/i.test(msg))
    return {retryable:false,message:'Video tidak dapat diekstrak dari URL ini. Coba upload MP4. Detail: '+msg.slice(-900)};
  return {retryable:true,message:msg.slice(-1500)};
}
