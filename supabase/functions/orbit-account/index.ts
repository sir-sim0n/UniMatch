import {createClient} from 'npm:@supabase/supabase-js@2.118.0';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default;
const admin = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
const origins = new Set(['https://sir-sim0n.github.io','http://127.0.0.1:8030','http://127.0.0.1:8032']);

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  const headers: Record<string,string> = {
    'Content-Type':'application/json', 'Vary':'Origin',
    'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods':'POST,OPTIONS'
  };
  if (origin && origins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (value: unknown, status = 200) => new Response(JSON.stringify(value), {status,headers});
  if (origin && !origins.has(origin)) return respond({error:'Origin is not allowed.'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (request.method !== 'POST') return respond({error:'Method not allowed.'},405);
  try {
    const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
    if (!token) return respond({error:'Sign in again before deleting your account.'},401);
    const {data:{user},error} = await admin.auth.getUser(token);
    if (error || !user || user.is_anonymous || !user.email_confirmed_at) return respond({error:'Sign in again.'},401);
    const signedIn = Date.parse(user.last_sign_in_at ?? '');
    if (!Number.isFinite(signedIn) || Date.now()-signedIn > 10*60*1000) return respond({error:'Sign in again to confirm this deletion.'},401);
    const reader = request.body?.getReader();
    let bytes = 0;
    let text = '';
    const decoder = new TextDecoder();
    if (reader) {
      while (true) {
        const {value,done} = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > 256) { await reader.cancel(); return respond({error:'Request too large.'},413); }
        text += decoder.decode(value,{stream:true});
      }
      text += decoder.decode();
    }
    if (JSON.parse(text).confirm !== 'DELETE') return respond({error:'Type DELETE to confirm.'},400);
    const prepared = await admin.rpc('orbit_prepare_account_deletion',{p_actor:user.id});
    if (prepared.error) throw prepared.error;
    const signedOut = await admin.auth.admin.signOut(token,'global');
    if (signedOut.error) return respond({error:'Your community data was removed. Session revocation needs an operator retry.',pending:true},503);
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) return respond({error:'Your community data was removed. Identity deletion needs an operator retry.',pending:true},503);
    const completed = await admin.rpc('orbit_complete_account_deletion',{p_actor:user.id});
    if (completed.error) console.error('Deletion audit completion failed', completed.error.code);
    return respond({ok:true});
  } catch {
    return respond({error:'Could not complete account deletion. Retry or contact the operator.'},400);
  }
});
