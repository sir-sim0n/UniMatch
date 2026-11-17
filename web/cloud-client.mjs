import {createClient} from './vendor/supabase.mjs';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './cloud-config.mjs';
export const cloud=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const checked=async promise=>{const {data,error}=await promise;if(error)throw error;return data;};
export async function cloudAPI(path,body,currentUser=null){
 const url=new URL(path,'https://orbit.invalid'),route=url.pathname;
 if(route==='/auth/register'){
  const handle=body.handle.trim().toLowerCase();if(!/^[a-z][a-z0-9_]{2,23}$/.test(handle))throw Error('Use a handle of 3–24 lowercase letters, digits or underscores.');if(body.password.length<12)throw Error('Use at least 12 characters for your password.');
  const taken=await checked(cloud.rpc('orbit_api',{path:'/profiles',body:{q:handle}}));if(taken.items.some(p=>p.handle===handle))throw Error('That handle is already in use.');
  const data=await checked(cloud.auth.signUp({email:body.email,password:body.password,options:{data:{handle,displayName:body.displayName},emailRedirectTo:new URL('./cloud.html',location.href).href}}));if(!data.session)throw Error('Check your email to confirm your account, then sign in. The pilot currently uses Supabase’s restricted test email service.');return checked(cloud.rpc('orbit_api',{path:'/me'}));
 }
 if(route==='/auth/login'){await checked(cloud.auth.signInWithPassword({email:body.email,password:body.password}));return checked(cloud.rpc('orbit_api',{path:'/me'}));}
 if(route==='/auth/logout'){await checked(cloud.auth.signOut());return {ok:true};}
 const query=Object.fromEntries(url.searchParams),result=await checked(cloud.rpc('orbit_api',{path:route,method:body===undefined?'GET':'POST',body:body??query}));
 if(result?.items){if(route==='/feed'||route==='/events')result.items=result.items.map(p=>({...p,rawAuthor:p.author,author:p.handle}));else if(route.endsWith('/comments'))result.items=result.items.map(p=>({...p,rawAuthor:p.author,author:p.handle}));else if(route.startsWith('/messages/'))result.items=result.items.map(p=>({...p,sender:p.handle}));else if(route==='/circles')result.items=result.items.map(c=>({...c,owner:c.ownerHandle}));}
 if(route.startsWith('/people/')&&result.connection){const peer=route.split('/')[2],name=id=>id===currentUser.id?currentUser.handle:peer;result.connection={...result.connection,sender:name(result.connection.sender),recipient:name(result.connection.recipient)};}
 return result;
}
