import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [wasm,cat,profiles,api,accountsPath]=process.argv.slice(2);
const {default:create}=await import(pathToFileURL(wasm));
const {Client}=await import(pathToFileURL(api));
const {DemoAccounts,ACTIVE_KEY}=await import(pathToFileURL(accountsPath));
const engine=await create();
const catalogueJson=await readFile(cat,'utf8'),profilesJson=await readFile(profiles,'utf8');
const storage={data:new Map([['unrelated','keep']]),getItem(k){return this.data.get(k)??null;},setItem(k,v){if(this.fail)throw Error('full');this.data.set(k,v);},removeItem(k){this.data.delete(k);}};
const make=()=>new DemoAccounts({storage:()=>storage,loadClient:async()=>{const c=new Client(engine);c.call('initialize',{catalogueJson,profilesJson});return c;}});
let a=make();assert.equal(a.initialId(),'personal');
let original=await a.activate('personal');assert.equal(original.client.call('getState').visitor,null);
let n=await a.activate('naledi');assert.equal(n.client.call('getState').visitor.displayName,'Naledi Demo');
n.client.call('save',{id:'fictional-001'});assert.equal(n.persistence.save(),true);
const before=storage.getItem(n.account.key);
let s=await a.activate('sipho');assert.deepEqual(s.client.call('getState').savedIds,[]);
s.client.call('save',{id:'fictional-002'});s.persistence.save();
await a.activate('naledi');assert.deepEqual(a.active.client.call('getState').savedIds,['fictional-001']);
assert.equal(storage.getItem(n.account.key),before);
// Write failures keep each persona in memory across switches.
storage.fail=true;n.client.call('save',{id:'fictional-003'});assert.equal(n.persistence.save(),false);
await a.activate('sipho');await a.activate('naledi');assert.deepEqual(n.client.call('getState').savedIds,['fictional-001','fictional-003']);
storage.fail=false;n.persistence.save();
// Only the selected persona resets; starter and unrelated data remain.
assert.equal(a.resetActive(),true);assert.deepEqual(n.client.call('getState').savedIds,[]);
assert.equal(n.client.call('getState').visitor.displayName,'Naledi Demo');
await a.activate('sipho');assert.deepEqual(s.client.call('getState').savedIds,['fictional-002']);
a.dispose();a=make();assert.equal(a.initialId(),'sipho');s=await a.activate(a.initialId());assert.deepEqual(s.client.call('getState').savedIds,['fictional-002']);
// Legacy state remains in its original key and restores without migration.
storage.setItem('unimatch.demo.v1',s.client.call('exportState').stateJson);
original=await a.activate('personal');assert.deepEqual(original.client.call('getState').savedIds,['fictional-002']);
const legacy=storage.getItem('unimatch.demo.v1');await a.activate('ayesha');assert.equal(storage.getItem('unimatch.demo.v1'),legacy);
// Corrupt persona recovery does not destroy other identities.
a.dispose();storage.setItem('orbit.demo.account.naledi.v1','broken');a=make();n=await a.activate('naledi');assert.equal(n.persistence.mode,'recovery');
assert.equal(storage.getItem(n.account.key),'broken');await a.activate('sipho');assert.deepEqual(a.active.client.call('getState').savedIds,['fictional-002']);
// A cached persona detects changes from a different tab before another write.
storage.setItem(a.active.account.key,'external');a.checkExternalChange(a.active.account.key);assert.equal(a.active.persistence.mode,'conflict');assert.equal(a.active.persistence.save(),false);
await assert.rejects(()=>a.activate('invalid'));assert.equal(a.active.account.id,'sipho');
assert.equal(storage.getItem('unrelated'),'keep');a.dispose();
console.log('Demo account isolation, legacy restoration, resets, recovery, refresh and conflict checks passed.');
