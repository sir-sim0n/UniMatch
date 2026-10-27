import {hashtags,FLAIRS} from './engagement-core.mjs?v=1.13.0';
const validText=(x,max)=>typeof x==='string'&&!!x.trim()&&[...x].length<=max;
export function validateDiscovery(d){
 if(!Array.isArray(d.profileFlairs))throw Error('Invalid profile flair data.');const actors=new Set();
 for(const x of d.profileFlairs){if(!['personal','naledi','sipho','ayesha'].includes(x.actor)||actors.has(x.actor)||!FLAIRS.includes(x.flair))throw Error('Invalid profile flair.');actors.add(x.actor);}
 for(const x of [...d.feedPosts,...d.feedReplies]){if(x.deleted!==undefined&&typeof x.deleted!=='boolean'||x.editedAt!==undefined&&(!Number.isFinite(x.editedAt)||x.editedAt<x.at))throw Error('Invalid content revision.');if(x.deleted&&(x.text!=='[Deleted]'||'title' in x&&x.title!=='Deleted post'))throw Error('Deleted text must be removed.');}
}
export function changeContent(d,actor,op,id,extra,time){
 if(op==='feed-profile-flair'){if(extra.flair!==null&&!FLAIRS.includes(extra.flair))throw Error('Choose a profile flair.');d.profileFlairs=d.profileFlairs.filter(x=>x.actor!==actor);if(extra.flair)d.profileFlairs.push({actor,flair:extra.flair});return true;}
 if(!['feed-edit-post','feed-delete-post','feed-edit-comment','feed-delete-comment'].includes(op))return false;
 const postOp=op.endsWith('-post'),item=(postOp?d.feedPosts:d.feedReplies).find(x=>x.id===id);if(!item||item.author!==actor||item.deleted)throw Error('Only the author can change this content.');
 if(op==='feed-delete-comment'&&extra.confirmed===true)d.bestAnswers=d.bestAnswers.filter(a=>a.reply!==id);
 if(op.includes('-delete-')){if(extra.confirmed!==true)throw Error('Confirm deletion first.');item.text='[Deleted]';item.deleted=true;if(postOp){d.polls=d.polls.filter(p=>p.post!==id);d.pollVotes=d.pollVotes.filter(v=>v.post!==id);d.awards=d.awards.filter(a=>a.post!==id);d.bestAnswers=d.bestAnswers.filter(a=>a.post!==id);item.title='Deleted post';item.flair=null;item.topic=null;d.pins=d.pins.filter(x=>x.post!==id);d.votes=d.votes.filter(x=>x.post!==id);d.postSaves=d.postSaves.filter(x=>x.post!==id);}return true;}
 if(postOp&&item.kind==='repost')throw Error('A plain repost cannot be edited. Delete it or publish a quote.');
 if(!validText(extra.text,postOp?4000:2000)||postOp&&!validText(extra.title,180))throw Error('Add valid text within the displayed limits.');
 if(postOp){if(extra.flair!==null&&!FLAIRS.includes(extra.flair))throw Error('Choose a post flair.');item.title=extra.title.trim();item.flair=extra.flair;}
 item.text=extra.text.trim();item.editedAt=Math.max(time,item.at);return true;
}
export function profileItems(data,actor,tab){
 if(tab==='Saved')return data.posts.filter(p=>!p.deleted&&data.postSaves.some(s=>s.actor===actor&&s.post===p.id));
 if(tab==='Replies')return data.replies.filter(r=>r.author===actor&&!r.deleted).sort((a,b)=>b.at-a.at||b.id-a.id);
 return data.posts.filter(p=>!p.deleted&&(tab==='Upvoted'?data.votes.some(v=>v.actor===actor&&v.post===p.id):p.author===actor&&(tab==='Reposts'?p.kind==='repost':p.kind!=='repost')));
}
export function searchAll(data,profiles,query){
 const q=query.trim().toLocaleLowerCase().slice(0,120),match=s=>s.toLocaleLowerCase().includes(q),out={posts:[],people:[],circles:[],hashtags:[]};if(!q)return out;
 out.posts=data.posts.filter(p=>!p.deleted&&p.kind!=='repost'&&match(p.title+' '+p.text)).sort((a,b)=>b.at-a.at||b.id-a.id);
 out.people=profiles.filter(p=>match(p.displayName+' @'+p.actorId+' '+p.bio+' '+(p.schoolLabel||'')));
 out.circles=data.circles.filter(c=>match(c.title+' '+c.description));
 const tags=new Map();for(const p of data.posts.filter(p=>!p.deleted&&p.kind!=='repost'))for(const tag of hashtags(p.title+' '+p.text))if(tag.includes(q.replace(/^#/,'')))tags.set(tag,(tags.get(tag)||0)+1);
 out.hashtags=[...tags].map(([tag,count])=>({tag,count})).sort((a,b)=>b.count-a.count||a.tag.localeCompare(b.tag));return out;
}
export function suggestions(data,profiles,actor){
 const self=profiles.find(p=>p.actorId===actor),followed=new Set(data.follows.map(f=>f.to));
 const tags=id=>new Set(data.posts.filter(p=>p.author===id&&!p.deleted&&p.kind!=='repost').flatMap(p=>hashtags(p.title+' '+p.text)));
 const ownTags=tags(actor);return profiles.filter(p=>p.actorId!==actor&&!followed.has(p.actorId)).map(p=>{let score=0;const reasons=[];
 if(self?.universityId&&self.universityId===p.universityId){score+=4;reasons.push('Same university');if(self.campusId&&self.campusId===p.campusId){score+=6;reasons.push('Same campus');}}
 const circles=data.circles.filter(c=>c.members.includes(actor)&&c.members.includes(p.actorId)).length;if(circles){score+=3*circles;reasons.push(`${circles} shared circle${circles===1?'':'s'}`);}
 const shared=[...tags(p.actorId)].filter(t=>ownTags.has(t));if(shared.length){score+=Math.min(5,shared.length);reasons.push('Shared '+shared.slice(0,2).map(t=>'#'+t).join(', '));}
 return {...p,score,reasons:reasons.length?reasons:['Explore your campus community']};}).sort((a,b)=>b.score-a.score||a.displayName.localeCompare(b.displayName));
}

export function filterPeople(profiles,{query='',campus='',interest=''}={}){
 const q=query.trim().toLocaleLowerCase();return profiles.filter(p=>(!q||(p.displayName+' @'+p.actorId+' '+p.bio).toLocaleLowerCase().includes(q))&&(!campus||p.campusId===campus)&&(!interest||p.interestIds?.includes(interest)));
}
