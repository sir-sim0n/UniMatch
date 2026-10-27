import {applyEvent,validateEvent} from './campus-core.mjs?v=1.15.0';
export const TOPICS=['Study life','Campus life','Questions','Creativity','Sport','Technology'];
export const seedFeed=()=>({feedPosts:[
 {id:1,author:'naledi',title:'Does anyone else learn more when they explain it to a friend?',text:'Looking for a relaxed study group. We could each bring one tricky concept and work through it together. What helps you when a topic just will not click?',topic:'Study life',at:1792785600000},
 {id:2,author:'sipho',title:'Your campus is more than your timetable.',text:'A walk between lectures, a friendly game, a conversation with someone new. What is your favourite way to take a proper study break?',topic:'Campus life',at:1792782000000},
 {id:3,author:'ayesha',title:'What do you wish someone had told you in first year?',text:'I would tell myself that asking questions is a strength. Share one small thing that made university feel a little more like home.',topic:'Questions',at:1792778400000}
],feedReplies:[],follows:[],votes:[],postSaves:[]});
const text=(s,max)=>typeof s==='string'&&!!s.trim()&&[...s].length<=max;
export const isBlocked=(d,a,b)=>!!a&&d.blocks.some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function validateFeed(d,actors){
 for(const key of ['feedPosts','feedReplies','follows','votes','postSaves'])if(!Array.isArray(d[key]))throw Error('Invalid feed data.');
 const posts=new Set();let last=0;
 for(const x of d.feedPosts){if(!Number.isSafeInteger(x.id)||x.id<=last||!actors.includes(x.author)||!text(x.title,180)||!text(x.text,4000)||!(x.topic===null||TOPICS.includes(x.topic))||!Number.isFinite(x.at)||x.at<0)throw Error('Invalid public post.');validateEvent(x);last=x.id;posts.add(x.id);}
 const replies=new Map();last=0;
 for(const x of d.feedReplies){if(!Number.isSafeInteger(x.id)||x.id<=last||!posts.has(x.post)||!actors.includes(x.author)||!text(x.text,2000)||!Number.isFinite(x.at)||x.at<0||(x.parent!==null&&(!replies.has(x.parent)||replies.get(x.parent).post!==x.post)))throw Error('Invalid comment.');last=x.id;replies.set(x.id,x);}
 for(const key of ['follows','votes','postSaves']){const ids=new Set();for(const x of d[key]){const target=key==='follows'?x.to:x.post;if(!actors.includes(x.actor)||(key==='follows'?(!actors.includes(target)||target===x.actor):!posts.has(target))||ids.has(x.actor+':'+target))throw Error('Invalid feed relation.');ids.add(x.actor+':'+target);}}
}
export function visibleFeed(d,actor){
 const posts=d.feedPosts.filter(p=>!isBlocked(d,actor,p.author)),ids=new Set(posts.map(p=>p.id)),visible=new Set();
 const replies=d.feedReplies.filter(r=>{const ok=ids.has(r.post)&&!isBlocked(d,actor,r.author)&&(r.parent===null||visible.has(r.parent));if(ok)visible.add(r.id);return ok;});
 return structuredClone({posts,replies,follows:d.follows.filter(f=>f.actor===actor&&!isBlocked(d,actor,f.to)),votes:d.votes,postSaves:d.postSaves.filter(s=>s.actor===actor)});
}
export function changeFeed(d,actor,op,target,extra,time){
 if(op==='feed-publish'){if(!text(extra.title,180)||!text(extra.text,4000)||!(extra.topic===null||TOPICS.includes(extra.topic)))throw Error('Add a title (up to 180 characters) and a post (up to 4,000 characters).');d.feedPosts.push({id:(d.feedPosts.at(-1)?.id??0)+1,author:actor,title:extra.title.trim(),text:extra.text.trim(),topic:extra.topic,at:time});applyEvent(d.feedPosts.at(-1),extra);return;}
 if(op==='feed-follow'){if(!['personal','naledi','sipho','ayesha'].includes(target)||target===actor||isBlocked(d,actor,target))throw Error('This student is unavailable to follow.');const found=d.follows.some(f=>f.actor===actor&&f.to===target);d.follows=d.follows.filter(f=>!(f.actor===actor&&f.to===target));if(!found)d.follows.push({actor,to:target});return;}
 const post=d.feedPosts.find(p=>p.id===target);if(!post||post.deleted||isBlocked(d,actor,post.author))throw Error('This post is unavailable.');
 if(op==='feed-comment'){if(!text(extra.text,2000))throw Error('Write a comment of 1 to 2,000 characters.');if(extra.parent!==null&&!visibleFeed(d,actor).replies.some(r=>r.id===extra.parent&&r.post===target&&!r.deleted))throw Error('This comment is unavailable.');d.feedReplies.push({id:(d.feedReplies.at(-1)?.id??0)+1,post:target,author:actor,text:extra.text.trim(),parent:extra.parent,at:time});return;}
 if(op==='feed-vote'||op==='feed-save'){const key=op==='feed-vote'?'votes':'postSaves',found=d[key].some(x=>x.actor===actor&&x.post===target);d[key]=d[key].filter(x=>!(x.actor===actor&&x.post===target));if(!found)d[key].push({actor,post:target});return;}
 if(op==='feed-share')return; // Permission and stale/block check before copying a local deep link.
 throw Error('Unknown feed operation.');
}
