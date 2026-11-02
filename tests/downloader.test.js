import test from 'node:test';
import assert from 'node:assert/strict';
import {downloaderArgs,classifyDownloadError} from '../src/media.js';
test('yt-dlp uses Deno, safe argv, no shell',()=>{
  const args=downloaderArgs('https://youtu.be/dQw4w9WgXcQ','/tmp/source.%(ext)s');
  assert.deepEqual(args.slice(args.indexOf('--js-runtimes'),args.indexOf('--js-runtimes')+2),['--js-runtimes','deno']);
  assert.equal(args.at(-1),'https://youtu.be/dQw4w9WgXcQ');
  assert.ok(args.includes('--no-playlist'));
});
test('access restriction errors fail with actionable message without retry',()=>{
  const e=classifyDownloadError(Error('ERROR: Sign in to confirm you’re not a bot'));
  assert.equal(e.retryable,false);
  assert.match(e.message,/upload MP4/);
});
test('runtime errors fail without futile retries',()=>{
  assert.equal(classifyDownloadError(Error('No supported JavaScript runtime could be found')).retryable,false);
});
test('transient errors are retryable',()=>{
  assert.equal(classifyDownloadError(Error('Temporary connection reset')).retryable,true);
});
