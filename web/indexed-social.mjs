import {DemoSocial,SOCIAL_KEY,emptySocial,validateSocial} from './demo-social.mjs?v=1.15.0';
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const completed=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error??Error('Storage transaction aborted.'));tx.onerror=()=>{};});
export async function openSocial({indexedDB=globalThis.indexedDB,legacy=()=>globalThis.localStorage,name='orbit-social-v2'}={}){
 if(!indexedDB)throw Error('This browser does not support IndexedDB. Your existing data has been left untouched.');
 const opening=indexedDB.open(name,1);opening.onupgradeneeded=()=>{const db=opening.result;db.createObjectStore('meta');const records=db.createObjectStore('records',{keyPath:'key'});records.createIndex('collection','collection');};
 const db=await request(opening),channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel(name):null;db.onversionchange=()=>db.close();
 async function revision(){return (await request(db.transaction('meta').objectStore('meta').get('revision')))??null;}
 async function read(){const tx=db.transaction(['meta','records']),done=completed(tx);const [rev,meta,rows]=await Promise.all([request(tx.objectStore('meta').get('revision')),request(tx.objectStore('meta').get('schema')),request(tx.objectStore('records').getAll())]);await done;if(rev==null)return null;const data={version:meta.version};for(const key of meta.collections)data[key]=[];rows.sort((a,b)=>a.order-b.order);for(const row of rows)data[row.collection].push(row.value);return {revision:rev,data:validateSocial(data)};}
 async function commit(before,after,expected){
  const tx=db.transaction(['meta','records'],'readwrite'),done=completed(tx),meta=tx.objectStore('meta'),records=tx.objectStore('records');
  try{const current=(await request(meta.get('revision')))??null;if(current!==expected)throw Error('Another tab changed the social data. Reload before saving.');
   const collections=Object.keys(after).filter(k=>Array.isArray(after[k]));
   for(const key of collections){if(before?.[key]===after[key])continue;const old=before?.[key]??[],next=after[key];for(let i=0;i<Math.max(old.length,next.length);i++){const id=key+':'+i;if(i>=next.length)records.delete(id);else if(i>=old.length||JSON.stringify(old[i])!==JSON.stringify(next[i]))records.put({key:id,collection:key,order:i,value:next[i]});}}
   const nextRevision=(current??0)+1;meta.put(nextRevision,'revision');meta.put({version:after.version,collections},'schema');await done;channel?.postMessage({revision:nextRevision});return nextRevision;
  }catch(error){try{tx.abort();}catch{}await done.catch(()=>{});throw error;}
 }
 let snapshot=await read();if(!snapshot){let raw;try{raw=legacy().getItem(SOCIAL_KEY);}catch{throw Error('Existing browser storage could not be checked. No migration was attempted.');}const data=raw===null?emptySocial():validateSocial(JSON.parse(raw));try{await commit(null,data,null);}catch(e){if(await revision()===null)throw e;}snapshot=await read();}
 const r=new DemoSocial({storage:()=>({getItem:()=>null})});r.data=snapshot.data;r.expected=snapshot.revision;r.ready=true;
 r.persistence={commit,assertRevision:async expected=>{if(await revision()!==expected)throw Error('Another tab changed the social data. Reload before saving.');}};
 r.reload=async()=>{try{if(await revision()===r.expected&&r.ready)return true;const snapshot=await read();if(!snapshot)throw Error('Social database is unavailable.');r.data=snapshot.data;r.expected=snapshot.revision;r.ready=true;r.error='';return true;}catch(e){r.ready=false;r.error=e.message;return false;}};
 r.exportBackup=async()=>{const text=JSON.stringify({format:'orbit-social-backup',version:1,data:r.data},null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='orbit-social-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 r.importBackup=async text=>{const parsed=JSON.parse(text);if(parsed.format!=='orbit-social-backup'||parsed.version!==1)throw Error('Choose an Orbit social backup.');const data=validateSocial(parsed.data);await r.lock(async()=>{r.expected=await commit(r.data,data,r.expected);r.data=data;r.ready=true;r.error='';});};
 if(channel)channel.onmessage=()=>r.onExternalChange?.();
 r.close=()=>{channel?.close();db.close();};return r;
}
