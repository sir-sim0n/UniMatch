import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, cataloguePath, profilesPath, clientPath, persistencePath] = process.argv.slice(2);
const { default: create } = await import(pathToFileURL(modulePath).href);
const { Client, ApiError } = await import(pathToFileURL(clientPath).href);
const { Persistence, STORAGE_KEY } = await import(pathToFileURL(persistencePath).href);
const engine = await create();
const catalogueJson = await readFile(cataloguePath, 'utf8');
const profilesJson = await readFile(profilesPath, 'utf8');
const profile = { ...JSON.parse(profilesJson).profiles[0], id: 'visitor:local', displayName: 'Demo 🌿', showGender: false };
const clients = [];
let checks = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function makeClient() {
  const client = new Client(engine); clients.push(client);
  client.call('initialize', { catalogueJson, profilesJson }); return client;
}
function populate(client) {
  client.call('updateProfile', { profile });
  client.call('updatePreferences', { preferences: { minAge: 20, maxAge: 40, genderIds: [], universityId: null, campusId: null, degreeId: null } });
  client.call('save', { id: 'fictional-003' }); client.call('save', { id: 'fictional-001' });
}
function exported(client) { return client.call('exportState').stateJson; }
class Storage {
  data = new Map([['other.application', 'keep me']]);
  getItem(key) { if (this.readFails) throw new Error('read denied'); return this.data.get(key) ?? null; }
  setItem(key, value) { if (this.writeFails) throw new Error('quota exceeded'); this.data.set(key, value); }
  removeItem(key) { if (this.removeFails) throw new Error('remove denied'); this.data.delete(key); }
  clear() { throw new Error('Clearing the origin is forbidden'); }
}
function controller(client, store) {
  const reports = [];
  const p = new Persistence(client, { storage: () => store, report: code => reports.push(code) });
  return { p, reports };
}

