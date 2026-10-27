import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
// Generated from the tested game core and handler. No administrative key enters the client.
export const gameKind=g=>g.kind??'four';
export const gameTitle=g=>gameKind(g)==='dots'?'Dots and Boxes':'Four in a Row';
export function replayDots(moves){
 const edges=Array(24).fill(0),boxes=Array(9).fill(0),scores=[0,0];let turn=0;
 if(!Array.isArray(moves)||moves.length>24)throw Error('Invalid moves.');
 for(const m of moves){const e=m.edge;if(!Number.isInteger(e)||e<0||e>=24||edges[e])throw Error('Choose an undrawn edge.');edges[e]=turn+1;let earned=0;
 for(let r=0;r<3;r++)for(let c=0;c<3;c++){const i=r*3+c;if(!boxes[i]&&[r*3+c,(r+1)*3+c,12+r*4+c,12+r*4+c+1].every(x=>edges[x])){boxes[i]=turn+1;scores[turn]++;earned++;}}
 if(!earned)turn=1-turn;
 }const finished=moves.length===24,winner=finished&&scores[0]!==scores[1]?(scores[0]>scores[1]?1:2):0;return {edges,boxes,scores,turn,winner,draw:finished&&!winner};
}
const replayGame=g=>{if(!['four','dots'].includes(gameKind(g)))throw Error('Unknown game.');return gameKind(g)==='dots'?replayDots(g.moves):replay(g.moves);};
export const GAME_TTL=7*86400000;
export function replay(moves){
 const board=Array.from({length:6},()=>Array(7).fill(0));let winner=0,winning=[];
 if(!Array.isArray(moves)||moves.length>42)throw Error('Invalid moves.');
 for(let i=0;i<moves.length;i++){const col=moves[i].column;if(winner||!Number.isInteger(col)||col<0||col>6)throw Error('Invalid move.');let row=5;while(row>=0&&board[row][col])row--;if(row<0)throw Error('Column is full.');const piece=i%2+1;board[row][col]=piece;
 for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){const cells=[[row,col]];for(const sign of [-1,1]){let y=row+dr*sign,x=col+dc*sign;while(y>=0&&y<6&&x>=0&&x<7&&board[y][x]===piece){cells.push([y,x]);y+=dr*sign;x+=dc*sign;}}if(cells.length>=4){winner=piece;winning=cells;break;}}
 }return {board,winner,winning,draw:!winner&&moves.length===42,turn:moves.length%2};
}
export function gameState(g,now=Date.now()){const state=replayGame(g);let status=g.status;if(status==='active')status=state.winner?'won':state.draw?'draw':now>=g.updatedAt+GAME_TTL?'expired':'active';else if(status==='invited'&&now>=g.updatedAt+GAME_TTL)status='expired';return {...state,status,winnerActor:state.winner?g.players[state.winner-1]:g.status==='resigned'?g.players.find(a=>a!==g.resignedBy):null};}
export function validateGames(d,actors){if(!Array.isArray(d.games))throw Error('Invalid games.');let last=0;for(const g of d.games){if(!Number.isSafeInteger(g.id)||g.id<=last||!Array.isArray(g.players)||g.players.length!==2||g.players[0]===g.players[1]||g.players.some(a=>!actors.includes(a))||!g.players.includes(g.inviter)||!['invited','active','declined','cancelled','resigned'].includes(g.status)||!Number.isFinite(g.at)||g.at<0||!Number.isFinite(g.updatedAt)||g.updatedAt<g.at)throw Error('Invalid game.');let time=g.at;for(const m of g.moves){if(!Number.isFinite(m.at)||m.at<time||m.at>g.updatedAt)throw Error('Invalid move time.');time=m.at;}const state=replayGame(g);if(['invited','declined'].includes(g.status)&&g.moves.length||g.status==='resigned'&&(!g.players.includes(g.resignedBy)||state.winner||state.draw))throw Error('Invalid result.');last=g.id;}}
export function changeGame(d,actor,peer,op,extra,now){
 const blocked=d.blocks.some(b=>gPair(b.from,b.to)===gPair(actor,peer)),connected=d.requests.some(q=>gPair(q.from,q.to)===gPair(actor,peer)&&q.status==='accepted');if(blocked||!connected)throw Error('An accepted connection is required to play.');
 const games=d.games.filter(g=>g.players.includes(actor)&&g.players.includes(peer));
 if(op==='game-invite'){if(games.some(g=>['invited','active'].includes(gameState(g,now).status)))throw Error('Finish or cancel your existing match first.');let players=[actor,peer],kind=extra.kind??'four';if(!['four','dots'].includes(kind))throw Error('Unknown game.');if(extra.rematch!=null){const old=games.find(g=>g.id===extra.rematch);if(!old||!['won','draw','resigned','expired','declined','cancelled'].includes(gameState(old,now).status))throw Error('This match cannot be replayed yet.');players=[old.players[1],old.players[0]];kind=gameKind(old);}d.games.push({kind,id:(d.games.at(-1)?.id??0)+1,players,inviter:actor,status:'invited',at:now,updatedAt:now,moves:[]});return;}
 const g=games.find(g=>g.id===extra.game);if(!g)throw Error('Match unavailable.');const state=gameState(g,now);
 if(op==='game-accept'||op==='game-decline'){if(state.status!=='invited'||g.inviter===actor)throw Error('Only the invited student can respond.');g.status=op==='game-accept'?'active':'declined';}
 else if(op==='game-cancel'){if(state.status!=='invited'||g.inviter!==actor)throw Error('Only the challenger can cancel a pending invitation.');g.status='cancelled';}
 else if(op==='game-move'){if(state.status!=='active'||g.players[state.turn]!==actor)throw Error('It is not your turn in an active match.');if(extra.expectedMoves!==g.moves.length)throw Error('The board changed. Reload before moving.');if(gameKind(g)==='dots'){if(!Number.isInteger(extra.edge)||extra.edge<0||extra.edge>=24||state.edges[extra.edge])throw Error('Choose an undrawn edge.');g.moves.push({edge:extra.edge,at:now});}else{if(!Number.isInteger(extra.column)||extra.column<0||extra.column>6||state.board[0][extra.column])throw Error('Choose a column with space.');g.moves.push({column:extra.column,at:now});}replayGame(g);}
 else if(op==='game-resign'){if(state.status!=='active')throw Error('This match is not active.');g.status='resigned';g.resignedBy=actor;}
 else throw Error('Unknown game action.');g.updatedAt=now;
}
const gPair=(a,b)=>[a,b].sort().join(':');
export function cancelPairGames(d,a,b,now){for(const g of d.games)if(g.players.includes(a)&&g.players.includes(b)&&['active','invited'].includes(gameState(g,now).status)){g.status='cancelled';g.updatedAt=now;}}
class Failure extends Error{constructor(status,message){super(message);this.status=status}}
const require=(yes,status,message)=>{if(!yes)throw new Failure(status,message)};
export function createGameHandler({verifyUser,repository,allowedOrigins,now=()=>Date.now()}){
 return async req=>{
  const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};if(origin&&allowedOrigins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
  try{
   require(!origin||allowedOrigins.includes(origin),403,'Origin is not allowed.');if(req.method==='OPTIONS')return new Response(null,{status:204,headers});require(['GET','POST'].includes(req.method),405,'Method not allowed.');
   const authorization=req.headers.get('authorization')??'';require(/^Bearer \S+$/.test(authorization),401,'Sign in first.');const user=await verifyUser(authorization.slice(7));require(user?.id&&user.email_confirmed_at&&!user.is_anonymous,401,'Sign in with a verified email first.');
   const url=new URL(req.url);let body={};if(req.method==='POST'){let text='',bytes=0;const reader=req.body?.getReader(),decoder=new TextDecoder();if(reader){while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>8192){await reader.cancel();throw new Failure(413,'Request too large.')}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();}try{body=JSON.parse(text)}catch{throw new Failure(400,'Invalid JSON.')}require(body&&typeof body==='object'&&!Array.isArray(body),400,'Invalid request.');}
   const handle=req.method==='GET'?url.searchParams.get('peer'):body.peer;require(typeof handle==='string'&&/^[a-z][a-z0-9_]{2,23}$/.test(handle),400,'Choose a student handle.');const peer=await repository.peer(handle);require(peer&&peer.id!==user.id,404,'Student unavailable.');require(!await repository.blocked(user.id,peer.id),403,'Student unavailable.');
   const map=row=>({...row.game,id:row.id,version:row.version});
   if(req.method==='GET'){const before=Number(url.searchParams.get('before')??Number.MAX_SAFE_INTEGER);require(Number.isSafeInteger(before)&&before>0,400,'Invalid cursor.');const rows=await repository.list(user.id,peer.id,{before,limit:Math.min(50,Math.max(1,Number(url.searchParams.get('limit'))||25))});return json({items:rows.map(row=>{const g=map(row);return {...g,state:gameState(g,now())}})});}
   require(['invite','accept','decline','cancel','move','resign'].includes(body.action),400,'Unknown game action.');require(await repository.connected(user.id,peer.id),403,'An accepted connection is required.');
   for(const key of ['game','rematch'])if(body[key]!=null)require(Number.isSafeInteger(body[key])&&body[key]>0,400,'Invalid match.');
   const games=(await repository.relevant(user.id,peer.id,body)).map(map);let previous;if(body.action!=='invite'){previous=games.find(g=>g.id===body.game);require(previous&&previous.version===body.version,409,'The match changed. Reload before moving.');}
   const data={blocks:[],requests:[{from:user.id,to:peer.id,status:'accepted'}],games};changeGame(data,user.id,peer.id,'game-'+body.action,body,now());const g=body.action==='invite'?data.games.at(-1):data.games.find(g=>g.id===body.game),payload={...g};delete payload.version;const row=await repository.commit({actor:user.id,peer:peer.id,gameID:body.action==='invite'?null:g.id,expectedVersion:previous?.version??null,payload,nextStatus:gameState(g,now()).status});const saved=map(row);return json({...saved,state:gameState(saved,now())});
  }catch(e){const code=e.code,status=e.status??(['23505','40001','40P01'].includes(code)?409:code==='42501'?403:400);return json({error:e.message??'Game request failed.'},status);}
 };
}
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
