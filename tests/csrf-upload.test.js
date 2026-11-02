import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
test('multipart video upload parses fields before CSRF validation',()=>{
  assert.match(source,/app\.post\('\/jobs',upload\.single\('video'\),csrf,/);
});
test('multipart logo upload parses fields before CSRF validation',()=>{
  assert.match(source,/app\.post\('\/settings\/logo',upload\.single\('logo'\),csrf,/);
});
test('invalid CSRF removes uploaded temporary file',()=>{
  assert.match(source,/if\(req\.file\?\.path\)fsp\.rm\(req\.file\.path/);
});