try {
  const a = makeClient(), b = makeClient();
  const blank = exported(a);
  equal(JSON.parse(blank).schemaVersion, 1);
  equal(b.call('importState', { stateJson: blank }), { changed: true });
  equal(exported(b), blank);
  populate(a);
  const original = exported(a), state = JSON.parse(original);
  equal(Object.keys(state).sort(), ['preferences','savedIds','schemaVersion','visitor']);
  equal(state.savedIds, ['fictional-003','fictional-001']);
  equal(state.visitor.genderId, profile.genderId);
  equal(state.visitor.showGender, false);
  b.call('importState', { stateJson: original });
  equal(exported(b), original);
  equal(b.call('discover'), a.call('discover'));
  equal(b.call('savedProfiles'), a.call('savedProfiles'));
  // A bookmark stores an ID, so renamed fictional profiles remain restorable.
  const oldData=JSON.parse(profilesJson);
  oldData.profiles=oldData.profiles.slice(0,30);
  oldData.profiles[0].displayName='Former demo alias';
  const oldClient=new Client(engine);clients.push(oldClient);
  oldClient.call('initialize',{catalogueJson,profilesJson:JSON.stringify(oldData)});
  oldClient.call('updateProfile',{profile});oldClient.call('save',{id:'fictional-001'});
  const migrated=makeClient();migrated.call('importState',{stateJson:exported(oldClient)});
  equal(migrated.call('savedProfiles')[0].displayName,JSON.parse(profilesJson).profiles[0].displayName);
  equal(migrated.call('getState').savedIds,['fictional-001']);
  const invalids = [ ['{', 'json'], ['null','state_shape'], ['[]','state_shape'], ['x'.repeat(65537),'size'] ];
  function invalid(change, code) { const value=structuredClone(state);change(value);invalids.push([JSON.stringify(value),code]); }
  invalid(v => delete v.schemaVersion, 'state_shape');
  invalid(v => v.extra=true, 'state_shape');
  for (const version of [0,2,'1',true,null,1e30]) invalid(v => v.schemaVersion=version, 'schema_version');
  invalids.push([original.replace('"schemaVersion":1','"schemaVersion":1.0'),'schema_version']);
  invalid(v => v.visitor.id='fictional-001', 'reserved_id');
  invalid(v => delete v.visitor.id, 'reserved_id');
  invalid(v => v.visitor.age=17, 'range');
  invalid(v => v.visitor.age=20.5, 'integer');
  invalid(v => v.visitor.age='22', 'integer');
  invalid(v => v.visitor.displayName=' ', 'required');
  invalid(v => v.visitor.bio='x'.repeat(301), 'length');
  invalid(v => v.visitor.interestIds=['coding','coding'], 'duplicate');
  invalid(v => v.visitor.campusId='missing', 'campus');
  invalid(v => v.visitor.showGender='false', 'boolean');
  invalid(v => v.preferences.minAge=99, 'age_order');
  invalid(v => v.preferences.genderIds=['missing'], 'reference');
  invalid(v => v.preferences.extra=1, 'unknown_field');
  invalid(v => v.savedIds='fictional-001', 'array');
  invalid(v => v.savedIds=[1], 'type');
  invalid(v => v.savedIds=['missing'], 'unknown_profile');
  invalid(v => v.savedIds=['visitor:local'], 'unknown_profile');
  invalid(v => v.savedIds=['fictional-001','fictional-001'], 'duplicate');
  invalid(v => v.savedIds=Array(46).fill('fictional-001'), 'array');
  invalid(v => v.visitor=null, 'profile_required');
  for (const [stateJson, code] of invalids) {
    assert.throws(() => b.call('importState', { stateJson }), error => error instanceof ApiError && error.errors.some(e=>e.code===code), `Expected ${code} for ${stateJson.slice(0,120)}`); checks++;
    equal(exported(b), original);
  }
  for (const payload of [{}, {stateJson:{}}, {stateJson:original, extra:true}]) {
    assert.throws(()=>b.call('importState',payload), error=>error.errors[0].code==='request_shape');checks++;
  }
  b.call('reset', { confirmed:true });
  equal(exported(b),blank);

  const store = new Storage();
  const {p, reports} = controller(a, store);
  equal(p.restore(),'empty'); equal(store.getItem(STORAGE_KEY),null);
  equal(p.save(),true); equal(store.getItem(STORAGE_KEY),original);
  const restored = makeClient(); const restoredController=controller(restored,store);
  equal(restoredController.p.restore(),'restored'); equal(exported(restored),original);
  store.writeFails=true; a.call('unsave',{id:'fictional-003'});
  equal(p.save(),false); equal(reports.at(-1),'write_failed');
  equal(a.call('getState').savedIds,['fictional-001']); equal(store.getItem(STORAGE_KEY),original);
  store.writeFails=false; equal(p.save(),true); equal(store.getItem(STORAGE_KEY),exported(a));
  // A stale page must not overwrite another tab's saved version.
  equal(restoredController.p.save(),false); equal(restoredController.reports.at(-1),'conflict');
  equal(store.getItem(STORAGE_KEY),exported(a));
  store.setItem(STORAGE_KEY,blank);p.checkExternalChange();equal(reports.at(-1),'conflict');equal(p.save(),false);
  equal(p.reset(),true);equal(store.getItem(STORAGE_KEY),null);equal(store.getItem('other.application'),'keep me');equal(exported(a),blank);
  populate(a);equal(p.save(),true);
  store.removeFails=true;equal(p.reset(),false);equal(reports.at(-1),'reset_failed');equal(exported(a),blank);
  equal(store.getItem(STORAGE_KEY),original);equal(p.save(),false);
  store.removeFails=false;equal(p.reset(),true);equal(store.getItem(STORAGE_KEY),null);

  for(const corrupt of ['{',JSON.stringify({...state,schemaVersion:8}),JSON.stringify({...state,savedIds:['obsolete-id']})]) {
    const s=new Storage();s.setItem(STORAGE_KEY,corrupt);const c=makeClient();const setup=controller(c,s);
    equal(setup.p.restore(),'invalid');equal(exported(c),blank);equal(setup.reports.at(-1),'invalid');
    populate(c);equal(setup.p.save(),false);equal(s.getItem(STORAGE_KEY),corrupt);
    setup.p.continueInMemory();equal(setup.p.save(),false);equal(s.getItem(STORAGE_KEY),corrupt);
    equal(setup.p.reset(),true);equal(s.getItem(STORAGE_KEY),null);equal(s.getItem('other.application'),'keep me');
  }
  const denied=new Storage();denied.setItem(STORAGE_KEY,original);denied.readFails=true;
  const unavailable=controller(makeClient(),denied);equal(unavailable.p.restore(),'memory');equal(unavailable.reports.at(-1),'read_failed');equal(unavailable.p.save(),false);
  const codes=[];const deniedAccess=new Persistence(makeClient(),{storage:()=>{throw new Error('SecurityError');},report:code=>codes.push(code)});
  equal(deniedAccess.restore(),'memory');equal(codes.at(-1),'read_failed');equal(deniedAccess.reset(),false);equal(codes.at(-1),'reset_failed');
  equal(STORAGE_KEY,'unimatch.demo.v1');
  console.log(`Persistence integration: ${checks} checks passed.`);
} finally { clients.forEach(client=>client.dispose()); }
