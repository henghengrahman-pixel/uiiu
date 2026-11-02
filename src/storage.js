import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';
import {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
const local=process.env.STORAGE_MODE==='local';
const root=path.resolve(process.env.DATA_DIR||'./data');
const bucket=process.env.S3_BUCKET;
const client=!local?new S3Client({endpoint:process.env.S3_ENDPOINT||undefined,region:process.env.S3_REGION||'auto',forcePathStyle:process.env.S3_FORCE_PATH_STYLE==='true',credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID||'',secretAccessKey:process.env.S3_SECRET_ACCESS_KEY||''}}):null;
function safeKey(key){if(!/^[a-zA-Z0-9_./-]+$/.test(key)||key.includes('..')||key.startsWith('/'))throw Error('Unsafe storage key');return key}
export async function upload(key,file,type='application/octet-stream'){safeKey(key);if(local){const dest=path.join(root,key);await fsp.mkdir(path.dirname(dest),{recursive:true});await fsp.copyFile(file,dest);return}await client.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:fs.createReadStream(file),ContentLength:(await fsp.stat(file)).size,ContentType:type}))}
export async function download(key,file){safeKey(key);await fsp.mkdir(path.dirname(file),{recursive:true});if(local){await fsp.copyFile(path.join(root,key),file);return}const res=await client.send(new GetObjectCommand({Bucket:bucket,Key:key}));const {pipeline}=await import('node:stream/promises');await pipeline(res.Body,fs.createWriteStream(file))}
export async function remove(key){safeKey(key);if(local){await fsp.rm(path.join(root,key),{force:true});return}await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key}))}
export async function url(key){safeKey(key);if(local)return null;return getSignedUrl(client,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:300})}
export async function localStream(key){safeKey(key);return fs.createReadStream(path.join(root,key))}
export async function exists(key){safeKey(key);try{if(local){await fsp.stat(path.join(root,key));return true}await client.send(new HeadObjectCommand({Bucket:bucket,Key:key}));return true}catch{return false}}
export function isLocal(){return local}
