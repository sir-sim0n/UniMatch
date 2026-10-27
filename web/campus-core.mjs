export const PURPOSES=['Question','Discussion','Campus news','Looking for a group','Opportunity','Just for fun'];
const legacy={'Study help':'Question','Campus tip':'Campus news',Creative:'Just for fun'};
export const purpose=p=>legacy[p.flair]??(PURPOSES.includes(p.flair)?p.flair:p.topic==='Questions'?'Question':'Discussion');
export const topicKey=p=>p.topic||purpose(p);
const cleanList=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string'&&x.length<=120))].slice(-500):[];
export function loadReading(storage,key){try{const d=JSON.parse(storage.getItem(key)??'{}');return {hidden:cleanList(d.hidden),muted:cleanList(d.muted),less:cleanList(d.less),seen:d.seen&&typeof d.seen==='object'&&!Array.isArray(d.seen)?Object.fromEntries(Object.entries(d.seen).filter(([k,v])=>k.length<80&&Number.isSafeInteger(v)&&v>=0).slice(-500)): {}};}catch{return {hidden:[],muted:[],less:[],seen:{}};}}
export class ReadingState{
 constructor(actor='guest',space='demo',storage){if(storage===undefined)try{storage=globalThis.localStorage;}catch{}this.storage=storage;this.key='orbit.reading.v1.'+space+'.'+actor;this.data=loadReading(storage,this.key);this.saved=true;}
 persist(){try{this.storage.setItem(this.key,JSON.stringify(this.data));this.saved=true;}catch{this.saved=false;}return this.saved;}
 toggle(list,value){if(!['hidden','muted','less'].includes(list))throw Error('Invalid reading preference.');value=String(value);this.data[list]=this.data[list].includes(value)?this.data[list].filter(x=>x!==value):[...this.data[list],value].slice(-500);return this.persist();}
 visible(p){return !this.data.hidden.includes(String(p.id))&&!this.data.muted.includes(topicKey(p));}
 reduced(p){return this.data.less.includes(topicKey(p));}
 unread(id,total){const seen=this.data.seen[String(id)];return seen===undefined?0:Math.max(0,total-seen);}
 mark(id,total){this.data.seen[String(id)]=Math.max(0,total);this.data.seen=Object.fromEntries(Object.entries(this.data.seen).slice(-500));return this.persist();}
 reset(){this.data={hidden:[],muted:[],less:[],seen:{}};return this.persist();}
}
// Iterative traversal handles deep threads and missing parents across paginated batches.
export function threadRows(replies,{sort='Best',accepted=null,score=r=>r.upvotes??0}={}){
 const ids=new Set(replies.map(r=>r.id)),children=new Map();
 for(const r of replies){const parent=ids.has(r.parent)&&r.parent!==r.id?r.parent:null;if(!children.has(parent))children.set(parent,[]);children.get(parent).push(r);}
 const compare=(a,b)=>sort==='Best'?Number(b.id===accepted)-Number(a.id===accepted)||score(b)-score(a)||(a.at??a.id)-(b.at??b.id):(b.at??b.id)-(a.at??a.id);
 for(const rows of children.values())rows.sort(compare);
 const stack=[...(children.get(null)??[])].reverse().map(r=>({reply:r,depth:0,parent:null})),out=[],seen=new Set();
 while(stack.length){const entry=stack.pop(),r=entry.reply;if(seen.has(r.id))continue;seen.add(r.id);out.push(entry);for(const child of [...(children.get(r.id)??[])].reverse())stack.push({reply:child,depth:entry.depth+1,parent:r.id});}
 return out;
}
export const rankPreferences=(posts,reading)=>posts.map((p,i)=>({p,i})).sort((a,b)=>Number(reading.reduced(a.p))-Number(reading.reduced(b.p))||a.i-b.i).map(x=>x.p);
