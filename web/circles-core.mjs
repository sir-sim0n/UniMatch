// Local demo circle rules; production permissions must be enforced by a backend.
export const seedCircles=()=>[
 {id:'coding',title:'Campus Coding Circle',description:'Learn together, share small projects and find a study partner.',owner:'naledi',members:['naledi']},
 {id:'outdoors',title:'Fresh Air & Football',description:'Talk about campus walks, friendly football and active study breaks.',owner:'sipho',members:['sipho']},
 {id:'creative',title:'Creative Campus',description:'A place for photography, art and ideas that connect our campuses.',owner:'ayesha',members:['ayesha']}
];
const text=(s,max)=>typeof s==='string'&&!!s.trim()&&[...s].length<=max;
const blocked=(d,a,b)=>d.blocks.some(x=>(x.from===a&&x.to===b)||(x.from===b&&x.to===a));
export function validateCircles(d,actors){
 if(!Array.isArray(d.circles)||!Array.isArray(d.posts))throw Error('Invalid circles.');
 const ids=new Set();
 for(const c of d.circles){if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||!text(c.title,60)||!text(c.description,240)||!actors.includes(c.owner)||!Array.isArray(c.members)||!c.members.includes(c.owner)||new Set(c.members).size!==c.members.length||c.members.some(a=>!actors.includes(a)))throw Error('Invalid circle.');ids.add(c.id);}
 let last=0;const posts=new Map();
 for(const x of d.posts){if(!x||!Number.isSafeInteger(x.id)||x.id<=last||!ids.has(x.circle)||!actors.includes(x.author)||!text(x.text,2000)||typeof x.hidden!=='boolean'||!Number.isFinite(x.at)||x.at<0)throw Error('Invalid circle post.');
 if(x.parent!==null){const parent=posts.get(x.parent);if(!parent||parent.circle!==x.circle||parent.parent!==null)throw Error('Invalid reply.');}last=x.id;posts.set(x.id,x);}
}
export function circleView(d,actor){
 return structuredClone(d.circles.filter(c=>!blocked(d,actor,c.owner)).map(c=>{
 const joined=c.members.includes(actor),organiser=c.owner===actor;
 const visible=x=>!blocked(d,actor,x.author)&&(organiser||!x.hidden);
 const roots=d.posts.filter(x=>x.circle===c.id&&x.parent===null&&visible(x));
 return {...c,joined,organiser,posts:joined?d.posts.filter(x=>x.circle===c.id&&visible(x)&&(x.parent===null||roots.some(r=>r.id===x.parent))):[]};
 }));
}
export function changeCircle(d,actor,op,target,extra,time){
 if(op==='circle-create'){
 if(!text(extra.title,60)||!text(extra.description,240))throw Error('Use a title of 1–60 characters and a description of 1–240 characters.');
 if(d.circles.some(c=>c.title.toLocaleLowerCase()===extra.title.trim().toLocaleLowerCase()))throw Error('A circle with that name already exists.');
 let id=`circle-${d.circles.length+1}`;while(d.circles.some(c=>c.id===id))id+='x';
 d.circles.push({id,title:extra.title.trim(),description:extra.description.trim(),owner:actor,members:[actor]});return;
 }
 const c=d.circles.find(c=>c.id===target);if(!c||blocked(d,actor,c.owner))throw Error('This circle is unavailable.');
 if(op==='circle-join'){if(c.members.includes(actor))throw Error('You already belong to this circle.');c.members.push(actor);return;}
 if(op==='circle-leave'){if(actor===c.owner)throw Error('The organiser must stay in their circle in this demo.');if(!c.members.includes(actor))throw Error('Join this circle first.');c.members=c.members.filter(a=>a!==actor);return;}
 if(!c.members.includes(actor))throw Error('Join this circle before posting or replying.');
 if(op==='circle-post'){
 if(!text(extra.text,2000))throw Error('Write 1 to 2,000 characters.');
 if(extra.parent!==null){const parent=d.posts.find(x=>x.id===extra.parent);if(!parent||parent.circle!==target||parent.parent!==null||parent.hidden||blocked(d,actor,parent.author))throw Error('This post is unavailable for replies.');}
 d.posts.push({id:(d.posts.at(-1)?.id??0)+1,circle:target,author:actor,text:extra.text.trim(),parent:extra.parent,at:time,hidden:false});return;
 }
 if(op==='circle-hide'||op==='circle-restore'){
 if(actor!==c.owner)throw Error('Only this circle’s organiser can moderate posts.');
 const post=d.posts.find(x=>x.id===extra.post&&x.circle===target);if(!post||blocked(d,actor,post.author))throw Error('This post is unavailable.');post.hidden=op==='circle-hide';return;
 }
 throw Error('Unknown circle operation.');
}
