import {readablePost} from './engagement-core.mjs?v=1.11.0';
// Local demo circle rules; production permissions must be enforced by a backend.
export const seedCircles=()=>[
 {id:'coding',title:'Campus Coding Circle',description:'Learn together, share small projects and find a study partner.',owner:'naledi',members:['naledi']},
 {id:'outdoors',title:'Fresh Air & Football',description:'Talk about campus walks, friendly football and active study breaks.',owner:'sipho',members:['sipho']},
 {id:'creative',title:'Creative Campus',description:'A place for photography, art and ideas that connect our campuses.',owner:'ayesha',members:['ayesha']}
].map(c=>({...c,rules:'',private:false,moderators:[c.owner],requests:[],flairs:[],pinned:null}));
const text=(s,max)=>typeof s==='string'&&!!s.trim()&&[...s].length<=max;
const blocked=(d,a,b)=>d.blocks.some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function validateCircles(d,actors){
 if(!Array.isArray(d.circles)||!Array.isArray(d.posts))throw Error('Invalid circles.');
 const ids=new Set();
 for(const c of d.circles){if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||!text(c.title,60)||!text(c.description,240)||!actors.includes(c.owner)||!Array.isArray(c.members)||!c.members.includes(c.owner)||new Set(c.members).size!==c.members.length||c.members.some(a=>!actors.includes(a)))throw Error('Invalid circle.');ids.add(c.id);
 if(typeof c.rules!=='string'||c.rules.length>2000||typeof c.private!=='boolean'||!Array.isArray(c.moderators)||!c.moderators.includes(c.owner)||new Set(c.moderators).size!==c.moderators.length||c.moderators.some(a=>!c.members.includes(a))||!Array.isArray(c.requests)||new Set(c.requests).size!==c.requests.length||c.requests.some(a=>!actors.includes(a)||c.members.includes(a))||!Array.isArray(c.flairs)||new Set(c.flairs.map(f=>f.actor)).size!==c.flairs.length||c.flairs.some(f=>!c.members.includes(f.actor)||!text(f.text,40)))throw Error('Invalid circle settings.');
 if(c.pinned!==null&&!d.posts.some(p=>p.id===c.pinned&&p.circle===c.id&&p.parent===null&&!p.hidden))throw Error('Invalid circle pin.');
 }
 let last=0;const posts=new Map();
 for(const x of d.posts){if(!x||!Number.isSafeInteger(x.id)||x.id<=last||!ids.has(x.circle)||!actors.includes(x.author)||!text(x.text,2000)||typeof x.hidden!=='boolean'||!Number.isFinite(x.at)||x.at<0)throw Error('Invalid circle post.');
 if(x.parent!==null){const parent=posts.get(x.parent);if(!parent||parent.circle!==x.circle||parent.parent!==null)throw Error('Invalid reply.');}if(x.original!=null&&(!d.feedPosts.some(p=>p.id===x.original)||x.parent!==null))throw Error('Invalid crosspost.');last=x.id;posts.set(x.id,x);}
}
export function circleView(d,actor){
 return structuredClone(d.circles.filter(c=>!blocked(d,actor,c.owner)).map(c=>{
 const joined=c.members.includes(actor),organiser=c.owner===actor,moderator=c.moderators.includes(actor);
 const visible=x=>!blocked(d,actor,x.author)&&(moderator||!x.hidden)&&(x.original==null||readablePost(d,actor,x.original));
 const roots=d.posts.filter(x=>x.circle===c.id&&x.parent===null&&visible(x));
 return {...c,members:joined?c.members:[],memberCount:c.members.length,moderators:joined?c.moderators:[],flairs:joined?c.flairs:[],requests:moderator?c.requests:c.requests.filter(a=>a===actor),joined,organiser,moderator,posts:joined?d.posts.filter(x=>x.circle===c.id&&visible(x)&&(x.parent===null||roots.some(r=>r.id===x.parent))):[]};
 }));
}
export function changeCircle(d,actor,op,target,extra,time){
 if(op==='circle-create'){
 if(!text(extra.title,60)||!text(extra.description,240))throw Error('Use a title of 1–60 characters and a description of 1–240 characters.');
 if(d.circles.some(c=>c.title.toLocaleLowerCase()===extra.title.trim().toLocaleLowerCase()))throw Error('A circle with that name already exists.');
 let id=`circle-${d.circles.length+1}`;while(d.circles.some(c=>c.id===id))id+='x';
 d.circles.push({id,title:extra.title.trim(),description:extra.description.trim(),owner:actor,members:[actor],rules:'',private:extra.private===true,moderators:[actor],requests:[],flairs:[],pinned:null});return;
 }
 const c=d.circles.find(c=>c.id===target);if(!c||blocked(d,actor,c.owner))throw Error('This circle is unavailable.');
 if(op==='circle-join'){if(c.members.includes(actor))throw Error('You already belong to this circle.');if(c.private){if(c.requests.includes(actor))throw Error('Your request is already pending.');c.requests.push(actor);}else c.members.push(actor);return;}
 if(op==='circle-cancel-request'){c.requests=c.requests.filter(a=>a!==actor);return;}
 if(op==='circle-review-request'){if(!c.moderators.includes(actor))throw Error('Only moderators can review requests.');if(!c.requests.includes(extra.actor)||blocked(d,actor,extra.actor)||blocked(d,c.owner,extra.actor))throw Error('Request unavailable.');if(typeof extra.accept!=='boolean')throw Error('Choose accept or decline.');c.requests=c.requests.filter(a=>a!==extra.actor);if(extra.accept)c.members.push(extra.actor);return;}

 if(op==='circle-leave'){if(actor===c.owner)throw Error('The organiser must stay in their circle in this demo.');if(!c.members.includes(actor))throw Error('Join this circle first.');c.members=c.members.filter(a=>a!==actor);c.moderators=c.moderators.filter(a=>a!==actor);c.flairs=c.flairs.filter(f=>f.actor!==actor);return;}
 if(!c.members.includes(actor))throw Error('Join this circle before posting or replying.');
 if(op==='circle-settings'){if(actor!==c.owner)throw Error('Only the organiser can change privacy and rules.');if(typeof extra.rules!=='string'||extra.rules.length>2000||typeof extra.private!=='boolean')throw Error('Use rules up to 2,000 characters and a valid privacy setting.');c.rules=extra.rules.trim();c.private=extra.private;if(!c.private)c.requests=[];return;}
 if(op==='circle-moderator'){if(actor!==c.owner)throw Error('Only the organiser can appoint moderators.');if(extra.actor===c.owner||!c.members.includes(extra.actor)||blocked(d,actor,extra.actor))throw Error('Choose another available member.');c.moderators=c.moderators.includes(extra.actor)?c.moderators.filter(a=>a!==extra.actor):[...c.moderators,extra.actor];return;}
 if(op==='circle-flair'){if(typeof extra.text!=='string'||extra.text.length>40)throw Error('Use up to 40 characters.');c.flairs=c.flairs.filter(f=>f.actor!==actor);if(extra.text.trim())c.flairs.push({actor,text:extra.text.trim()});return;}
 if(op==='circle-pin'){if(!c.moderators.includes(actor))throw Error('Only moderators can pin posts.');if(extra.post!==null&&!d.posts.some(p=>p.id===extra.post&&p.circle===target&&p.parent===null&&!p.hidden&&!blocked(d,actor,p.author)&&(p.original==null||readablePost(d,actor,p.original))))throw Error('Post unavailable.');c.pinned=extra.post;return;}
 if(op==='circle-crosspost'){const p=d.feedPosts.find(p=>p.id===extra.post&&!p.deleted);if(!p||!readablePost(d,actor,p.id))throw Error('Original post unavailable.');if(d.posts.some(x=>x.circle===target&&x.original===p.id))throw Error('This post is already in this circle.');d.posts.push({id:(d.posts.at(-1)?.id??0)+1,circle:target,author:actor,text:'Shared from the public Orbit feed.',original:p.id,parent:null,at:time,hidden:false});return;}
 if(op==='circle-post'){
 if(!text(extra.text,2000))throw Error('Write 1 to 2,000 characters.');
 if(extra.parent!==null){const parent=d.posts.find(x=>x.id===extra.parent);if(!parent||parent.circle!==target||parent.parent!==null||parent.hidden||blocked(d,actor,parent.author))throw Error('This post is unavailable for replies.');}
 d.posts.push({id:(d.posts.at(-1)?.id??0)+1,circle:target,author:actor,text:extra.text.trim(),parent:extra.parent,at:time,hidden:false});return;
 }
 if(op==='circle-hide'||op==='circle-restore'){
 if(!c.moderators.includes(actor))throw Error('Only this circle’s moderators can moderate posts.');
 const post=d.posts.find(x=>x.id===extra.post&&x.circle===target);if(!post||blocked(d,actor,post.author))throw Error('This post is unavailable.');post.hidden=op==='circle-hide';if(post.hidden&&c.pinned===post.id)c.pinned=null;return;
 }
 throw Error('Unknown circle operation.');
}
