import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve,sep} from 'node:path';
import {createOrbitServer} from '../backend/server.mjs';
const dir=await mkdtemp(join(tmpdir(),'orbit-backend-')),database=join(dir,'test.sqlite');let server,base;
async function start(){server=createOrbitServer({database,moderators:['naledi_test'],rateLimit:1000});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
async function stop(){await new Promise(r=>server.close(r))}
const guest={};async function req(client,path,body,expected=200,headers={}){const response=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{...(client.cookie?{Cookie:client.cookie}:{}),...(body===undefined?{}:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':client.csrf??''}),...headers},body:body===undefined?undefined:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));const cookie=response.headers.get('set-cookie');if(cookie)client.cookie=cookie.split(';')[0];if(data.csrf)client.csrf=data.csrf;return data}
const a={},b={},c={};try{
 await start();await req(guest,'/health');await req(guest,'/posts',{title:'x',text:'x'},401);
 for(const [client,handle] of [[a,'naledi_test'],[b,'sipho_test'],[c,'ayesha_test']])await req(client,'/auth/register',{handle,password:'Fictional-test-password-2026!',displayName:handle},201);
 await req(a,'/auth/register',{handle:'naledi_test',password:'Fictional-test-password-2026!',displayName:'Duplicate'},409);
 await req(guest,'/auth/login',{handle:'sipho_test',password:'wrong'},401);
 await req(a,'/posts',{title:'CSRF',text:'bad'},403,{'X-CSRF-Token':'invalid'});await req(a,'/posts',{title:'Origin',text:'bad'},403,{Origin:'https://other.invalid'});
 const post=await req(a,'/posts',{title:'Campus test',text:'Shared durable discussion',actor:'sipho_test'},201);assert.equal((await req(guest,'/feed')).items[0].author,'naledi_test');
 await req(b,'/posts/'+post.id,{title:'Stolen',text:'no'},403);
 await req(a,'/posts/'+post.id,{title:'Edited campus test',text:'Updated text'});assert.ok((await req(guest,'/feed')).items[0].edited);
 const comment=await req(b,`/posts/${post.id}/comments`,{text:'A shared reply'},201);await req(c,'/comments/'+comment.id,{text:'Stolen'},403);await req(b,'/comments/'+comment.id,{text:'Edited reply'});
 await req(b,`/posts/${post.id}/vote`,{});assert.equal((await req(guest,'/feed')).items[0].upvotes,1);
 await req(a,'/messages/sipho_test',{text:'Before connection'},403);await req(a,'/people/sipho_test/connection',{action:'request'});await req(a,'/people/sipho_test/connection',{action:'accept'},403);await req(b,'/people/naledi_test/connection',{action:'accept'});
 await req(a,'/messages/sipho_test',{text:'Private test message'},201);assert.equal((await req(b,'/messages/naledi_test')).items[0].text,'Private test message');assert.equal((await req(c,'/messages/naledi_test')).items.length,0);
 let game=await req(a,'/games/sipho_test',{action:'invite',kind:'dots'});await req(a,'/games/sipho_test',{action:'accept',game:game.id,version:game.version},400);game=await req(b,'/games/naledi_test',{action:'accept',game:game.id,version:game.version});
 const initial=game;const attempts=await Promise.all([0,0].map(edge=>fetch(base+'/api/games/sipho_test',{method:'POST',headers:{Cookie:a.cookie,Origin:base,'Content-Type':'application/json','X-CSRF-Token':a.csrf},body:JSON.stringify({action:'move',game:game.id,version:game.version,edge,expectedMoves:0})})));assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);game=(await req(a,'/games/sipho_test')).items[0];assert.equal(game.moves.length,1);
 await req(c,'/games/naledi_test',{action:'move',game:game.id,version:game.version,edge:1,expectedMoves:1},403);
 const circle=await req(a,'/circles',{title:'Private tests',description:'Restricted test circle',private:true},201);await req(a,'/posts',{title:'Private title',text:'Private body',circle:circle.id},201);assert.equal((await req(guest,'/feed')).items.length,1);await req(b,'/feed?circle='+circle.id,undefined,404);await req(b,`/circles/${circle.id}/join`,{});await req(b,`/circles/${circle.id}/review`,{user:'sipho_test',accept:true},403);await req(a,`/circles/${circle.id}/review`,{user:'sipho_test',accept:true});assert.equal((await req(b,'/feed?circle='+circle.id)).items.length,1);await req(b,`/circles/${circle.id}/moderator`,{user:'sipho_test',moderator:true},403);
 await req(b,'/reports',{target:'ayesha_test',reason:'Spam',details:'Fictional test report'},201);await req(b,'/reports',undefined,403);assert.equal((await req(a,'/reports')).items.length,1);
 await req(b,'/people/naledi_test/block',{block:true});await req(a,'/messages/sipho_test',undefined,403);assert.equal((await req(c,'/games/naledi_test')).items.length,0);assert.equal((await req(a,'/feed')).items.filter(p=>p.author==='sipho_test').length,0);
 const oldCookie=a.cookie;await req(a,'/auth/logout',{});await req({cookie:oldCookie},'/notifications',undefined,401);
 await stop();await start();const signed={};await req(signed,'/auth/login',{handle:'naledi_test',password:'Fictional-test-password-2026!'});assert.equal((await req(signed,'/feed')).items.filter(p=>p.author==='naledi_test').length,2);
 console.log('Shared backend: signup/login/logout, durable restart, CSRF/origin, ownership, private circles, reports, messages, blocking and concurrent game CAS passed.');
}finally{if(server?.listening)await stop();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));await rm(dir,{recursive:true,force:true});}
