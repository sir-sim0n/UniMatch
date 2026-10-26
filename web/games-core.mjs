export const GAME_TTL=7*86400000;
export function replay(moves){
 const board=Array.from({length:6},()=>Array(7).fill(0));let winner=0,winning=[];
 if(!Array.isArray(moves)||moves.length>42)throw Error('Invalid moves.');
 for(let i=0;i<moves.length;i++){const col=moves[i].column;if(winner||!Number.isInteger(col)||col<0||col>6)throw Error('Invalid move.');let row=5;while(row>=0&&board[row][col])row--;if(row<0)throw Error('Column is full.');const piece=i%2+1;board[row][col]=piece;
 for(const [dr,dc] of [[1,0],[0,1],[1,1],[1,-1]]){const cells=[[row,col]];for(const sign of [-1,1]){let y=row+dr*sign,x=col+dc*sign;while(y>=0&&y<6&&x>=0&&x<7&&board[y][x]===piece){cells.push([y,x]);y+=dr*sign;x+=dc*sign;}}if(cells.length>=4){winner=piece;winning=cells;break;}}
 }return {board,winner,winning,draw:!winner&&moves.length===42,turn:moves.length%2};
}
export function gameState(g,now=Date.now()){const state=replay(g.moves);let status=g.status;if(status==='active')status=state.winner?'won':state.draw?'draw':now>=g.updatedAt+GAME_TTL?'expired':'active';else if(status==='invited'&&now>=g.updatedAt+GAME_TTL)status='expired';return {...state,status,winnerActor:state.winner?g.players[state.winner-1]:g.status==='resigned'?g.players.find(a=>a!==g.resignedBy):null};}
export function validateGames(d,actors){if(!Array.isArray(d.games))throw Error('Invalid games.');let last=0;for(const g of d.games){if(!Number.isSafeInteger(g.id)||g.id<=last||!Array.isArray(g.players)||g.players.length!==2||g.players[0]===g.players[1]||g.players.some(a=>!actors.includes(a))||!g.players.includes(g.inviter)||!['invited','active','declined','cancelled','resigned'].includes(g.status)||!Number.isFinite(g.at)||g.at<0||!Number.isFinite(g.updatedAt)||g.updatedAt<g.at)throw Error('Invalid game.');let time=g.at;for(const m of g.moves){if(!Number.isFinite(m.at)||m.at<time||m.at>g.updatedAt)throw Error('Invalid move time.');time=m.at;}const state=replay(g.moves);if(['invited','declined'].includes(g.status)&&g.moves.length||g.status==='resigned'&&(!g.players.includes(g.resignedBy)||state.winner||state.draw))throw Error('Invalid result.');last=g.id;}}
export function changeGame(d,actor,peer,op,extra,now){
 const blocked=d.blocks.some(b=>gPair(b.from,b.to)===gPair(actor,peer)),connected=d.requests.some(q=>gPair(q.from,q.to)===gPair(actor,peer)&&q.status==='accepted');if(blocked||!connected)throw Error('An accepted connection is required to play.');
 const games=d.games.filter(g=>g.players.includes(actor)&&g.players.includes(peer));
 if(op==='game-invite'){if(games.some(g=>['invited','active'].includes(gameState(g,now).status)))throw Error('Finish or cancel your existing match first.');let players=[actor,peer];if(extra.rematch!=null){const old=games.find(g=>g.id===extra.rematch);if(!old||!['won','draw','resigned','expired','declined','cancelled'].includes(gameState(old,now).status))throw Error('This match cannot be replayed yet.');players=[old.players[1],old.players[0]];}d.games.push({id:(d.games.at(-1)?.id??0)+1,players,inviter:actor,status:'invited',at:now,updatedAt:now,moves:[]});return;}
 const g=games.find(g=>g.id===extra.game);if(!g)throw Error('Match unavailable.');const state=gameState(g,now);
 if(op==='game-accept'||op==='game-decline'){if(state.status!=='invited'||g.inviter===actor)throw Error('Only the invited student can respond.');g.status=op==='game-accept'?'active':'declined';}
 else if(op==='game-cancel'){if(state.status!=='invited'||g.inviter!==actor)throw Error('Only the challenger can cancel a pending invitation.');g.status='cancelled';}
 else if(op==='game-move'){if(state.status!=='active'||g.players[state.turn]!==actor)throw Error('It is not your turn in an active match.');if(extra.expectedMoves!==g.moves.length)throw Error('The board changed. Reload before moving.');if(!Number.isInteger(extra.column)||extra.column<0||extra.column>6||state.board[0][extra.column])throw Error('Choose a column with space.');g.moves.push({column:extra.column,at:now});replay(g.moves);}
 else if(op==='game-resign'){if(state.status!=='active')throw Error('This match is not active.');g.status='resigned';g.resignedBy=actor;}
 else throw Error('Unknown game action.');g.updatedAt=now;
}
const gPair=(a,b)=>[a,b].sort().join(':');
export function cancelPairGames(d,a,b,now){for(const g of d.games)if(g.players.includes(a)&&g.players.includes(b)&&['active','invited'].includes(gameState(g,now).status)){g.status='cancelled';g.updatedAt=now;}}
