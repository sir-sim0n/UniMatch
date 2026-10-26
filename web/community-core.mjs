import {isBlocked,changeFeed,visibleFeed} from './feed-core.mjs?v=1.11.0';
import {readablePost} from './engagement-core.mjs?v=1.11.0';
export const AWARDS=['Helpful','Insightful','Campus spirit'];
export const DURATIONS=[3600000,86400000,604800000];
export const seedCommunity=()=>({polls:[],pollVotes:[],bestAnswers:[],awards:[]});
const text=(x,n)=>typeof x==='string'&&!!x.trim()&&[...x].length<=n;
export function validateCommunity(d,actors){
 for(const key of ['polls','pollVotes','bestAnswers','awards'])if(!Array.isArray(d[key]))throw Error('Invalid community data.');
 const ids=new Set(),votes=new Set(),answers=new Set(),awards=new Set();
 for(const p of d.polls){const post=d.feedPosts.find(x=>x.id===p.post);if(!post||ids.has(p.post)||!Array.isArray(p.options)||p.options.length<2||p.options.length>4||p.options.some(x=>!text(x,100))||new Set(p.options.map(x=>x.toLowerCase())).size!==p.options.length||!DURATIONS.includes(p.closesAt-post.at))throw Error('Invalid poll.');ids.add(p.post);}
 for(const v of d.pollVotes){const p=d.polls.find(x=>x.post===v.post),key=v.actor+':'+v.post;if(!p||!actors.includes(v.actor)||votes.has(key)||!Number.isInteger(v.option)||v.option<0||v.option>=p.options.length||!Number.isFinite(v.at)||v.at>=p.closesAt||v.at<d.feedPosts.find(x=>x.id===v.post).at)throw Error('Invalid poll vote.');votes.add(key);}
 for(const a of d.bestAnswers){const p=d.feedPosts.find(x=>x.id===a.post),reply=d.feedReplies.find(x=>x.id===a.reply);if(!p||!reply||reply.post!==p.id||reply.author===p.author||answers.has(p.id))throw Error('Invalid best answer.');answers.add(p.id);}
 for(const a of d.awards){const p=d.feedPosts.find(x=>x.id===a.post),key=a.actor+':'+a.post;if(!p||a.actor===p.author||!actors.includes(a.actor)||!AWARDS.includes(a.kind)||awards.has(key))throw Error('Invalid award.');awards.add(key);}
 const children=new Set();for(const p of d.feedPosts)if(p.previous!=null){const prev=d.feedPosts.find(x=>x.id===p.previous);if(!prev||prev.id>=p.id||prev.author!==p.author||children.has(prev.id)||p.kind==='repost'||prev.kind==='repost')throw Error('Invalid post thread.');children.add(prev.id);}
}
export function attachPoll(d,p,extra){if(!extra.poll)return;const {options,duration}=extra.poll;if(!Array.isArray(options)||options.length<2||options.length>4||options.some(x=>!text(x,100))||new Set(options.map(x=>x.trim().toLowerCase())).size!==options.length||!DURATIONS.includes(duration))throw Error('Choose 2–4 different poll options and a valid time limit.');d.polls.push({post:p.id,options:options.map(x=>x.trim()),closesAt:p.at+duration});}
export function changeCommunity(d,actor,op,id,extra,time){
 if(!['feed-poll-vote','feed-best-answer','feed-award','feed-thread'].includes(op))return false;
 const p=d.feedPosts.find(x=>x.id===id);if(!p||p.deleted||!readablePost(d,actor,id))throw Error('This post is unavailable.');
 if(op==='feed-poll-vote'){const poll=d.polls.find(x=>x.post===id);if(!poll||time>=poll.closesAt)throw Error('This poll has closed.');if(!Number.isInteger(extra.option)||extra.option<0||extra.option>=poll.options.length)throw Error('Choose an option.');if(d.pollVotes.some(x=>x.actor===actor&&x.post===id))throw Error('You have already voted.');d.pollVotes.push({post:id,actor,option:extra.option,at:time});}
 if(op==='feed-best-answer'){if(actor!==p.author||!(p.topic==='Questions'||p.flair==='Question'))throw Error('Only the question author can mark a best answer.');if(extra.reply!==null){const reply=visibleFeed(d,actor).replies.find(x=>x.id===extra.reply&&x.post===id&&!x.deleted);if(!reply||reply.author===actor||isBlocked(d,actor,reply.author))throw Error('Choose an available answer from another student.');}d.bestAnswers=d.bestAnswers.filter(x=>x.post!==id);if(extra.reply!==null)d.bestAnswers.push({post:id,reply:extra.reply});}
 if(op==='feed-award'){if(actor===p.author)throw Error('You cannot award your own post.');if(extra.kind!==null&&!AWARDS.includes(extra.kind))throw Error('Choose an award.');d.awards=d.awards.filter(x=>!(x.post===id&&x.actor===actor));if(extra.kind)d.awards.push({post:id,actor,kind:extra.kind});}
 if(op==='feed-thread'){if(actor!==p.author||p.kind==='repost')throw Error('Only the author can continue this thread.');if(d.feedPosts.some(x=>x.previous===id))throw Error('Continue from the last post in this thread.');changeFeed(d,actor,'feed-publish',null,{title:extra.title,text:extra.text,topic:p.topic},time);d.feedPosts.at(-1).previous=id;}
 return true;
}
export function communityView(d,actor,ids,replies){
 const polls=d.polls.filter(p=>ids.has(p.post)&&!d.feedPosts.find(x=>x.id===p.post).deleted).map(p=>({...p,counts:p.options.map((_,i)=>d.pollVotes.filter(v=>v.post===p.post&&v.option===i).length),choice:d.pollVotes.find(v=>v.post===p.post&&v.actor===actor)?.option??null}));
 return structuredClone({polls,awards:d.awards.filter(a=>ids.has(a.post)&&!isBlocked(d,actor,a.actor)),bestAnswers:d.bestAnswers.filter(a=>ids.has(a.post)&&replies.some(r=>r.id===a.reply&&!r.deleted))});
}
