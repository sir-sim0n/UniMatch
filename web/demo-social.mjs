import { seedCircles, validateCircles, circleView, changeCircle } from './circles-core.mjs?v=1.5.0';
// Demo-only shared state. Not authentication or a security boundary.
export const SOCIAL_KEY = 'orbit.demo.social.v1';
export const ACTORS = ['personal', 'naledi', 'sipho', 'ayesha'];
export const REASONS = ['Spam', 'Harassment', 'Impersonation', 'Other'];
const empty = () => ({ version: 3, requests: [], blocks: [], reports: [], messages: [], circles:seedCircles(), posts:[] });
const pair = (a,b) => [a,b].sort().join(':');
const validActor = a => ACTORS.includes(a);
function members(a,b) { if (!validActor(a) || !validActor(b) || a===b) throw Error('Choose two different demo accounts.'); }
function validate(d) {
  if(d?.version===1)d={...d,version:2,messages:[]};
  if(d?.version===2)d={...d,version:3,circles:seedCircles(),posts:[]};
  if (!d || d.version!==3 || !Array.isArray(d.requests) || !Array.isArray(d.blocks) || !Array.isArray(d.reports)) throw Error('Invalid social data.');
  const pairs=new Set(), blocks=new Set(), reports=new Set();
  for(const q of d.requests){members(q.from,q.to);const key=pair(q.from,q.to);if(pairs.has(key)||!['pending','accepted','declined','cancelled','removed'].includes(q.status)||!Number.isFinite(q.at)||q.at<0)throw Error('Invalid request.');pairs.add(key);}
  for(const b of d.blocks){members(b.from,b.to);const key=b.from+':'+b.to;if(blocks.has(key))throw Error('Duplicate block.');blocks.add(key);}
  for(const q of d.requests)if(['pending','accepted'].includes(q.status)&&d.blocks.some(b=>pair(b.from,b.to)===pair(q.from,q.to)))throw Error('Blocked connection.');
  for(const x of d.reports){members(x.from,x.to);if(typeof x.id!=='string'||!x.id||reports.has(x.id)||!REASONS.includes(x.reason)||typeof x.details!=='string'||[...x.details].length>1000||!Number.isFinite(x.at)||x.at<0)throw Error('Invalid report.');reports.add(x.id);}
  if(!Array.isArray(d.messages))throw Error('Invalid messages.');
  let last=0;
  for(const m of d.messages){members(m.from,m.to);if(!Number.isSafeInteger(m.id)||m.id<=last||typeof m.text!=='string'||!m.text.trim()||[...m.text].length>2000||typeof m.read!=='boolean'||!Number.isFinite(m.at)||m.at<0)throw Error('Invalid message.');last=m.id;}
  validateCircles(d,ACTORS);
  return d;
}
export class DemoSocial {
  constructor({ storage=()=>globalThis.localStorage, now=()=>Date.now(), lock=task=>globalThis.navigator?.locks ? navigator.locks.request(SOCIAL_KEY,task) : task() }={}) {
    this.storage=storage;this.now=now;this.lock=lock;this.data=empty();this.expected=null;this.error='';this.ready=false;this.reload();
  }
  reload(){try{const text=this.storage().getItem(SOCIAL_KEY);const data=text===null?empty():validate(JSON.parse(text));this.data=data;this.expected=text;this.ready=true;this.error='';return true;}catch{this.ready=false;this.error='Demo social data could not be read. It has been left untouched. Reload saved data or explicitly reset the shared social demo.';return false;}}
  blocked(a,b){return this.data.blocks.some(x=>pair(x.from,x.to)===pair(a,b));}
  relation(a,b){members(a,b);if(this.blocked(a,b))return 'unavailable';const q=this.data.requests.find(x=>pair(x.from,x.to)===pair(a,b));if(!q)return 'none';return q.status==='pending'?(q.from===a?'outgoing':'incoming'):q.status;}
  view(actor){if(!validActor(actor))throw Error('Unknown demo account.');return structuredClone({requests:this.data.requests.filter(q=>(q.from===actor||q.to===actor)&&!this.blocked(q.from,q.to)),blocks:this.data.blocks.filter(b=>b.from===actor),reports:this.data.reports.filter(x=>x.from===actor)});}
  conversation(actor,target){members(actor,target);if(!this.ready)throw Error(this.error);if(this.blocked(actor,target))return [];return structuredClone(this.data.messages.filter(m=>pair(m.from,m.to)===pair(actor,target)));}
  unread(actor,target){return this.relation(actor,target)==='accepted'?this.conversation(actor,target).filter(m=>m.to===actor&&!m.read).length:0;}
  circles(actor){if(!validActor(actor))throw Error('Unknown demo account.');if(!this.ready)throw Error(this.error);return circleView(this.data,actor);}
  async change(actor,op,target,extra={}) {
    const circleOp=typeof op==='string'&&op.startsWith('circle-');
    if(circleOp){if(!validActor(actor))throw Error('Unknown demo account.');}else members(actor,target);
    return this.lock(async()=>{
      if(!this.ready)throw Error(this.error);
      let store;
      try{store=this.storage();if(store.getItem(SOCIAL_KEY)!==this.expected){this.ready=false;this.error='Another tab changed demo social data. Reload saved data before continuing.';throw Error(this.error);}}catch(e){throw Error(e.message||'Storage is unavailable.');}
      const d=structuredClone(this.data),time=this.now();
      const same=q=>pair(q.from,q.to)===pair(actor,target);
      let q=d.requests.find(same);
      const blocked=d.blocks.some(same);
      if(circleOp){changeCircle(d,actor,op,target,extra,time);}
      else if(op==='send'||op==='read'){
        if(blocked||!q||q.status!=='accepted')throw Error('An active connection is required to message this account.');
        if(op==='send'){
          if(typeof extra.text!=='string'||!extra.text.trim()||[...extra.text].length>2000)throw Error('Write a message of 1 to 2,000 characters.');
          d.messages.push({id:(d.messages.at(-1)?.id??0)+1,from:actor,to:target,text:extra.text.trim(),at:time,read:false});
        }else for(const m of d.messages)if(m.from===target&&m.to===actor)m.read=true;
      }else if(op==='request'){
        if(blocked)throw Error('This account is unavailable.');
        if(q&&['pending','accepted'].includes(q.status))throw Error('A request or connection already exists.');
        if(q?.status==='declined'&&time-q.at<7*86400000)throw Error('A declined request has a seven-day demo cooldown.');
        d.requests=d.requests.filter(x=>!same(x));d.requests.push({from:actor,to:target,status:'pending',at:time});
      }else if(op==='accept'||op==='decline'){
        if(blocked||!q||q.status!=='pending'||q.to!==actor)throw Error('Only the recipient can respond to a pending request.');
        q.status=op==='accept'?'accepted':'declined';q.at=time;
      }else if(op==='cancel'){
        if(!q||q.status!=='pending'||q.from!==actor)throw Error('Only the sender can cancel a pending request.');q.status='cancelled';q.at=time;
      }else if(op==='remove'){
        if(!q||q.status!=='accepted')throw Error('There is no accepted connection to remove.');q.status='removed';q.at=time;
      }else if(op==='block'){
        if(!d.blocks.some(b=>b.from===actor&&b.to===target))d.blocks.push({from:actor,to:target});
        d.requests=d.requests.filter(x=>!same(x));
      }else if(op==='unblock'){
        d.blocks=d.blocks.filter(b=>!(b.from===actor&&b.to===target));
      }else if(op==='report'){
        if(!REASONS.includes(extra.reason))throw Error('Choose a report reason.');
        if(typeof extra.details!=='string'||[...extra.details].length>1000)throw Error('Report details must be at most 1,000 characters.');
        const id=`report-${time}-${d.reports.length+1}`;
        d.reports.push({id,from:actor,to:target,reason:extra.reason,details:extra.details.trim(),at:time});
      }else throw Error('Unknown social operation.');
      validate(d);const text=JSON.stringify(d);
      try{store.setItem(SOCIAL_KEY,text);}catch{throw Error('Could not save demo social data. No change was applied. Free browser storage and try again.');}
      this.data=d;this.expected=text;return true;
    });
  }
  async resetAll(confirmed){if(confirmed!==true)throw Error('Confirm resetting shared social data.');return this.lock(async()=>{try{this.storage().removeItem(SOCIAL_KEY);}catch{throw Error('Could not reset shared social data.');}this.data=empty();this.expected=null;this.error='';this.ready=true;});}
}
