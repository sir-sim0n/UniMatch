import {inboxRows} from './discussion-core.mjs?v=1.15.0';
import {chatRow} from './discussion-ui.mjs?v=1.15.0';
import {renderGames} from './games-ui.mjs?v=1.15.0';
import { ACTORS } from './demo-social.mjs?v=1.15.0';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,action)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=action;return b;};
export function createMessagesUI({accounts,repository,announce}){
  let generation=0,selected=null,owner=null,messageLimit=40;
  const cleanup=[];const clear=()=>{while(cleanup.length)cleanup.pop()();};
  function leave(){generation++;clear();}
  function select(id){selected=id;owner=accounts.active.account.id;}
  async function render(host){
    clear();const stamp=++generation,actor=accounts.active.account.id;
    if(owner!==actor){selected=null;owner=actor;}
    await repository.reload();if(stamp!==generation)return;
    host.replaceChildren(el('h1','Your campus conversations.'),el('p','Local demo messages only. Switch accounts to reply. Nothing is sent to real people or another device.','notice'));
    host.append(button('Reload saved messages',()=>render(host)));
    const error=el('p','','error');error.setAttribute('role','alert');host.append(error);
    if(!repository.ready){error.textContent=repository.error;return;}
    let profiles;try{profiles=await accounts.profiles();}catch{error.textContent='Demo profiles could not be loaded.';return;}
    if(stamp!==generation)return;
    const name=id=>profiles.find(p=>p.actorId===id)?.displayName??accounts.entries.get(id)?.account.label??id;
    const peers=ACTORS.filter(id=>id!==actor&&!repository.blocked(actor,id)&&(repository.relation(actor,id)==='accepted'||repository.conversation(actor,id).length||repository.games(actor,id).length));
    if(!peers.includes(selected))selected=null;
    const layout=el('div',undefined,'chat-layout'),inbox=el('section',undefined,'panel chat-inbox'),list=el('ul',undefined,'chat-list');inbox.append(el('h2','Messages'),list);layout.append(inbox);host.append(layout);if(selected)layout.classList.add('has-conversation');
    const rows=inboxRows(repository,actor,peers.filter(id=>repository.conversation(actor,id).length||repository.games(actor,id).length),name);for(const row of rows)list.append(chatRow(row,id=>{selected=id;messageLimit=40;render(host);},row.id===selected));if(!rows.length)list.append(el('li','No messages yet.','hint'));
    const create=el('details');create.append(el('summary','New conversation'));for(const id of peers.filter(id=>repository.relation(actor,id)==='accepted'))create.append(button(name(id),()=>{selected=id;messageLimit=40;render(host);}));inbox.append(create);if(!peers.length){host.append(el('p','Connect with a student in Discover to start a conversation.','panel'));return;}if(!selected){const empty=el('section',undefined,'panel chat-empty chat-conversation');empty.append(el('h2','Your conversations'),el('p','Choose a chat, or start a new conversation.'));layout.append(empty);return;}
    const target=selected,connected=repository.relation(actor,target)==='accepted';
    if(connected&&repository.unread(actor,target)){
      try{await repository.change(actor,'read',target);}catch(e){if(stamp===generation)error.textContent=e.message;return;}
      if(stamp!==generation)return;
      return render(host);
    }
    const panel=el('section',undefined,'panel conversation chat-conversation');panel.setAttribute('aria-label',`Conversation with ${name(target)}`);panel.append(button('← Conversations',()=>{selected=null;render(host);}),el('h2',name(target)));
    const history=el('ol',undefined,'message-history');history.setAttribute('aria-label','Message history');
    const messages=repository.conversation(actor,target);
    if(!messages.length)panel.append(el('p','Say hello and find some common ground.','muted'));
    if(messages.length>messageLimit)panel.append(button('Load older messages',()=>{messageLimit+=40;render(host);}));
    for(const m of messages.slice(-messageLimit)){const item=el('li',undefined,m.from===actor?'message outgoing':'message');item.append(el('strong',m.from===actor?'You':name(m.from)),el('p',m.text),el('small',`${new Date(m.at).toLocaleString()} · ${m.from===actor?(m.read?'Read in demo':'Saved locally'):'Received in demo'}`));history.append(item);}
    panel.append(history);layout.append(panel);
    renderGames({panel,repository,actor,target,name,connected,refresh:()=>stamp===generation?render(host):undefined,announce,cleanup});
    if(!connected){panel.append(el('p','This connection has ended. Conversation history is read-only. Reconnect before sending new messages.','notice'));return;}
    const form=el('form'),label=el('label','Message (up to 2,000 characters)','field'),input=el('textarea');input.maxLength=2000;input.required=true;label.append(input);
    const submit=el('button','Send demo message');submit.type='submit';form.append(label,submit,el('p','Use fictional details only. Unsaved drafts are discarded when you switch accounts or leave this screen.','hint'));panel.append(form);
    form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;error.textContent='';try{await repository.change(actor,'send',target,{text:input.value});if(stamp===generation){await render(host);announce('Demo message saved locally. Switch accounts to reply.');}}catch(e){if(stamp===generation){error.textContent=e.message;submit.disabled=false;}}};
  }
  return {render,leave,select};
}
