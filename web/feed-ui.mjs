import {TOPICS} from './feed-core.mjs?v=1.6.0';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,action,cls='secondary')=>{const b=el('button',text,cls);b.type='button';b.onclick=action;return b;};
export function createFeedUI({accounts,repository,getActor,getCatalogues,requireAccount,announce}){
 let generation=0,tab='For you',topic='',uni='',campus='',author=null,opened=null,savedOnly=false;
 const leave=()=>{generation++;};
 const home=()=>{author=null;savedOnly=false;tab='For you';topic='';uni='';campus='';opened=null;};
 const profile=id=>{home();author=id;tab='Latest';};
 const saved=()=>{home();savedOnly=true;tab='Latest';};
 const deepLink=id=>{opened=id;author=null;savedOnly=false;topic='';uni='';campus='';tab='Latest';};
 async function render(host,mode='feed'){
  const stamp=++generation,actor=getActor();repository.reload();host.replaceChildren();
  const fail=el('p','','error');fail.setAttribute('role','alert');host.append(fail);
  let profiles;try{profiles=await accounts.profiles();}catch{fail.textContent='Student profiles could not load. Try reloading.';return;}if(stamp!==generation)return;
  const cat=getCatalogues(),name=id=>profiles.find(p=>p.actorId===id)?.displayName??({personal:'Student',naledi:'Naledi Demo',sipho:'Sipho Demo',ayesha:'Ayesha Demo'}[id]),person=id=>profiles.find(p=>p.actorId===id);
  const school=id=>{const p=person(id),u=cat.universities.find(u=>u.id===p?.universityId);return `${u?.label??'Campus community'}${p?.campusId?' · '+(u?.campuses.find(c=>c.id===p.campusId)?.label??''):''}`;};
  if(!repository.ready){fail.textContent=repository.error;host.append(button('Reload feed',()=>render(host,mode)));return;}
  const data=repository.feed(actor);
  const run=async(op,target,extra={},after)=>{if(!requireAccount())return;host.querySelectorAll('button').forEach(b=>b.disabled=true);try{await repository.change(actor,op,target,extra);if(stamp===generation){if(after)await after();else {await render(host,mode);announce('Demo activity saved in this browser.');}}}catch(e){if(stamp===generation){fail.textContent=e.message;host.querySelectorAll('button').forEach(b=>b.disabled=false);}}};
  const follow=id=>{const on=data.follows.some(f=>f.to===id);const b=button(on?'Following':'Follow',()=>run('feed-follow',id),'follow-button');b.setAttribute('aria-label',`${on?'Unfollow':'Follow'} ${name(id)}`);b.setAttribute('aria-pressed',String(on));return b;};
  const showProfile=id=>{profile(id);render(host);};
  if(mode==='directory'){
   host.append(el('h1','Your campus people.'),el('p','Explore public student profiles. Follow the people whose ideas you want to see in your feed.','muted'));const grid=el('div',undefined,'account-grid');
   for(const p of profiles.filter(p=>!actor||!repository.blocked(actor,p.actorId))){const card=el('article',undefined,'panel');card.append(el('div',name(p.actorId).slice(0,2),'avatar'),el('h2',name(p.actorId)),el('p',school(p.actorId),'muted'),el('p',p.bio),button('View posts',()=>showProfile(p.actorId)));if(p.actorId!==actor)card.append(follow(p.actorId));grid.append(card);}host.append(grid);return;
  }
  const layout=el('div',undefined,'feed-layout'),column=el('div',undefined,'feed-column'),aside=el('aside',undefined,'community-rail');layout.append(column,aside);host.append(layout);
  const community=el('section',undefined,'panel');community.append(el('p','A LITTLE COMMON GROUND','eyebrow'),el('h2','Your campus. Your people.'),el('p','Questions between lectures. Ideas after class. A place to feel part of something.','muted'),el('p','Fictional student community · Local demo','hint'));aside.append(community);
  const who=el('section',undefined,'panel');who.append(el('h2','Meet your community'));for(const p of profiles.filter(p=>p.actorId!==actor&&(!actor||!repository.blocked(actor,p.actorId)))){const row=el('div',undefined,'suggested-person');row.append(button(name(p.actorId),()=>showProfile(p.actorId),'text-button'),follow(p.actorId));who.append(row);}aside.append(who);
  aside.append(el('p','Browse freely. Choose a demo account to join the conversation. No real accounts or cross-device sharing yet.','hint'));
  if(author){const header=el('section',undefined,'panel public-profile');header.append(button('← Campus feed',()=>{home();render(host);},'text-button'),el('div',name(author).slice(0,2),'avatar'),el('h1',name(author)),el('p',school(author),'muted'),el('p',person(author)?.bio??''));if(author!==actor)header.append(follow(author));column.append(header);}
  else column.append(el('h1',savedOnly?'Your saved posts.':'Your campus, your conversation.','feed-title'));
  if(!savedOnly&&(!author||author===actor)){
   const composer=el('section',undefined,'panel feed-composer');composer.append(el('h2','What’s on your mind?'));
   if(!actor)composer.append(button('Ask a question, share a thought…',()=>requireAccount(),'composer-prompt'),el('p','Everyone can read. Choose a demo account to post.','hint'));
   else{const form=el('form'),title=el('input'),body=el('textarea'),select=el('select');title.placeholder='Give your post a title';title.setAttribute('aria-label','Post title');title.required=true;title.maxLength=180;body.placeholder='Ask a question, share a thought…';body.setAttribute('aria-label','Post text');body.required=true;body.maxLength=4000;select.setAttribute('aria-label','Post topic');const blank=el('option','No topic');blank.value='';select.append(blank);for(const t of TOPICS){const o=el('option',t);o.value=t;select.append(o);}const actions=el('div',undefined,'actions');const submit=el('button','Post');submit.type='submit';actions.append(select,submit);form.append(title,body,actions,el('p','Posts appear on your public profile and the campus feed. Use fictional details only.','hint'));form.onsubmit=e=>{e.preventDefault();tab='Latest';opened=null;run('feed-publish',null,{title:title.value,text:body.value,topic:select.value||null});};composer.append(form);}column.append(composer);
  }
  const tabs=el('div',undefined,'feed-tabs');for(const label of ['For you','Following','Latest']){const b=button(label,()=>{if(label==='Following'&&!requireAccount())return;tab=label;opened=null;render(host);},tab===label?'active-tab':'secondary');b.setAttribute('aria-pressed',String(tab===label));tabs.append(b);}tabs.append(button('↻ Refresh',()=>render(host),'text-button'));column.append(tabs);
  const filters=el('div',undefined,'feed-filters');
  const filter=(label,options,value,change)=>{const s=el('select');s.setAttribute('aria-label',label);const all=el('option',label);all.value='';s.append(all);for(const x of options){const o=el('option',x.label);o.value=x.id;s.append(o);}s.value=value;s.onchange=()=>{change(s.value);opened=null;render(host);};filters.append(s);};
  filter('All universities',cat.universities,uni,v=>{uni=v;campus='';});filter('All campuses',cat.universities.find(u=>u.id===uni)?.campuses??[],campus,v=>campus=v);filter('All topics',TOPICS.map(t=>({id:t,label:t})),topic,v=>topic=v);column.append(filters);
  const followed=new Set(data.follows.map(f=>f.to));let posts=data.posts.filter(p=>(!author||p.author===author)&&(!topic||p.topic===topic)&&(!uni||person(p.author)?.universityId===uni)&&(!campus||person(p.author)?.campusId===campus)&&(!savedOnly||data.postSaves.some(s=>s.post===p.id))&&(tab!=='Following'||followed.has(p.author)));
  posts.sort((a,b)=>tab==='For you'?(Number(followed.has(b.author))-Number(followed.has(a.author))||b.at-a.at||b.id-a.id):(b.at-a.at||b.id-a.id));
  column.append(el('p',`${posts.length} post${posts.length===1?'':'s'} · ${tab==='For you'?'People you follow first, then latest posts':'Latest first'}`,'hint'));
  if(!posts.length)column.append(el('div',tab==='Following'?'Your following feed starts here. Follow a student to see their posts.':'No posts match this view. Try another campus or topic.','panel'));
  const commentForm=(post,parent,label)=>{if(!actor)return button('Choose an account to comment',()=>requireAccount(),'text-button');const form=el('form',undefined,'comment-form'),input=el('textarea');input.setAttribute('aria-label',label);input.placeholder=label;input.required=true;input.maxLength=2000;const submit=el('button','Reply');submit.type='submit';form.append(input,submit);form.onsubmit=e=>{e.preventDefault();run('feed-comment',post,{parent,text:input.value});};return form;};
  for(const post of posts){const card=el('article',undefined,'feed-post panel');card.id=`post-${post.id}`;
   const head=el('div',undefined,'post-author'),meta=el('div');meta.append(button(name(post.author),()=>showProfile(post.author),'author-name'),el('p',school(post.author),'hint'),el('p',new Date(post.at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}),'hint'));head.append(el('div',name(post.author).slice(0,2),'avatar'),meta);if(post.author!==actor)head.append(follow(post.author));card.append(head,el('h2',post.title),el('p',post.text,'post-copy'));if(post.topic)card.append(el('span',post.topic,'tag'));
   const replies=data.replies.filter(r=>r.post===post.id),actions=el('div',undefined,'post-actions'),voted=data.votes.some(v=>v.actor===actor&&v.post===post.id),saved=data.postSaves.some(s=>s.post===post.id);
   const vote=button(`↑ ${data.votes.filter(v=>v.post===post.id).length}`,()=>run('feed-vote',post.id),'text-button');vote.setAttribute('aria-label',`${voted?'Remove upvote from':'Upvote'} post ${post.id}`);vote.setAttribute('aria-pressed',String(voted));
   const comments=button(`◯ ${replies.length} replies`,()=>{opened=opened===post.id?null:post.id;render(host);},'text-button');comments.setAttribute('aria-label',`Read replies to post ${post.id}`);comments.setAttribute('aria-expanded',String(opened===post.id));
   const bookmark=button(saved?'Saved':'Save',()=>run('feed-save',post.id),'text-button');bookmark.setAttribute('aria-label',`${saved?'Unsave':'Save'} post ${post.id}`);bookmark.setAttribute('aria-pressed',String(saved));
   const share=button('Share',()=>run('feed-share',post.id,{},async()=>{const url=new URL(location.href);url.hash=`post=${post.id}`;try{await navigator.clipboard.writeText(url.href);announce('Post link copied. Demo-created posts exist only in this browser.');}catch{fail.textContent=`Copy this link: ${url.href}. Demo-created posts exist only in this browser.`;}host.querySelectorAll('button').forEach(b=>b.disabled=false);}),'text-button');share.setAttribute('aria-label',`Share post ${post.id}`);actions.append(vote,comments,bookmark,share);card.append(actions);
   if(opened===post.id){const thread=el('section',undefined,'post-thread');thread.setAttribute('aria-label',`Replies to post ${post.id}`);thread.append(el('h3','Join the conversation'),commentForm(post.id,null,`Comment on post ${post.id}`));
    const add=(parent,container,depth)=>{for(const r of replies.filter(r=>r.parent===parent)){const item=el('article',undefined,'feed-comment');item.append(button(name(r.author),()=>showProfile(r.author),'author-name'),el('p',r.text,'post-copy'));const detail=el('details');detail.append(el('summary',`Reply to ${name(r.author)}`),commentForm(post.id,r.id,`Reply to comment ${r.id}`));item.append(detail);container.append(item);add(r.id,depth<4?item:container,depth+1);}};add(null,thread,0);card.append(thread);
   }column.append(card);
  }
  if(opened&&location.hash==='#post='+opened)host.querySelector('#post-'+opened)?.scrollIntoView({block:'start'});
  if(opened&&!posts.some(p=>p.id===opened))column.append(el('p','That post is unavailable in this view. Clear filters or return to Home.','notice'));
 }
 return {render,leave,home,profile,saved,deepLink};
}
