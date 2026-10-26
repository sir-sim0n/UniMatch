import assert from 'node:assert/strict';
import {DemoSocial} from '../web/demo-social.mjs';
import {replay,gameState,GAME_TTL} from '../web/games-core.mjs';
const moves=cols=>cols.map(column=>({column,at:1}));
assert.equal(replay(moves([0,0,1,1,2,2,3])).winner,1);
assert.equal(replay(moves([0,1,0,1,0,1,0])).winner,1);
const diagonal=[0,1,1,2,4,2,2,3,4,3,5,3,3];assert.equal(replay(moves(diagonal)).winner,1);assert.equal(replay(moves(diagonal.map(c=>6-c))).winner,1);
assert.throws(()=>replay(moves([0,0,0,0,0,0,0])));assert.throws(()=>replay(moves([0,0,1,1,2,2,3,4])));assert.throws(()=>replay(moves([-1])));
// Deterministically construct a legal full board without allowing a premature win.
let seed=7,draw=null;for(let attempt=0;attempt<1000&&!draw;attempt++){const cols=[];while(cols.length<42){const options=[];for(let c=0;c<7;c++){try{const s=replay(moves([...cols,c]));if(!s.winner)options.push(c);}catch{}}if(!options.length)break;seed=(seed*1664525+1013904223)>>>0;cols.push(options[seed%options.length]);}if(cols.length===42)draw=cols;}assert.ok(draw);assert.equal(replay(moves(draw)).draw,true);
const store={value:null,getItem(){return this.value},setItem(k,v){if(this.fail)throw Error('full');this.value=v},removeItem(){this.value=null}};let now=1793000000000;const make=()=>new DemoSocial({storage:()=>store,now:()=>now,lock:f=>f()});let r=make();
await assert.rejects(()=>r.change('naledi','game-invite','sipho'));
await r.change('naledi','request','sipho');await r.change('sipho','accept','naledi');await r.change('naledi','game-invite','sipho');assert.equal(r.games('naledi','sipho').length,1);assert.equal(r.games('ayesha','sipho').length,0);assert.ok(r.notifications('sipho').some(n=>n.kind==='game'));
await assert.rejects(()=>r.change('naledi','game-accept','sipho',{game:1}));await assert.rejects(()=>r.change('sipho','game-invite','naledi'));await r.change('sipho','game-accept','naledi',{game:1});
await assert.rejects(()=>r.change('sipho','game-move','naledi',{game:1,column:0,expectedMoves:0}));
for(const [i,column] of [0,0,1,1,2,2,3].entries()){now++;await r.change(i%2?'sipho':'naledi','game-move',i%2?'naledi':'sipho',{game:1,column,expectedMoves:i});}
assert.equal(gameState(r.games('naledi','sipho')[0],now).winnerActor,'naledi');await assert.rejects(()=>r.change('sipho','game-move','naledi',{game:1,column:3,expectedMoves:7}));assert.equal(make().games('naledi','sipho')[0].moves.length,7);
await r.change('naledi','game-invite','sipho',{rematch:1});assert.deepEqual(r.games('naledi','sipho')[1].players,['sipho','naledi']);await r.change('sipho','game-accept','naledi',{game:2});
const before=JSON.stringify(r.data);store.fail=true;await assert.rejects(()=>r.change('sipho','game-move','naledi',{game:2,column:0,expectedMoves:0}));assert.equal(JSON.stringify(r.data),before);store.fail=false;
await assert.rejects(()=>r.change('sipho','game-move','naledi',{game:2,column:0,expectedMoves:1}));const stale=make();await r.change('sipho','game-move','naledi',{game:2,column:0,expectedMoves:0});await assert.rejects(()=>stale.change('sipho','game-move','naledi',{game:2,column:0,expectedMoves:0}));await r.change('naledi','game-resign','sipho',{game:2});assert.equal(gameState(r.games('naledi','sipho')[1],now).winnerActor,'sipho');
await r.change('naledi','game-invite','sipho');now+=GAME_TTL;await assert.rejects(()=>r.change('sipho','game-accept','naledi',{game:3}));assert.equal(gameState(r.games('naledi','sipho')[2],now).status,'expired');
await r.change('naledi','game-invite','sipho');await r.change('sipho','game-decline','naledi',{game:4});await r.change('naledi','game-invite','sipho');await r.change('naledi','game-cancel','sipho',{game:5});
await r.change('naledi','game-invite','sipho');await r.change('sipho','game-accept','naledi',{game:6});await r.change('naledi','block','sipho');assert.equal(r.data.games[5].status,'cancelled');assert.equal(r.games('naledi','sipho').length,0);await assert.rejects(()=>r.change('sipho','game-move','naledi',{game:6,column:0,expectedMoves:0}));
const legacy=structuredClone(r.data);legacy.version=7;delete legacy.games;store.value=JSON.stringify(legacy);r=make();assert.equal(r.data.version,8);assert.deepEqual(r.data.games,[]);assert.equal(JSON.parse(store.value).version,7);
const bad=structuredClone(r.data);bad.games=[{id:1,players:['naledi','sipho'],inviter:'naledi',status:'active',at:0,updatedAt:1,moves:moves([0,0,0,0,0,0,0])}];store.value=JSON.stringify(bad);assert.equal(make().ready,false);
console.log('Four in a Row: wins in all directions, draw, full columns, permissions, challenges, turns, stale/duplicate moves, persistence, rematches, resignation, expiry, blocking, rollback and migration passed.');
