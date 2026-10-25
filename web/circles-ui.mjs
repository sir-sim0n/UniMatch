const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,action)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=action;return b;};
export function createCirclesUI({accounts,repository,announce}){
 let generation=0,selected=null,owner=null,pending=null;
 const leave=()=>{generation++;};
 async function render(host){
  const stamp=++generation,actor=accounts.active.account.id;if(owner!==actor){selected=null;owner=actor;}if(pending){selected=pending;pending=null;}
  repository.reload();host.replaceChildren(el('h1','Find your circle.'),el('p','Shared interests. Campus conversations. Join a fictional circle or start your own. All activity stays in this browser.','notice'));
  host.append(button('Reload saved circles',()=>render(host)));
  const error=el('p','','error');error.setAttribute('role','alert');host.append(error);if(!repository.ready){error.textContent=repository.error;return;}
  let profiles;try{profiles=await accounts.profiles();}catch{error.textContent='Could not load demo profiles.';return;}if(stamp!==generation)return;
  const name=id=>profiles.find(p=>p.actorId===id)?.displayName??accounts.entries.get(id)?.account.label??id;
  const mutate=async(op,target,extra={})=>{host.querySelectorAll('button').forEach(b=>b.disabled=true);try{await repository.change(actor,op,target,extra);if(stamp===generation){await render(host);announce('Circle updated in this browser.');}}catch(e){if(stamp===generation){error.textContent=e.message;host.querySelectorAll('button').forEach(b=>b.disabled=false);}}};
  const field=(label,max,tag='textarea')=>{const wrap=el('label',label,'field'),input=el(tag);input.required=true;input.maxLength=max;wrap.append(input);return {wrap,input};};
  const compose=(parent,label)=>{const form=el('form',undefined,'circle-compose'),f=field(label,2000);const submit=el('button',parent===null?'Publish demo post':'Publish demo reply');submit.type='submit';form.append(f.wrap,submit);form.onsubmit=e=>{e.preventDefault();mutate('circle-post',selected,{parent,text:f.input.value});};return form;};
  const create=el('details',undefined,'panel circle-create');create.append(el('summary','Start a circle'));const form=el('form'),title=field('Circle name (up to 60 characters)',60,'input'),description=field('Circle description (up to 240 characters)',240);const submit=el('button','Create demo circle');submit.type='submit';form.append(title.wrap,description.wrap,el('p','You become the organiser. Organisers can hide or restore posts and stay members of their circle in this demo.','hint'),submit);form.onsubmit=e=>{e.preventDefault();mutate('circle-create',null,{title:title.input.value,description:description.input.value});};create.append(form);host.append(create);
  const circles=repository.circles(actor),grid=el('div',undefined,'account-grid');host.append(grid);
  for(const c of circles){const card=el('article',undefined,'panel');card.append(el('h2',c.title),el('p',c.description),el('p',`${c.members.length} member${c.members.length===1?'':'s'} · Organiser: ${name(c.owner)}`,'muted'),el('p',c.organiser?'You organise this circle':c.joined?'You are a member':'Open to all demo students'));
   const actions=el('div',undefined,'actions');actions.append(button(`Open ${c.title}`,async()=>{selected=c.id;await render(host);const feed=host.querySelector('.circle-feed');feed?.focus();feed?.scrollIntoView({block:'start'});}));if(!c.joined)actions.append(button(`Join ${c.title}`,()=>{selected=c.id;mutate('circle-join',c.id);}));else if(!c.organiser)actions.append(button(`Leave ${c.title}`,()=>mutate('circle-leave',c.id)));card.append(actions);grid.append(card);}
  const c=circles.find(c=>c.id===selected);if(!c)return;
  const section=el('section',undefined,'panel circle-feed');section.tabIndex=-1;section.setAttribute('aria-label',`${c.title} posts`);section.append(el('h2',c.title));host.append(section);
  if(!c.joined){section.append(el('p','Join this circle to read posts and take part.'));return;}
  section.append(el('p','Use fictional details only. Leaving a circle keeps your posts. Drafts are discarded when you leave this screen, switch accounts or reload.','hint'));
  if(c.organiser)section.append(el('p','Demo organiser tools: hide or restore posts and replies. Hidden posts and their replies disappear for other members. No real moderator is notified.','notice'));
  section.append(compose(null,'New post (up to 2,000 characters)'));
  const roots=c.posts.filter(x=>x.parent===null);if(!roots.length)section.append(el('p','No posts yet. Start the conversation!'));
  const postNode=(x,reply=false)=>{const article=el('article',undefined,reply?'circle-reply':'circle-post');article.append(el('h3',`${name(x.author)}${x.hidden?' · Hidden by organiser':''}`),el('p',x.text,'post-text'),el('small',new Date(x.at).toLocaleString()));if(c.organiser)article.append(button(`${x.hidden?'Restore':'Hide'} ${reply?'reply':'post'} ${x.id}`,()=>mutate(x.hidden?'circle-restore':'circle-hide',c.id,{post:x.id})));return article;};
  for(const x of roots){const article=postNode(x);for(const reply of c.posts.filter(r=>r.parent===x.id))article.append(postNode(reply,true));if(!x.hidden){const details=el('details');details.append(el('summary',`Reply to post ${x.id}`),compose(x.id,`Reply to post ${x.id} (up to 2,000 characters)`));article.append(details);}section.append(article);}
 }
 return {render,leave,select:id=>{pending=id;}};
}
