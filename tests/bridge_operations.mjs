import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [modulePath, cataloguePath, profilesPath, clientPath] = process.argv.slice(2);
const { default: create } = await import(pathToFileURL(modulePath).href);
const { Client, ApiError } = await import(pathToFileURL(clientPath).href);
const engine = await create();
const catalogueJson = await readFile(cataloguePath, 'utf8');
const profilesJson = await readFile(profilesPath, 'utf8');
let checks = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function fails(client, operation, payload, code) {
  assert.throws(() => client.call(operation, payload), error => error instanceof ApiError &&
    error.errors.length > 0 && error.errors.every(e => typeof e.path === 'string' && typeof e.message === 'string') &&
    (!code || error.errors.some(e => e.code === code))); checks++;
}
const a = new Client(engine), b = new Client(engine);
const init = { catalogueJson, profilesJson };
try {
  for (const [text, code] of [['{','json'], ['null','request_shape'], ['[]','request_shape'],
    ['{"operation":"getState"}','request_shape'], ['{"operation":1,"payload":{}}','request_shape'],
    ['{"operation":"getState","payload":{},"extra":1}','request_shape']]) {
    const result = JSON.parse(a.session.request(text));
    equal(Object.keys(result).sort(), ['apiVersion','data','errors','ok']);
    equal([result.apiVersion, result.ok, result.data, result.errors[0].code], [1,false,null,code]);
  }
  fails(a,'unknown',{},'unknown_operation');
  fails(a,'getState',{},'not_initialized');
  fails(a,'initialize',{ catalogueJson: {}, profilesJson },'request_shape');
  fails(a,'initialize',{ catalogueJson: '{', profilesJson });
  equal(a.call('initialize',init),{initialized:true});
  equal(b.call('initialize',init),{initialized:true});
  const {schemaVersion, ...catalogueChoices} = JSON.parse(catalogueJson);
  equal(a.call('getCatalogues'),catalogueChoices);
  equal(a.call('getState').visitor,null);
  fails(a,'discover'); fails(a,'savedProfiles');
  for (const [op,payload] of [['getState',{extra:true}],['discover',{id:'x'}],['save',{id:1}],
    ['viewProfile',{}],['unsave',{id:'x',extra:true}],['updateProfile',{profile:[]}],
    ['updatePreferences',{}],['reset',{confirmed:'false'}],['reset',{confirmed:1}]]) {
    fails(a,op,payload,'request_shape');
  }
  const profile = {...JSON.parse(profilesJson).profiles[0], displayName:'Demo 🎓'};
  delete profile.id;
  equal(a.call('updateProfile',{profile}),{changed:true});
  equal(a.call('getState').visitor.id,'visitor:local');
  equal(a.call('getState').visitor.displayName,'Demo 🎓');
  equal(b.call('getState').visitor,null);
  fails(a,'initialize',init,'already_initialized');
  const before = a.call('getState');
  fails(a,'updateProfile',{profile:{...profile,age:17}});
  fails(a,'updateProfile',{profile:{...profile,id:'fictional-001'}});
  fails(a,'updatePreferences',{preferences:{minAge:50,maxAge:20,genderIds:[]}});
  equal(a.call('getState'),before);
  equal(a.call('getState').preferences.campusId,profile.campusId);
  equal(a.call('updatePreferences',{preferences:{minAge:18,maxAge:100,genderIds:[]}}),{changed:true});
  const discovered = a.call('discover');
  equal(discovered.length,45);
  for (const campusId of ['nwu-potchefstroom','nwu-vanderbijlpark','nwu-mahikeng']) {
    a.call('updatePreferences',{preferences:{minAge:18,maxAge:100,genderIds:[],universityId:'nwu',campusId}});
    const campusProfiles=a.call('discover');
    equal(campusProfiles.length,5);
    equal(campusProfiles.every(p=>p.universityId==='nwu' && p.campusId===campusId),true);
  }
  a.call('updatePreferences',{preferences:{minAge:18,maxAge:100,genderIds:[]}});
  for (const view of discovered) {
    equal(view.sharedInterestCount,view.sharedInterestIds.length);
    equal(typeof view.explanation,'string');
    const original = JSON.parse(profilesJson).profiles.find(p => p.id === view.id);
    equal(view.genderId,original.showGender ? original.genderId : null);
    equal(a.call('viewProfile',{id:view.id}),view);
  }
  const id=discovered[0].id;
  equal(a.call('save',{id}),{changed:true});
  equal(a.call('save',{id}),{changed:false});
  equal(a.call('viewProfile',{id}).saved,true);
  a.call('updatePreferences',{preferences:{minAge:100,maxAge:100,genderIds:[]}});
  equal(a.call('discover'),[]);
  equal(a.call('savedProfiles').map(p => p.id),[id]);
  for (const op of ['save','unsave','viewProfile']) fails(a,op,{id:'missing'});
  equal(a.call('unsave',{id}),{changed:true});
  equal(a.call('unsave',{id}),{changed:false});
  a.call('save',{id});
  const savedState=a.call('getState');
  fails(a,'reset',{confirmed:false},'confirmation_required');
  equal(a.call('getState'),savedState);
  b.call('updateProfile',{profile});
  equal(a.call('reset',{confirmed:true}),{changed:true});
  equal(a.call('getState').visitor,null);
  equal(a.call('getState').savedIds,[]);
  equal(b.call('getState').visitor.displayName,'Demo 🎓');
  equal(a.call('getCatalogues').universities.length,4);
  a.dispose(); a.dispose();
  assert.throws(() => a.call('getState'),/disposed/); checks++;
} finally { a.dispose(); b.dispose(); }
console.log(`Bridge operations: ${checks} checks passed.`);
