import {AWARDS,DURATIONS} from './community-core.mjs?v=1.14.0';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(label,click)=>{const b=el('button',label,'secondary');b.type='button';b.onclick=click;return b;};
const input=(label,max,multi=false)=>{const wrap=el('label',label,'field'),node=el(multi?'textarea':'input');node.maxLength=max;wrap.append(node);return {wrap,node};};
export function pollComposer(form){const details=el('details',undefined,'community-options');details.append(el('summary','Add a poll (optional)'));const rows=[];for(let i=0;i<4;i++){const x=input(`Poll option ${i+1}${i>1?' (optional)':''}`,100);rows.push(x.node);details.append(x.wrap);}const label=el('label','Poll closes after','field'),duration=el('select');DURATIONS.forEach((v,i)=>{const o=el('option',['1 hour','1 day','1 week'][i]);o.value=v;duration.append(o);});duration.value=DURATIONS[1];label.append(duration);details.append(label);form.append(details);return ()=>{const options=rows.map(x=>x.value.trim()).filter(Boolean);return options.length?{options,duration:Number(duration.value)}:null;};}
export function postCommunity({card,post,data,actor,run,requireAccount,name,openPost,repository,cleanup}){

 const panel=el('section',undefined,'community-tools');panel.setAttribute('aria-label',`Community features for post ${post.id}`);
 const previous=post.previous?data.posts.find(p=>p.id===post.previous):null,next=data.posts.find(p=>p.previous===post.id);
 if(previous||next){const nav=el('div',undefined,'actions');nav.append(el('strong','Author thread'));if(previous)nav.append(button(previous.deleted?'Previous post (deleted)':'← Previous post',()=>openPost(previous.id)));if(next)nav.append(button(next.deleted?'Next post (deleted)':'Next post →',()=>openPost(next.id)));panel.append(nav);}
 if(post.deleted){card.append(panel);return;}
 const poll=data.polls.find(p=>p.post===post.id);
 if(poll){const area=el('section',undefined,'poll'),total=poll.counts.reduce((a,b)=>a+b,0),status=el('p','','hint'),choices=[];area.append(el('h3','Campus poll'),status);
 const close=()=>{const closed=Date.now()>=poll.closesAt;status.textContent=`${closed?'Poll closed':'Closes '+new Date(poll.closesAt).toLocaleString()} · ${total} vote${total===1?'':'s'}${poll.choice!==null?' · You voted':''}`;for(const b of choices)b.disabled=closed||poll.choice!==null;};
 poll.options.forEach((label,i)=>{const row=el('div',undefined,'poll-option'),b=button(label,()=>{if(requireAccount())run('feed-poll-vote',post.id,{option:i});}),meter=el('progress');meter.max=Math.max(total,1);meter.value=poll.counts[i];meter.setAttribute('aria-label',`${label}: ${poll.counts[i]} votes`);row.append(b,meter,el('span',`${poll.counts[i]} (${total?Math.round(poll.counts[i]*100/total):0}%)`,'hint'));if(poll.choice===i)row.append(el('span','Your choice','tag'));choices.push(b);area.append(row);});close();if(Date.now()<poll.closesAt){const timer=setTimeout(close,poll.closesAt-Date.now()+20);cleanup.push(()=>clearTimeout(timer));}panel.append(area);}
 const badges=data.awards.filter(a=>a.post===post.id);if(badges.length){const group=el('div',undefined,'tags');for(const kind of AWARDS){const n=badges.filter(x=>x.kind===kind).length;if(n)group.append(el('span',`${kind} · ${n}`,'tag'));}panel.append(group);}
 if(actor===post.author&&post.kind!=='repost'&&!next){const options=el('details');options.append(el('summary','Continue your thread'));const form=el('form'),title=input('Next post title',180),body=input('Continue your thread',4000,true),submit=el('button','Publish next post');title.node.required=true;body.node.required=true;submit.type='submit';form.append(title.wrap,body.wrap,submit);form.onsubmit=e=>{e.preventDefault();run('feed-thread',post.id,{title:title.node.value,text:body.node.value});};options.append(form);panel.append(options);}
 if(panel.childElementCount)card.append(panel);
}
export function bestAnswerUI({item,reply,post,data,actor,run}){if(reply.deleted||post.deleted)return;const selected=data.bestAnswers.some(a=>a.post===post.id&&a.reply===reply.id);if(selected)item.append(el('p','✓ Best answer · +5 karma','best-answer'));if(actor===post.author&&actor!==reply.author&&(post.topic==='Questions'||post.flair==='Question'))item.append(button(selected?'Remove best answer':`Mark comment ${reply.id} as best answer`,()=>run('feed-best-answer',post.id,{reply:selected?null:reply.id})));}

export function awardButton({post,data,actor,requireAccount,repository,refresh}){
 const current=data.awards.find(a=>a.post===post.id&&a.actor===actor);
 const trigger=button(current?'Change award':'Give an award',()=>{
  if(!requireAccount())return;
  const dialog=el('dialog'),form=el('form'),select=el('select'),error=el('p','','error'),save=el('button','Save award');
  dialog.setAttribute('aria-label',`Award post ${post.id}`);select.setAttribute('aria-label','Give an award');error.setAttribute('role','alert');
  for(const kind of ['',...AWARDS]){const o=el('option',kind||'No award');o.value=kind;select.append(o);}select.value=current?.kind??'';save.type='submit';
  form.append(el('h2','Give an award'),el('p','One award per student per post. Each award gives the author 2 karma.'),select,error,save,button('Cancel',()=>dialog.close()));
  form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await repository.change(actor,'feed-award',post.id,{kind:select.value||null});dialog.close();await refresh();}catch(e){error.textContent=e.message;save.disabled=false;}};
  dialog.append(form);dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
 });trigger.classList.add('award-button');trigger.setAttribute('aria-label',`${current?'Change award for':'Give an award to'} post ${post.id}`);return trigger;
}
