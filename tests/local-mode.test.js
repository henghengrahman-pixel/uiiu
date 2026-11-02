import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file)=>readFileSync(new URL(file,import.meta.url),'utf8');
test('combined supervisor starts server and worker separately',()=>{
  const source=read('../src/combined.js');
  assert.match(source,/\['server','worker'\]/);
  assert.match(source,/MWG_COMBINED:'1'/);
  assert.match(source,/shutdown\(1\)/);
});
test('local worker does not require S3 variables',()=>{
  const source=read('../src/worker.js');
  assert.match(source,/STORAGE_MODE!=='local'&&\(!process\.env\.S3_BUCKET/);
});
test('server checks combined flag for local production',()=>{
  assert.match(read('../src/server.js'),/MWG_COMBINED!=='1'/);
});
test('local temporary files are stored inside the configured volume',()=>{
  assert.match(read('../src/worker.js'),/DATA_DIR\|\|'\.\/data'/);
  assert.match(read('../src/server.js'),/const tempRoot=process\.env\.STORAGE_MODE==='local'/);
});
