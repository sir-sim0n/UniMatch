import {icon} from './ui-icons.mjs?v=1.11.0';
// Profile/catalogue decisions use the C++ API; demo social rules use the local repository adapter.
const main = document.querySelector('#main');
const nav = document.querySelector('#navigation');
const announcement = document.querySelector('#announcement');
const menuToggle=document.querySelector('#menu-toggle');menuToggle.prepend(icon('menu'));menuToggle.onclick=()=>{const open=document.querySelector('.sidebar').classList.toggle('mobile-nav-open');menuToggle.setAttribute('aria-expanded',String(open));};
const resetDialog = document.querySelector('#reset-dialog');
let feedUI, guestClient, guest=true, socialUI, messagesUI, circlesUI, socialRepository, accounts, client, persistence, catalogues, state, screen = 'welcome', detailOrigin = 'discover';
let activeProfileId;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function button(text, action, className = '') {
  const node = el('button', text, className); node.type = 'button';
  node.addEventListener('click', action); return node;
}
function say(message) { announcement.textContent = message; }
function readState() { state = client.call('getState'); }
function saveState() { readState(); persistence.save(); }
function storageStatus(kind) {
  const box = document.querySelector('#storage-status');
  box.replaceChildren();
  const messages = {
    ready: 'Ready to save your fictional demo in this browser.',
    restored: 'Your demo profile, preferences, and bookmarks have been restored.',
    saved: 'Demo saved in this browser.',
    reset: 'Demo reset. Its saved data has been removed from this browser.',
    invalid: 'The saved demo could not be restored. It may be damaged, use an unsupported version, or refer to profiles that are no longer available. It has not been changed.',
    read_failed: 'Browser storage could not be read. You can use the demo in memory; changes will not survive a refresh. Reload to try restoring again.',
    write_failed: 'Your changes are working in this page, but could not be saved. They may be lost when you refresh or close the page.',
    reset_failed: 'This page has been reset, but the browser could not remove the saved demo. The old demo may return on refresh. Continue here without saving, or try removing it again.',
    memory: 'You are using a temporary demo. Existing saved data has been left untouched; changes on this page will not be saved.',
    conflict: 'Another tab changed the saved demo. Saving from this page is paused to avoid overwriting it. Reload to restore that version; unsaved changes on this page will be lost.'
  };
  box.dataset.warning = String(['invalid','read_failed','write_failed','reset_failed','memory','conflict'].includes(kind));
  box.append(el('p', messages[kind]));
  if (kind === 'write_failed') box.append(button('Retry saving', () => persistence.save(), 'secondary'));
  if (kind === 'read_failed' || kind === 'conflict') box.append(button('Reload saved demo', () => window.location.reload(), 'secondary'));
  if (kind === 'reset_failed') box.append(button('Retry removing saved demo', () => resetDialog.showModal(), 'secondary'));
}
function label(group, id) { return group.find(item => item.id === id)?.label ?? ''; }
function university(id) { return catalogues.universities.find(item => item.id === id); }
function campusLabel(p) { return label(university(p.universityId)?.campuses ?? [], p.campusId); }
function initials(name) { return [...name].slice(0, 2).join('').toLocaleUpperCase(); }
function heading(title, description) {
  const header = el('div', undefined, 'page-heading'); const copy = el('div');
  copy.append(el('p', 'YOUR FICTIONAL CAMPUS CIRCLE', 'eyebrow'), el('h1', title), el('p', description, 'muted'));
  header.append(copy); return header;
}
function requireAccount(){
  if(!guest&&state?.visitor)return true;
  const dialog=el('dialog');dialog.setAttribute('aria-label','Join the conversation');dialog.append(el('h2','Make yourself part of the conversation.'),el('p','You can keep browsing freely. Choose a demo account to post, follow, upvote, save, share or comment. Real sign-up is not available in this demo.'));
  dialog.append(button('Choose a demo account',()=>{dialog.close();navigate('accounts');}),button('Keep browsing',()=>dialog.close(),'secondary'));dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();return false;
}
function navigate(next, focus = true) {
  if(['notifications','connections','messages','saved','profile','edit-profile','detail'].includes(next)&&!requireAccount())return;
  if(next==='welcome')next='home';
  document.querySelector('.sidebar').classList.remove('mobile-nav-open');document.querySelector('#menu-toggle').setAttribute('aria-expanded','false');
  socialUI?.leave(); messagesUI?.leave(); circlesUI?.leave(); feedUI?.leave(); screen = next; main.replaceChildren(); renderNavigation();
  if (next === 'home') feedUI.render(main);
  else if(next==='create'){feedUI.home();feedUI.render(main,'create');}
  else if(next==='popular'){feedUI.popular();feedUI.render(main,'popular');}
  else if(next==='search')feedUI.render(main,'search');
  else if(next==='public-profile')feedUI.render(main);
  else if(next==='new-profile')profileForm();
  else if (next === 'accounts') accountScreen();
  else if (next === 'connections') socialUI.render(main);
  else if(next==='notifications')feedUI.render(main,'notifications');
  else if (next === 'messages') messagesUI.render(main);
  else if (next === 'circles') {if(guest||!state?.visitor)publicCircles();else circlesUI.render(main);}
  else if (next === 'profile') {feedUI.profile(accounts.active.account.id);feedUI.render(main);}
  else if(next==='edit-profile')profileForm();
  else if (next === 'discover') {feedUI.render(main,'directory').then(()=>{if(screen==='discover'&&!guest&&state?.visitor)main.append(button('Explore the 45 sample profiles',()=>{main.replaceChildren();discover();},'secondary'));});}
  else if (next === 'saved') saved();
  else if (next === 'detail') detail();
  document.title = `Orbit · ${ {create:'Create',popular:'Popular',search:'Search',home:'Campus feed','public-profile':'Public posts','new-profile':'Create profile',welcome:'Find common ground',accounts:'Demo accounts',connections:'Discover · Connections',notifications:'Notifications',messages:'Messages',circles:'Circles','edit-profile':'Edit profile',profile:'My profile',discover:'Discover',saved:'Saved profiles',detail:'Profile details'}[next] }`;
  if (focus) { main.focus(); window.scrollTo(0, 0); }
}
function navIcon(destination){return icon(destination);}
function renderNavigation() {
  nav.replaceChildren(el('p','YOUR ORBIT','eyebrow'));
  const signed=!guest&&!!state?.visitor;
  document.querySelector('#active-account').textContent=signed?`Using ${accounts.active.account.label} · Demo account`:'Browsing as a guest · Everyone belongs here';
  document.querySelector('#storage-status').hidden=!signed;
  for(const [destination,name,icon] of [['home','Home','⌂'],['create','Create','+'],['popular','Popular','↗'],['search','Search','⌕'],['discover','Discover','◎'],['messages','Messages','◷'],['notifications','Notifications','♧'],['circles','Circles','◉'],['profile','My profile','◯'],['accounts','Demo accounts','⇄']]){
    const item=button('',()=>{if(destination==='home')feedUI.home();navigate(destination);},'text-button');const symbol=navIcon(destination);item.append(symbol,document.createTextNode(name));if(destination==='notifications'&&signed&&socialRepository.ready){const count=socialRepository.notifications(accounts.active.account.id).filter(n=>!n.read).length;if(count)item.append(el('span',String(count),'notification-count'));}if((['connections','discover','public-profile'].includes(screen)?'discover':['saved','edit-profile'].includes(screen)?'profile':screen)===destination)item.setAttribute('aria-current','page');nav.append(item);
  }
  nav.append(button('Reset demo',()=>{if(requireAccount())resetDialog.showModal();},'text-button'));
  if(signed)nav.append(button('Browse as guest',()=>{guest=true;feedUI.home();navigate('home');},'secondary'));
  else nav.append(button('Join the conversation',()=>navigate('accounts')));
}
function publicCircles(){
  main.append(heading('Find your circle.','Browse communities freely. Choose an account to join and see member conversations.'));
  if(!socialRepository.reload()){main.append(el('p',socialRepository.error,'error'));return;}
  const grid=el('div',undefined,'account-grid');for(const c of socialRepository.data.circles){const card=el('article',undefined,'panel');card.append(el('h2',c.title),el('p',c.description),el('p',`${c.members.length} demo members`,'hint'),button('Join circle',()=>requireAccount()));grid.append(card);}main.append(grid);
}
function welcome() {
  const section = el('section', undefined, 'welcome'); const intro = el('div');
  const title = el('h1'); title.append(document.createTextNode('Shared interests.'), el('br'), el('span','New possibilities.'));
  intro.append(el('p','WELCOME TO YOUR ORBIT','eyebrow'),title,
    el('p','Explore a fictional campus circle, starting with the things you enjoy.','lede'),
    el('p','Create a demo profile, choose who you’d like to discover, and explore shared interests. All discoverable profiles are fictional adults. Please use fictional details too.','notice'),
    button('Create Demo Profile  ↗',()=>navigate('profile')),
    el('p','Saving is a bookmark, not a mutual match. No accounts, messages, or notifications to other people.','notice'));
  intro.append(button('Try a ready-made demo account',()=>navigate('accounts'),'secondary'));
  const art=el('div',undefined,'welcome-art');
  const logo=el('img',undefined,'hero-logo');logo.src='./assets/orbit-logo-stacked.svg';logo.alt='Orbit — Your campus. Your Interests. Your Connections';logo.width=800;logo.height=580;
  art.append(logo,el('p','A little common ground. A whole new orbit.','art-footnote'));
  section.append(intro,art); main.append(section);
}
function accountScreen() {
  main.append(heading('Choose your demo account.', 'Switch between fictional students on this device. No passwords, real accounts, or messages to real people.'));
  main.append(el('p','Each account has its own profile, preferences and bookmarks. Use Connections to send requests and switch accounts to respond. Connected accounts can exchange local demo messages in Messages. Switching leaves unsaved form edits behind; use Save profile first.','notice'));
  const grid=el('div',undefined,'account-grid');
  for (const account of accountsList) {
    const panel=el('article',undefined,'panel');
    panel.append(el('div',initials(account.label),'avatar'),el('h2',account.label),el('p',account.description,'muted'));
    const action=button(accounts.active?.account.id===account.id?'Continue with this account':'Use this account',async()=>{
      grid.querySelectorAll('button').forEach(b=>b.disabled=true);
      try {
        await activateAccount(account.id);feedUI.home();
        if(persistence.mode==='recovery') recovery();
        else navigate(state.visitor?'home':'new-profile');
        say(`Using ${account.label}.`);
      } catch(error) { grid.querySelectorAll('button').forEach(b=>b.disabled=false); problem.textContent=error.message; }
    });
    action.setAttribute('aria-label',`Use ${account.label}`);panel.append(action);grid.append(panel);
  }
  const problem=el('p',undefined,'error');problem.setAttribute('role','alert');
  main.append(grid,problem);
}
let accountsList=[];
async function activateAccount(id) {
  const entry=await accounts.activate(id);guest=false;
  client=entry.client;persistence=entry.persistence;catalogues=client.call('getCatalogues');readState();
  if(state.visitor){client.call('updatePreferences',{preferences:{...state.preferences,minAge:18,maxAge:100,genderIds:[]}});readState();}
}
function field(form, name, title, type='text', value='', hint='') {
  const wrap=el('label',undefined,'field'); const input=el(type==='textarea'?'textarea':'input');
  input.name=name; input.id=`${form.id}-${name}`; if(type!=='textarea') input.type=type;
  input.value=value ?? ''; const caption=el('span',title);caption.id=`${input.id}-label`;input.setAttribute('aria-labelledby',caption.id);wrap.append(caption,input);
  if(hint){const help=el('span',hint,'hint'); help.id=`${input.id}-hint`; input.setAttribute('aria-describedby',help.id);wrap.append(help);}
  return {wrap,input};
}
function select(form, name, title, options, value='', emptyLabel='Choose…') {
  const wrap=el('label',undefined,'field'); const input=el('select'); input.name=name;input.id=`${form.id}-${name}`;
  const caption=el('span',title);caption.id=`${input.id}-label`;input.setAttribute('aria-labelledby',caption.id);wrap.append(caption,input); setOptions(input,options,value,emptyLabel); return {wrap,input};
}
function setOptions(input, options, value, emptyLabel) {
  input.replaceChildren(); const empty=el('option',emptyLabel); empty.value='';input.append(empty);
  for(const choice of options){const item=el('option',choice.label); item.value=choice.id;input.append(item);} input.value=value??'';
}
function choices(name, title, options, selected, hint='') {
  const group=el('fieldset');group.append(el('legend',title));const list=el('div',undefined,'choices');
  for(const item of options){const wrap=el('label',undefined,'choice');const input=el('input');input.type='checkbox';input.name=name;input.value=item.id;input.checked=selected.includes(item.id);wrap.append(input,document.createTextNode(item.label));list.append(wrap);}
  group.append(list);if(hint)group.append(el('p',hint,'hint'));return group;
}
function errorBox(form) {const box=el('div',undefined,'error');box.tabIndex=-1;box.setAttribute('role','alert');form.append(box);return box;}
function errors(form, box, error) {
  form.querySelectorAll('[aria-invalid]').forEach(input=>input.removeAttribute('aria-invalid'));
  box.replaceChildren(el('strong','Please check these details.'));const list=el('ul');
  for(const issue of error.errors??[{message:error.message}]) {
    const name=issue.path?.split('/')[2];const inputs=[...form.elements].filter(input=>input.name===name);
    const caption=inputs[0]?.closest('label.field')?.querySelector('span')?.textContent ?? inputs[0]?.closest('fieldset')?.querySelector('legend')?.textContent;
    const message=issue.code==='id' && inputs[0]?.tagName==='SELECT' ? 'Choose an option from the list.' : issue.message;
    list.append(el('li',`${caption ? `${caption.replace(' *','')}: ` : ''}${message}`));
    for(const input of inputs)input.setAttribute('aria-invalid','true');
  }
  box.append(list);box.focus();
}
function formValues(form) {
  const data=new FormData(form);return {text:name=>data.get(name),number:name=>data.get(name)===''?null:Number(data.get(name)),list:name=>data.getAll(name),optional:name=>data.get(name)||null};
}
function profileForm() {
  if(state.visitor)main.append(button('View my public posts',()=>{feedUI.profile(accounts.active.account.id);navigate('public-profile');},'secondary'));
  const p=state.visitor??{};const shell=el('section',undefined,'form-shell');
  shell.append(heading(state.visitor?'Make it yours.':'A little about demo you.','Use a made-up name and bio. Required fields are marked *.'));
  const form=el('form',undefined,'panel');form.id='profile';form.noValidate=true;const box=errorBox(form);const grid=el('div',undefined,'form-grid');
  const name=field(form,'displayName','Display name *','text',p.displayName,'1–50 Unicode code points. Emoji sequences may count as several.');
  const age=field(form,'age','Age *','number',p.age,'Adults only · 18–100');age.input.min='18';age.input.max='100';age.input.step='1';
  const uni=select(form,'universityId','University *',catalogues.universities,p.universityId);
  const campus=select(form,'campusId','Campus *',university(p.universityId)?.campuses??[],p.campusId);
  campus.input.disabled=!p.universityId;
  uni.input.addEventListener('change',()=>{setOptions(campus.input,university(uni.input.value)?.campuses??[],'','Choose…');campus.input.disabled=!uni.input.value;});
  const degree=select(form,'degreeId','Degree / field of study *',catalogues.degrees,p.degreeId);
  const year=select(form,'yearId','Year of study',catalogues.years,p.yearId,'Not specified');
  const bio=field(form,'bio','Bio *','textarea',p.bio,'1–300 Unicode code points. Keep contact details and real personal information out.');bio.wrap.classList.add('full');
  const interests=choices('interestIds','Your interests *',catalogues.interests,p.interestIds??[],'Choose 1–5. Shared interests help order the fictional profiles you see.');interests.classList.add('full');
  grid.append(name.wrap,age.wrap,uni.wrap,campus.wrap,degree.wrap,year.wrap,bio.wrap,interests);
  const actions=el('div',undefined,'form-actions');actions.append(button('Cancel',()=>navigate(state.visitor?'profile':'welcome'),'secondary'));
  const submit=el('button',state.visitor?'Save profile':'Create profile & discover  ↗');submit.type='submit';actions.append(submit);form.append(grid,actions);
  form.addEventListener('submit',event=>{event.preventDefault();const v=formValues(form);try{
    client.call('updateProfile',{profile:{displayName:v.text('displayName'),age:v.number('age'),universityId:v.text('universityId'),campusId:v.text('campusId')??'',degreeId:v.text('degreeId'),yearId:v.optional('yearId'),genderId:p.genderId??catalogues.genders[0].id,showGender:false,bio:v.text('bio'),interestIds:v.list('interestIds')}});
    saveState();guest=false;feedUI.home();navigate('home');say('Demo profile updated. Discovery is ready.');
  }catch(error){errors(form,box,error);}});
  shell.append(form);main.append(shell);
}
function preferenceForm(onApplied) {
  const p=state.preferences;const form=el('form',undefined,'panel filters');form.id='preferences';form.noValidate=true;form.append(el('h2','Your preferences'));const box=errorBox(form);
  const uni=select(form,'universityId','University',catalogues.universities,p.universityId,'Any university');
  const campus=select(form,'campusId','Campus',university(p.universityId)?.campuses??[],p.campusId,'Any campus');campus.input.disabled=!p.universityId;
  uni.input.addEventListener('change',()=>{setOptions(campus.input,university(uni.input.value)?.campuses??[],'','Any campus');campus.input.disabled=!uni.input.value;});
  const degree=select(form,'degreeId','Field of study',catalogues.degrees,p.degreeId,'Any field');form.append(uni.wrap,campus.wrap,degree.wrap);
  const submit=el('button','Apply preferences');submit.type='submit';form.append(submit,el('p','Filter by university, campus and field of study. Shared interests order the results.','hint'));
  form.addEventListener('submit',event=>{event.preventDefault();const v=formValues(form);try{client.call('updatePreferences',{preferences:{minAge:18,maxAge:100,genderIds:[],universityId:v.optional('universityId'),campusId:v.optional('campusId'),degreeId:v.optional('degreeId')}});saveState();box.replaceChildren();form.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'));onApplied();}catch(error){errors(form,box,error);}});
  return form;
}
function tagList(p) {
  const tags=el('div',undefined,'tags');for(const id of p.interestIds)tags.append(el('span',label(catalogues.interests,id),`tag${p.sharedInterestIds.includes(id)?' shared':''}`));return tags;
}
function saveButton(p) {
  const node=button(p.saved?'Unsave':'Save',()=>{
    try{client.call(p.saved?'unsave':'save',{id:p.id});saveState();p.saved=!p.saved;node.textContent=p.saved?'Unsave':'Save';node.setAttribute('aria-label',`${p.saved?'Unsave':'Save'} ${p.displayName}`);node.setAttribute('aria-pressed',String(p.saved));renderNavigation();say(p.saved?`${p.displayName} bookmarked. Nobody is notified.`:`${p.displayName} removed from saved profiles.`);
      if(screen==='saved'){renderSavedResults();document.querySelector('#saved-results').focus();}
    }catch(error){say(error.message);}
  },'secondary');node.setAttribute('aria-label',`${p.saved?'Unsave':'Save'} ${p.displayName}`);node.setAttribute('aria-pressed',String(p.saved));return node;
}
function card(p) {
  const article=el('article',undefined,'profile-card');const person=el('div',undefined,'person');const copy=el('div');copy.append(el('h3',p.displayName));
  person.append(el('div',initials(p.displayName),'avatar'),copy);
  article.append(person,el('p',`${label(catalogues.universities,p.universityId)} · ${campusLabel(p)}\n${label(catalogues.degrees,p.degreeId)}`,'academic'),el('p',p.bio,'bio preview'),tagList(p),el('p',p.explanation,'explanation'));
  const actions=el('div',undefined,'actions');const view=button('View Profile  ↗',()=>{detailOrigin=screen;activeProfileId=p.id;navigate('detail');},'text-button');view.setAttribute('aria-label',`View Profile: ${p.displayName}`);actions.append(view,saveButton(p));article.append(actions);return article;
}
function empty(title,message,action) {const section=el('div',undefined,'empty');section.append(el('h2',title),el('p',message,'muted'));if(action)section.append(action);return section;}
function discover() {
  main.append(heading('Find your common ground.','Fictional sample profiles, ordered by shared interests.'));
  main.append(button('Connect with demo accounts',()=>navigate('connections'),'secondary'));
  const layout=el('div',undefined,'browse-layout');const results=el('section');results.setAttribute('aria-label','Discovery results');
  function render(){const profiles=client.call('discover');results.replaceChildren(el('p',`${profiles.length} fictional profiles · Most shared interests first`,'results-summary'));
    results.prepend(el('h2','Discovery results','sr-only'));
    if(!profiles.length)results.append(empty('A little more room to explore?','No profiles fit these preferences. Try another campus or Any university.'));
    else{const cards=el('div',undefined,'cards');profiles.forEach(p=>cards.append(card(p)));results.append(cards);}say(`${profiles.length} fictional profiles found.`);
  }
  layout.append(preferenceForm(render),results);main.append(layout);render();
}
function saved(){main.append(button('← My profile',()=>navigate('profile'),'text-button'));main.append(heading('Keep a little common ground.','Your bookmarks stay here when you change discovery preferences. Nobody is notified.'));const results=el('section');results.id='saved-results';results.tabIndex=-1;results.setAttribute('aria-label','Saved profiles');main.append(results);renderSavedResults();}
function renderSavedResults(){const results=document.querySelector('#saved-results');results.replaceChildren();const profiles=client.call('savedProfiles');if(!profiles.length){results.append(empty('Your saved circle starts here.','Bookmark a fictional profile in Discover and find it here later.',button('Explore profiles',()=>navigate('discover'))));return;}results.append(el('p',`${profiles.length} saved profiles · In the order you saved them`,'results-summary'));const cards=el('div',undefined,'cards');profiles.forEach(p=>cards.append(card(p)));results.append(cards);}
function detail(){const p=client.call('viewProfile',{id:activeProfileId});main.append(button(detailOrigin==='saved'?'← Back to saved':'← Back to discovery',()=>navigate(detailOrigin),'text-button'));const panel=el('article',undefined,'panel detail');const person=el('div',undefined,'person');const copy=el('div');copy.append(el('p','FICTIONAL PROFILE','eyebrow'),el('h1',p.displayName));person.append(el('div',initials(p.displayName),'avatar large'),copy);panel.append(person,el('p',p.bio,'bio'));const details=el('dl');for(const [title,value] of [['University',label(catalogues.universities,p.universityId)],['Campus',campusLabel(p)],['Field of study',label(catalogues.degrees,p.degreeId)],['Year of study',p.yearId?label(catalogues.years,p.yearId):'Not specified']]){const pair=el('div');pair.append(el('dt',title),el('dd',value));details.append(pair);}panel.append(details,el('h2','A few favourite things'),tagList(p),el('p',p.explanation,'explanation'),saveButton(p));main.append(panel);}

document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();if(client && screen!=='recovery'){feedUI.home();navigate('home');}});
document.querySelector('#cancel-reset').addEventListener('click',()=>resetDialog.close());

document.querySelector('#confirm-reset').addEventListener('click', () => {
  try {
    const removed = accounts.resetActive();
    resetDialog.close(); readState();feedUI.home();navigate('home');
    say(removed ? 'Selected demo account reset. Other accounts are unchanged.' : 'This page has been reset. Saved data could not be removed.');
  } catch (error) { say(error.message); }
});

function recovery() {
  screen = 'recovery'; renderNavigation(); nav.replaceChildren(button('Demo accounts',()=>navigate('accounts'),'text-button')); main.replaceChildren();
  document.title = 'Orbit · Restore your demo';
  const panel = el('section', undefined, 'panel form-shell');
  panel.append(el('h1', 'Let’s start safely.'), el('p', 'Your saved demo was not accepted. You can remove it and start fresh, or try the demo without changing what is stored.'));
  const actions = el('div', undefined, 'actions');
  actions.append(button('Start fresh', () => resetDialog.showModal()),
    button('Continue without saving', () => { persistence.continueInMemory(); readState(); navigate('welcome'); }, 'secondary'));
  panel.append(actions); main.append(panel); main.focus();
}

async function start() {
  main.replaceChildren(); nav.replaceChildren();
  const loading = el('section', undefined, 'loading'); loading.setAttribute('role','status');
  loading.append(el('p','ONE MOMENT','eyebrow'),el('h1','Finding our common ground…'),el('p','Loading the fictional profiles.'));
  main.append(loading);
  try {
    const [{ loadClient }, { DemoAccounts, ACCOUNTS }] = await Promise.all([import('./api-client.mjs?v=1.11.0'), import('./demo-accounts.mjs?v=1.11.0')]);
    accountsList=ACCOUNTS; accounts=new DemoAccounts({loadClient,report:storageStatus});
    const { createSocialUI } = await import('./social-ui.mjs?v=1.11.0');
    const { DemoSocial } = await import('./demo-social.mjs?v=1.11.0');
    const { createMessagesUI } = await import('./messages-ui.mjs?v=1.11.0');
    const { createCirclesUI } = await import('./circles-ui.mjs?v=1.11.0');
    const { createFeedUI } = await import('./feed-ui.mjs?v=1.11.0');
    socialRepository=new DemoSocial();
    feedUI=createFeedUI({accounts,repository:socialRepository,getActor:()=>!guest&&state?.visitor?accounts.active.account.id:null,getCatalogues:()=>catalogues,requireAccount,announce:say,onActivity:(destination,circle)=>{renderNavigation();if(circle&&!guest){if(destination==='messages')messagesUI.select(circle);else if(destination==='circles')circlesUI.select(circle);}if(destination)navigate(destination);}});
    circlesUI=createCirclesUI({accounts,repository:socialRepository,announce:say,openPost:id=>{feedUI.deepLink(id);navigate('home');}});
    messagesUI=createMessagesUI({accounts,repository:socialRepository,announce:say});
    socialUI=createSocialUI({accounts,getCatalogues:()=>catalogues,announce:say,repository:socialRepository,openDiscover:()=>navigate('discover'),openProfile:target=>{feedUI.profile(target);navigate('public-profile');},openMessages:target=>{messagesUI.select(target);navigate('messages');}});
    guestClient=await loadClient();client=guestClient;catalogues=client.call('getCatalogues');readState();
    const linked=/^#post=(\d+)$/.exec(location.hash);if(linked)feedUI.deepLink(Number(linked[1]));
    navigate('home',false);
  } catch (error) {
    accounts?.dispose(); client = undefined; persistence = undefined;
    loading.replaceChildren(el('h1','The demo could not load.'),el('p','Check your connection and try again. If the problem continues, refresh the page.'),button('Try again',start));
    console.error(error);
  }
}
window.addEventListener('storage', event => {
  accounts?.checkExternalChange(event.key);
  if(['home','public-profile','connections','messages','circles'].includes(screen) && (!event.key || event.key===socialUI?.key)){say('Shared social data changed in another tab. Reload the saved social data on this screen to see it.');}
});
window.addEventListener('pageshow', event => { if (event.persisted) persistence?.checkExternalChange(); });
window.addEventListener('pagehide', event => { if (!event.persisted) { accounts?.dispose();guestClient?.dispose(); client = undefined; } });
start();


