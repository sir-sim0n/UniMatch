import { ACTORS } from './demo-social.mjs?v=1.9.0';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,action)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=action;return b;};
export function createMessagesUI({accounts,repository,announce}){
  let generation=0,selected=null,owner=null;
  function leave(){generation++;}
  function select(id){selected=id;owner=accounts.active.account.id;}
  async function render(host){
    const stamp=++generation,actor=accounts.active.account.id;
    if(owner!==actor){selected=null;owner=actor;}
    repository.reload();
    host.replaceChildren(el('h1','Your campus conversations.'),el('p','Local demo messages only. Switch accounts to reply. Nothing is sent to real people or another device.','notice'));
    host.append(button('Reload saved messages',()=>render(host)));
    const error=el('p','','error');error.setAttribute('role','alert');host.append(error);
    if(!repository.ready){error.textContent=repository.error;return;}
    let profiles;try{profiles=await accounts.profiles();}catch{error.textContent='Demo profiles could not be loaded.';return;}
    if(stamp!==generation)return;
    const name=id=>profiles.find(p=>p.actorId===id)?.displayName??accounts.entries.get(id)?.account.label??id;
    const peers=ACTORS.filter(id=>id!==actor&&!repository.blocked(actor,id)&&(repository.relation(actor,id)==='accepted'||repository.conversation(actor,id).length));
    if(!peers.includes(selected))selected=null;
    const list=el('div',undefined,'actions');host.append(list);
    for(const id of peers){const n=repository.unread(actor,id);const b=button(`${name(id)}${n?` · ${n} unread`:''}`,()=>{selected=id;render(host);});b.setAttribute('aria-pressed',String(id===selected));list.append(b);}
    if(!peers.length){host.append(el('p','No conversations yet. Accept a connection in Connections, then come back to send your first message.','panel'));return;}
    if(!selected){host.append(el('p','Choose a connection to open your conversation.'));return;}
    const target=selected,connected=repository.relation(actor,target)==='accepted';
    if(connected&&repository.unread(actor,target)){
      try{await repository.change(actor,'read',target);}catch(e){if(stamp===generation)error.textContent=e.message;return;}
      if(stamp!==generation)return;
      return render(host);
    }
    const panel=el('section',undefined,'panel conversation');panel.setAttribute('aria-label',`Conversation with ${name(target)}`);panel.append(el('h2',name(target)));
    const history=el('ol',undefined,'message-history');history.setAttribute('aria-label','Message history');
    const messages=repository.conversation(actor,target);
    if(!messages.length)panel.append(el('p','Say hello and find some common ground.','muted'));
    for(const m of messages){const item=el('li',undefined,m.from===actor?'message outgoing':'message');item.append(el('strong',m.from===actor?'You':name(m.from)),el('p',m.text),el('small',`${new Date(m.at).toLocaleString()} · ${m.from===actor?(m.read?'Read in demo':'Saved locally'):'Received in demo'}`));history.append(item);}
    panel.append(history);host.append(panel);
    if(!connected){panel.append(el('p','This connection has ended. Conversation history is read-only. Reconnect before sending new messages.','notice'));return;}
    const form=el('form'),label=el('label','Message (up to 2,000 characters)','field'),input=el('textarea');input.maxLength=2000;input.required=true;label.append(input);
    const submit=el('button','Send demo message');submit.type='submit';form.append(label,submit,el('p','Use fictional details only. Unsaved drafts are discarded when you switch accounts or leave this screen.','hint'));panel.append(form);
    form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;error.textContent='';try{await repository.change(actor,'send',target,{text:input.value});if(stamp===generation){await render(host);announce('Demo message saved locally. Switch accounts to reply.');}}catch(e){if(stamp===generation){error.textContent=e.message;submit.disabled=false;}}};
  }
  return {render,leave,select};
}
