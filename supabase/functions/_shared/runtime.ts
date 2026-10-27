const projectURL=Deno.env.get('SUPABASE_URL');
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')??'{}').default;
const admin=createClient(projectURL,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=async query=>{const {data,error}=await query;if(error)throw error;return data;};
const pair=(a,b)=>[a,b].sort();
const repository={
 peer:handle=>checked(admin.from('orbit_profiles').select('id,handle').eq('handle',handle).maybeSingle()),
 blocked:async(a,b)=>(await checked(admin.from('orbit_blocks').select('actor').or(`and(actor.eq.${a},target.eq.${b}),and(actor.eq.${b},target.eq.${a})`).limit(1))).length>0,
 connected:async(a,b)=>{const [low,high]=pair(a,b);return !!await checked(admin.from('orbit_connections').select('status').eq('low_actor',low).eq('high_actor',high).eq('status','accepted').maybeSingle());},
 list:(a,b,{before,limit})=>{const [low,high]=pair(a,b);return checked(admin.from('orbit_games').select('*').eq('low_actor',low).eq('high_actor',high).lt('id',before).order('id',{ascending:false}).limit(limit));},
 relevant:(a,b,body)=>{const [low,high]=pair(a,b),clauses=['status.in.(invited,active)'];for(const key of ['game','rematch'])if(body[key]!=null)clauses.push('id.eq.'+body[key]);return checked(admin.from('orbit_games').select('*').eq('low_actor',low).eq('high_actor',high).or(clauses.join(',')).order('id'));},
 commit:({actor,peer,gameID,expectedVersion,payload,nextStatus})=>checked(admin.rpc('orbit_commit_game',{p_actor:actor,p_peer:peer,p_game_id:gameID,p_expected_version:expectedVersion,p_payload:payload,p_status:nextStatus}))
};
Deno.serve(createGameHandler({verifyUser:async token=>{const {data,error}=await admin.auth.getUser(token);return error?null:data.user;},repository,allowedOrigins:['https://sir-sim0n.github.io','http://127.0.0.1:8030','http://127.0.0.1:8032']}));
