import {DraftStore} from './student-core.mjs?v=1.16.0';
import {createClient} from './vendor/supabase.mjs';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './cloud-config.mjs';
export const cloud=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const checked=async promise=>{const {data,error}=await promise;if(error)throw error;return data;};
export async function cloudAPI(path,body,currentUser=null){
 const url=new URL(path,'https://orbit.invalid'),route=url.pathname;
 if(route==='/auth/register'){
  const handle=body.handle.trim().toLowerCase();if(!/^[a-z][a-z0-9_]{2,23}$/.test(handle))throw Error('Use a handle of 3–24 lowercase letters, digits or underscores.');if(body.password.length<12)throw Error('Use at least 12 characters for your password.');
  if(!/^[^@\s]+@mynwu\.ac\.za$/i.test(body.email.trim()))throw Error('Use your NWU student email ending in @mynwu.ac.za.');
  const data=await checked(cloud.auth.signUp({email:body.email,password:body.password,options:{data:{handle,displayName:handle},emailRedirectTo:new URL('./cloud.html',location.href).href}}));if(!data.session)throw Error('Check your student inbox to confirm your account, then sign in.');return checked(cloud.rpc('orbit_api',{path:'/me'}));
 }
 if(route==='/auth/login'){await checked(cloud.auth.signInWithPassword({email:body.email,password:body.password}));return checked(cloud.rpc('orbit_api',{path:'/me'}));}
 if(route==='/auth/recover'){await checked(cloud.auth.resetPasswordForEmail(body.email,{redirectTo:new URL('./cloud.html?flow=recovery',location.href).href}));return {ok:true};}
 if(route==='/auth/reset'){if(typeof body.password!=='string'||body.password.length<12)throw Error('Use at least 12 characters.');await checked(cloud.auth.updateUser({password:body.password}));return {ok:true};}
 if(route==='/auth/delete'){const {data:{user}}=await cloud.auth.getUser();await checked(cloud.auth.signInWithPassword({email:user.email,password:body.password}));const {data:{session}}=await cloud.auth.getSession();const response=await fetch(SUPABASE_URL+'/functions/v1/orbit-account',{method:'POST',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({confirm:body.confirm})});const result=await response.json();if(!response.ok)throw Error(result.error??'Account deletion failed.');new DraftStore('cloud:'+user.id).clear();await checked(cloud.auth.signOut());return result;}
 if(route==='/auth/logout'){if(currentUser)new DraftStore('cloud:'+currentUser.id).clear();await checked(cloud.auth.signOut());return {ok:true};}
 const query=Object.fromEntries(url.searchParams),result=await checked(cloud.rpc('orbit_api',{path:route,method:body===undefined?'GET':'POST',body:body??query}));
 if(result?.items){if(route==='/feed'||route==='/events')result.items=result.items.map(p=>({...p,rawAuthor:p.author,author:p.handle}));else if(route.endsWith('/comments'))result.items=result.items.map(p=>({...p,rawAuthor:p.author,author:p.handle}));else if(route.startsWith('/messages/'))result.items=result.items.map(p=>({...p,sender:p.handle}));else if(route==='/circles')result.items=result.items.map(c=>({...c,owner:c.ownerHandle}));}
 if(route.startsWith('/people/')&&result.connection){const peer=route.split('/')[2],name=id=>id===currentUser.id?currentUser.handle:peer;result.connection={...result.connection,sender:name(result.connection.sender),recipient:name(result.connection.recipient)};}
 return result;
}
