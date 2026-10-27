// Local demo engagement rules. No external delivery or inferred popularity.
export const FLAIRS=['Question','Discussion','Campus news','Looking for a group','Opportunity','Just for fun','Study help','Campus tip','Creative'];
export const handles=['personal','naledi','sipho','ayesha'];
export const mentions=s=>[...new Set([...s.matchAll(/(?:^|[^\w@])@([a-z][a-z0-9_]*)\b/gi)].map(m=>m[1].toLowerCase()).filter(x=>handles.includes(x)))];
export const hashtags=s=>[...new Set([...s.matchAll(/(?:^|[^\w#])#([\p{L}\p{N}_]{1,40})(?![\p{L}\p{N}_])/gu)].map(m=>m[1].toLowerCase()))];
export const seedEngagement=()=>({notifications:[],pins:[]});
const blocked=(d,a,b)=>d.blocks.some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function validateEngagement(d){
 const ids=new Set(d.feedPosts.map(p=>p.id));
 for(const p of d.feedPosts){if(p.kind!==undefined&&!['post','repost','quote'].includes(p.kind))throw Error('Invalid post kind.');if(p.original!=null&&(!ids.has(p.original)||p.original>=p.id))throw Error('Invalid original post.');if(['repost','quote'].includes(p.kind)&&p.original==null)throw Error('Missing original post.');if(p.flair!=null&&!FLAIRS.includes(p.flair))throw Error('Invalid flair.');}
 if(!Array.isArray(d.notifications)||!Array.isArray(d.pins))throw Error('Invalid engagement data.');
 const keys=new Set();let last=0;
 for(const n of d.notifications){if(!Number.isSafeInteger(n.id)||n.id<=last||!handles.includes(n.from)||!handles.includes(n.to)||n.from===n.to||!['mention','reply','follow','upvote','repost','quote','request','accepted','message','game'].includes(n.kind)||typeof n.key!=='string'||!n.key||keys.has(n.key)||typeof n.read!=='boolean'||!Number.isFinite(n.at)||n.at<0||(n.post!==null&&!ids.has(n.post)))throw Error('Invalid notification.');last=n.id;keys.add(n.key);}
 const owners=new Set();for(const pin of d.pins){if(owners.has(pin.actor)||!d.feedPosts.some(p=>p.id===pin.post&&p.author===pin.actor))throw Error('Invalid profile pin.');owners.add(pin.actor);}
}
const rawPostMaps=new WeakMap();
export function readablePost(d,actor,id){let map=rawPostMaps.get(d.feedPosts);if(!map||map.size!==d.feedPosts.length){map=new Map(d.feedPosts.map(p=>[p.id,p]));rawPostMaps.set(d.feedPosts,map);}const seen=new Set();let p=map.get(id);if(!p)return false;while(p){if(seen.has(p.id)||actor&&blocked(d,actor,p.author))return false;seen.add(p.id);p=p.original!=null?map.get(p.original):null;}return true;}
export function notificationsFor(d,actor){return structuredClone(d.notifications.filter(n=>n.to===actor&&!blocked(d,actor,n.from)&&(n.post===null||!d.feedPosts.find(p=>p.id===n.post)?.deleted&&readablePost(d,actor,n.post))).sort((a,b)=>b.id-a.id));}
export function recordActivity(d,before,actor,op,target,extra,time){
 const add=(to,kind,key,post=null)=>{key=`${actor}:${to}:${key}`;if(to===actor||!handles.includes(to)||blocked(d,actor,to)||d.notifications.some(n=>n.key===key))return;d.notifications.push({id:(d.notifications.at(-1)?.id??0)+1,from:actor,to,kind,key,post,at:time,read:false});};
 if(op==='feed-publish'||op==='feed-thread'||op==='feed-quote'||op==='feed-repost'){const p=d.feedPosts.at(-1);if(p.original!=null)add(d.feedPosts.find(x=>x.id===p.original).author,p.kind,`post:${p.id}`,p.id);if(p.kind!=='repost')for(const to of mentions(p.title+' '+p.text))add(to,'mention',`mention-post:${p.id}`,p.id);}
 if(op==='feed-comment'){const r=d.feedReplies.at(-1),p=d.feedPosts.find(p=>p.id===target),parent=d.feedReplies.find(x=>x.id===r.parent);const tos=new Set(mentions(r.text));tos.delete(actor);for(const to of tos)add(to,'mention',`comment:${r.id}`,p.id);for(const to of new Set([p.author,parent?.author]))if(!tos.has(to))add(to,'reply',`comment:${r.id}`,p.id);}
 if(op==='feed-edit-post'||op==='feed-edit-comment'){const postOp=op==='feed-edit-post',item=(postOp?d.feedPosts:d.feedReplies).find(x=>x.id===target),old=(postOp?before.feedPosts:before.feedReplies).find(x=>x.id===target),previous=new Set(mentions((old.title||'')+' '+old.text));for(const to of mentions((item.title||'')+' '+item.text))if(!previous.has(to))add(to,'mention',postOp?`mention-post:${item.id}`:`comment:${item.id}`,postOp?item.id:item.post);}
 if(op==='feed-follow'&&d.follows.some(f=>f.actor===actor&&f.to===target))add(target,'follow','follow');
 if(op==='feed-vote'&&d.votes.some(v=>v.actor===actor&&v.post===target))add(d.feedPosts.find(p=>p.id===target).author,'upvote',`vote:${target}`,target);
 if(op==='request')add(target,'request',`request:${time}`);
 if(op==='accept')add(target,'accepted',`accepted:${time}`);
 if(op.startsWith('game-')){const g=op==='game-invite'?d.games.at(-1):d.games.find(g=>g.id===extra.game);if(g)add(target,'game',`game:${g.id}:${op}:${g.moves.length}`);}
 if(op==='send')add(target,'message',`message:${d.messages.at(-1).id}`);
}
export function changeEngagement(d,actor,op,target,extra,time){
 if(op==='feed-notification-read'){const rows=notificationsFor(d,actor);if(target!==null&&!rows.some(n=>n.id===target))throw Error('Notification unavailable.');const ids=new Set(rows.filter(n=>target===null||n.id===target).map(n=>n.id));for(const n of d.notifications)if(ids.has(n.id))n.read=true;return true;}
 if(op==='feed-pin'){const p=d.feedPosts.find(p=>p.id===target);if(!p||p.deleted||p.author!==actor)throw Error('Only your own posts can be pinned.');const on=d.pins.some(p=>p.actor===actor&&p.post===target);d.pins=d.pins.filter(p=>p.actor!==actor);if(!on)d.pins.push({actor,post:target});return true;}
 if(op==='feed-repost'||op==='feed-quote'){let original=d.feedPosts.find(p=>p.id===target);if(!original||original.deleted||!readablePost(d,actor,target))throw Error('Original post unavailable.');while(original.kind==='repost')original=d.feedPosts.find(p=>p.id===original.original);if(original.deleted)throw Error('Original post deleted.');const quote=op==='feed-quote';if(!quote&&d.feedPosts.some(p=>!p.deleted&&p.author===actor&&p.kind==='repost'&&p.original===original.id))throw Error('You have already reposted this post.');if(quote&&(typeof extra.text!=='string'||!extra.text.trim()||[...extra.text].length>4000))throw Error('Add your thoughts (up to 4,000 characters).');d.feedPosts.push({id:d.feedPosts.at(-1).id+1,author:actor,kind:quote?'quote':'repost',original:original.id,title:quote?'A thought on campus':'Reposted to my profile',text:quote?extra.text.trim():'Shared with my campus community.',topic:original.topic,flair:null,at:time});return true;}
 return false;
}
const indexes=new WeakMap();
export function feedIndex(data){
 if(indexes.has(data))return indexes.get(data);
 const posts=new Map(data.posts.map(p=>[p.id,p])),repliesByPost=new Map(),replyById=new Map(),votes=new Map(),scores=new Map(),replyScores=new Map(),karmaByActor=new Map(),awardsByPost=new Map();
 for(const r of data.replies){replyById.set(r.id,r);if(!repliesByPost.has(r.post))repliesByPost.set(r.post,[]);repliesByPost.get(r.post).push(r);if(!r.deleted&&r.author!==posts.get(r.post)?.author)replyScores.set(r.post,(replyScores.get(r.post)||0)+1);}
 for(const v of data.votes){votes.set(v.post,(votes.get(v.post)||0)+1);if(v.actor!==posts.get(v.post)?.author)scores.set(v.post,(scores.get(v.post)||0)+1);}
 for(const a of data.awards??[]){if(!awardsByPost.has(a.post))awardsByPost.set(a.post,[]);awardsByPost.get(a.post).push(a);}
 for(const post of data.posts)if(!post.deleted)karmaByActor.set(post.author,(karmaByActor.get(post.author)||0)+(post.kind==='repost'?0:scores.get(post.id)||0)+2*(awardsByPost.get(post.id)?.length||0));
 for(const a of data.bestAnswers??[]){const post=posts.get(a.post),reply=replyById.get(a.reply);if(post&&!post.deleted&&(post.topic==='Questions'||post.flair==='Question')&&reply&&!reply.deleted)karmaByActor.set(reply.author,(karmaByActor.get(reply.author)||0)+5);}
 const result={posts,repliesByPost,replyById,votes,scores,replyScores,karmaByActor,awardsByPost};if(Object.isFrozen(data))indexes.set(data,result);return result;
}
export const score=(p,data)=>feedIndex(data).scores.get(p.id)||0;
export const karma=(actor,data)=>feedIndex(data).karmaByActor.get(actor)||0;
export function sortFeed(posts,data,mode,now=Date.now(),period='all',profile=null){
 const cut=period==='day'?now-86400000:period==='week'?now-7*86400000:-Infinity,follows=new Set(data.follows.map(f=>f.to)),index=feedIndex(data),pins=new Set(data.pins.filter(x=>x.actor===profile).map(x=>x.post)),ranks=new Map();
 if(['Hot','Top'].includes(mode))for(const p of posts)ranks.set(p.id,mode==='Hot'?((index.scores.get(p.id)||0)+(index.replyScores.get(p.id)||0)+1)/Math.pow(Math.max(0,(now-p.at)/3600000)+2,1.5):index.scores.get(p.id)||0);
 return posts.filter(p=>mode!=='Top'||p.at>=cut).sort((a,b)=>(profile?Number(pins.has(b.id))-Number(pins.has(a.id)):0)||(mode==='For you'?Number(follows.has(b.author))-Number(follows.has(a.author)):['Hot','Top'].includes(mode)?ranks.get(b.id)-ranks.get(a.id):0)||b.at-a.at||b.id-a.id);
}
export function trending(posts,now=Date.now()){const map=new Map();for(const p of posts.filter(p=>!p.deleted&&p.kind!=='repost'&&p.at>=now-7*86400000&&p.at<=now)){for(const tag of hashtags(p.title+' '+p.text)){const e=map.get(tag)||{tag,count:0,authors:new Set()};e.count++;e.authors.add(p.author);map.set(tag,e);}}return [...map.values()].sort((a,b)=>b.authors.size-a.authors.size||b.count-a.count||a.tag.localeCompare(b.tag)).slice(0,5);}
