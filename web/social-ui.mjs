import { DemoSocial, SOCIAL_KEY, REASONS } from './demo-social.mjs?v=1.7.0';

const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
export function createSocialUI({accounts, getCatalogues, announce, repository, openMessages}) {

  let generation=0;
  function leave(){generation++;}
  async function render(host){
    repository.reload();
    const stamp=++generation,actor=accounts.active.account.id;
    host.replaceChildren(node('h1','Your campus connections.'),node('p','Send an invitation, then switch demo accounts to accept it. Everything stays in this browser. No real people are contacted.','muted'));
    const status=node('p','','error');status.setAttribute('role','alert');host.append(status);
    const controls=node('div',undefined,'actions');host.append(controls);
    const button=(label,action,cls='secondary')=>{const b=node('button',label,cls);b.type='button';b.onclick=action;return b;};
    controls.append(button('Reload saved connections',()=>{repository.reload();render(host);}),button('Reset shared social demo',()=>{
      const dialog=node('dialog');dialog.setAttribute('aria-label','Reset shared social demo');
      dialog.append(node('h2','Reset connections for every demo account?'),node('p','This removes all local requests, connections, blocks, reports, messages, circles, public posts, comments, follows and votes. Profiles and bookmarks remain unchanged.'));
      dialog.append(button('Keep social demo',()=>dialog.close()),button('Reset social data',async()=>{try{await repository.resetAll(true);dialog.close();render(host);announce('Shared social demo reset.');}catch(e){status.textContent=e.message;dialog.close();}}));
      dialog.onclose=()=>dialog.remove();host.append(dialog);dialog.showModal();
    }));
    if(!repository.ready){status.textContent=repository.error;return;}
    const loading=node('p','Loading demo students…');host.append(loading);
    let profiles;
    try{profiles=await accounts.profiles();}catch{loading.remove();status.textContent='Demo profiles could not be loaded. Try reloading the page.';return;}
    if(stamp!==generation||accounts.active.account.id!==actor)return;
    loading.remove();
    const cat=getCatalogues();
    const name=id=>profiles.find(p=>p.actorId===id)?.displayName??accounts.entries.get(id)?.account.label??id;
    const mutate=async(op,target,extra={})=>{
      host.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await repository.change(actor,op,target,extra);if(stamp===generation){await render(host);announce(op==='report'?'Demo report recorded locally. It was not sent to a moderator.':'Demo connections updated.');}}
      catch(e){if(stamp===generation){status.textContent=e.message;host.querySelectorAll('button').forEach(b=>b.disabled=false);status.focus();}}
    };
    status.tabIndex=-1;
    const report=(target)=>{
      const dialog=node('dialog');dialog.setAttribute('aria-label',`Report ${name(target)}`);
      const form=node('form');form.append(node('h2',`Report ${name(target)}`),node('p','Simulation only: this records a report on this device. No moderator or university receives it. Use fictional details only.'));
      const reasonLabel=node('label','Reason','field'),reason=node('select');for(const text of REASONS){const o=node('option',text);o.value=text;reason.append(o);}reasonLabel.append(reason);
      const detailLabel=node('label','Details (optional, up to 1,000 characters)','field'),details=node('textarea');details.maxLength=1000;detailLabel.append(details);
      form.append(reasonLabel,detailLabel,button('Cancel report',()=>dialog.close()));const submit=node('button','Record demo report');submit.type='submit';form.append(submit);
      form.onsubmit=event=>{event.preventDefault();dialog.close();mutate('report',target,{reason:reason.value,details:details.value});};
      dialog.append(form);dialog.onclose=()=>dialog.remove();host.append(dialog);dialog.showModal();
    };
    const data=repository.view(actor);
    const incoming=data.requests.filter(q=>q.to===actor&&q.status==='pending');
    const accepted=data.requests.filter(q=>q.status==='accepted');
    host.append(node('p',`${incoming.length} incoming request${incoming.length===1?"":"s"} · ${accepted.length} connection${accepted.length===1?"":"s"}`,'results-summary'));
    const grid=node('div',undefined,'account-grid');
    for(const p of profiles){
      if(p.actorId===actor||repository.blocked(actor,p.actorId))continue;
      const target=p.actorId,rel=repository.relation(actor,target),card=node('article',undefined,'panel');
      const uni=cat.universities.find(u=>u.id===p.universityId),campus=uni?.campuses.find(c=>c.id===p.campusId)?.label??'';
      card.append(node('h2',p.displayName),node('p',`${uni?.label??''} · ${campus}`,'academic'),node('p',p.bio),node('p',p.interestIds.map(id=>cat.interests.find(i=>i.id===id)?.label).filter(Boolean).join(' · '),'muted'));
      const shared=p.interestIds.filter(id=>accounts.active.client.call('getState').visitor?.interestIds.includes(id));
      card.append(node('p',`${shared.length} shared interests · ${rel==='incoming'?'Wants to connect':rel==='outgoing'?'Request sent':rel==='accepted'?'Connected':'Not connected'}`));
      const actions=node('div',undefined,'actions');
      const action=(label,op)=>{const b=button(label,()=>mutate(op,target));b.setAttribute('aria-label',`${label}: ${p.displayName}`);actions.append(b);};
      if(rel==='incoming'){action('Accept','accept');action('Decline','decline');}
      else if(rel==='outgoing')action('Cancel request','cancel');
      else if(rel==='accepted'){actions.append(button(`Message ${p.displayName}`,()=>openMessages(target)));action('Remove connection','remove');}
      else action('Connect','request');
      action('Block','block');actions.append(button(`Report ${p.displayName}`,()=>report(target)));card.append(actions);grid.append(card);
    }
    if(!grid.children.length)grid.append(node('p','No other available demo accounts. Create another persona profile or check your blocked list.'));
    host.append(grid,node('p','These are the switchable demo accounts. The 45 sample catalogue profiles in Discover are separate examples; they cannot accept requests. Cross-campus connections are enabled for this local test.','notice'));
    const safety=node('section',undefined,'panel social-safety');safety.append(node('h2','Your blocks and reports'));
    if(!data.blocks.length)safety.append(node('p','You have not blocked any demo accounts.'));
    for(const b of data.blocks){const row=node('div',undefined,'actions');row.append(node('p',`Blocked: ${name(b.to)}`),button(`Unblock ${name(b.to)}`,()=>mutate('unblock',b.to)));safety.append(row);}
    safety.append(node('p','Unblocking does not restore old requests or connections. Other accounts’ private block/report lists are not shown in this account view.'));
    if(!data.reports.length)safety.append(node('p','No reports recorded by this account.'));
    for(const q of data.reports){const row=node('article');row.append(node('h3',`${q.reason} · ${name(q.to)}`),node('p',q.details||'No additional details.'),node('p','Recorded locally · Not sent for moderation','hint'));safety.append(row);}
    host.append(safety);
  }
  return {render,leave,key:SOCIAL_KEY};
}
