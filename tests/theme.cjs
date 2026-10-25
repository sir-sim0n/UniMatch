const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname,'../web/theme.js'),'utf8');
function setup(saved=null,dark=false,fail=false){
 const listeners={},ml={},root={dataset:{},style:{}},store=new Map(saved===null?[]:[['orbit.appearance.v1',saved]]);
 const media={matches:dark,addEventListener:(k,f)=>ml[k]=f};
 const window={matchMedia:()=>media,dispatchEvent:()=>{},addEventListener:(k,f)=>listeners[k]=f};
 vm.runInNewContext(source,{window,document:{documentElement:root,getElementById:()=>null},CustomEvent:class{},localStorage:{getItem:k=>{if(fail)throw Error();return store.get(k)},setItem:(k,v)=>{if(fail)throw Error();store.set(k,v)}}});
 return {theme:window.OrbitTheme,root,media,ml,listeners,store};
}
let t=setup(null,true);assert.equal(t.root.dataset.theme,'dark');t.media.matches=false;t.ml.change();assert.equal(t.root.dataset.theme,'light');
assert.equal(t.theme.set('dark'),true);t.media.matches=false;t.ml.change();assert.equal(t.root.dataset.theme,'dark');assert.equal(t.store.get('orbit.appearance.v1'),'dark');
assert.equal(setup('light',true).root.dataset.theme,'light');assert.equal(setup('invalid',true).theme.preference,'system');
t.listeners.storage({key:'orbit.appearance.v1',newValue:'light'});assert.equal(t.root.dataset.theme,'light');t.listeners.storage({key:null,newValue:null});assert.equal(t.theme.preference,'system');
assert.throws(()=>t.theme.set('blue'));t=setup(null,false,true);assert.equal(t.theme.set('dark'),false);assert.equal(t.root.dataset.theme,'dark');
console.log('Theme checks passed: system changes, overrides, reload, cross-tab updates, invalid data and storage failure.');
