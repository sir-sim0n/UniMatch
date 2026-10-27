import {changeGame,gameState} from '../../../web/games-core.mjs';
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
