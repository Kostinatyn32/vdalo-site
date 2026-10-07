import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderPage} from '../versions/v3/render.mjs';
import {dialogs} from '../versions/v3/dialogs.mjs';

test('six module links resolve to existing solution IDs',()=>{
 const html=renderPage();
 const links=[...html.matchAll(/class="module-link" href="#(solution-\d)"/g)].map(match=>match[1]);
 assert.equal(links.length,6);
 assert.equal(new Set(links).size,6);
 links.forEach(id=>assert.ok(html.includes(`id="${id}"`)));
});

test('all referenced local images exist',()=>{
 const html=renderPage();
 const assets=[...html.matchAll(/(?:src|href)="\/assets\/([^"?]+)/g)].map(match=>match[1]);
 assert.ok(assets.length>10);
 assets.forEach(name=>assert.ok(existsSync(fileURLToPath(new URL(`../versions/v3/public/assets/${name}`,import.meta.url))),name));
});

test('concept calendar is labelled and directly viewable',()=>{
 const html=renderPage();
 assert.ok(html.includes('Концепт інтерфейсу. Ілюстративні дані.'));
 assert.ok(html.includes('aria-label="Відкрити великий концепт шахматки"'));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<main\b/g)||[]).length,1);
});

test('forms are visibly unavailable when delivery is not configured',()=>{
 const keys=['VDALO_TRIAL_WEBHOOK_URL','VDALO_AUDIT_WEBHOOK_URL','VDALO_LEAD_WEBHOOK_URL'];
 const saved=keys.map(key=>process.env[key]);
 try{
  keys.forEach(key=>delete process.env[key]);
  const html=dialogs();
  assert.equal((html.match(/data-available="false"/g)||[]).length,2);
  assert.equal((html.match(/<fieldset disabled>/g)||[]).length,2);
  assert.equal((html.match(/Онлайн-заявки ще не приймаються/g)||[]).length,2);
  process.env.VDALO_TRIAL_WEBHOOK_URL='https://example.invalid/trial';
  const trialOnly=dialogs();
  assert.equal((trialOnly.match(/data-available="true"/g)||[]).length,1);
  assert.equal((trialOnly.match(/<fieldset disabled>/g)||[]).length,1);
 }finally{
  keys.forEach((key,i)=>{if(saved[i]===undefined)delete process.env[key];else process.env[key]=saved[i];});
 }
});
