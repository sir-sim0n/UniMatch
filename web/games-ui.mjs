import {gameState,gameKind,gameTitle} from './games-core.mjs?v=1.11.0';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,fn)=>{const b=el('button',text,'secondary');b.type='button';b.onclick=fn;return b;};
export function renderGames({panel,repository,actor,target,name,connected,refresh,announce,cleanup}){
 const section=el('section',undefined,'message-games');section.setAttribute('aria-label','Conversation games');section.append(el('h3','Play together'),el('p','Challenge a friend. Turns and results are saved on this device. Switch demo accounts to play the other side.','hint'));
 const error=el('p','','error');error.setAttribute('role','alert');section.append(error);const games=repository.games(actor,target);
 const act=async(op,extra={})=>{const buttons=[...section.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);try{await repository.change(actor,op,target,extra);await refresh();announce('Game saved. Switch demo accounts for the other player’s turn.');}catch(e){error.textContent=e.message;buttons.forEach(([b,disabled])=>b.disabled=disabled);}};
 if(connected&&!games.some(g=>['invited','active'].includes(gameState(g).status)))section.append(button('Challenge to Four in a Row',()=>act('game-invite',{kind:'four'})),button('Challenge to Dots and Boxes',()=>act('game-invite',{kind:'dots'})));
 for(const g of [...games].reverse()){const state=gameState(g),card=el('details',undefined,'game-card');card.open=['invited','active'].includes(state.status);card.append(el('summary',`${gameTitle(g)} · Match ${g.id} · ${state.status}`));
 const status=el('p','','game-status');status.setAttribute('role','status');const describe=()=>{const s=gameState(g);status.textContent=s.status==='invited'?`${name(g.inviter)} sent a challenge. Waiting for ${name(g.players.find(p=>p!==g.inviter))}.`:s.status==='active'?(g.players[s.turn]===actor?'Your turn':`Waiting for ${name(g.players[s.turn])}`):s.winnerActor?`${name(s.winnerActor)} wins${s.status==='resigned'?' by resignation':''}!`:s.status==='draw'?'It’s a draw!':s.status==='expired'?'This match expired after seven days without activity.':s.status==='cancelled'?'This match was cancelled.':'Challenge declined.';return s;};describe();card.append(status,el('p',`● ${name(g.players[0])} · ◆ ${name(g.players[1])}`,'hint'));
 if(state.status==='invited'&&connected){if(g.inviter===actor)card.append(button(`Cancel challenge ${g.id}`,()=>act('game-cancel',{game:g.id})));else card.append(button(`Accept challenge ${g.id}`,()=>act('game-accept',{game:g.id})),button(`Decline challenge ${g.id}`,()=>act('game-decline',{game:g.id})));}
 if(state.status==='invited'){const timer=setInterval(()=>{if(describe().status==='expired')card.querySelectorAll('button').forEach(b=>b.disabled=true);},30000);cleanup.push(()=>clearInterval(timer));}
 if(gameKind(g)==='dots')card.append(el('p','Join adjacent dots. Complete a box to claim it and take another turn. Most boxes wins.','hint'));
 if(state.status!=='invited'&&state.status!=='declined'){
 const columns=[];if(gameKind(g)==='dots'){
 card.append(el('p',`${name(g.players[0])}: ${state.scores[0]} boxes · ${name(g.players[1])}: ${state.scores[1]} boxes`,'game-score'));
 const grid=el('div',undefined,'dots-board');grid.setAttribute('role','group');grid.setAttribute('aria-label',`Dots and Boxes match ${g.id}, three by three boxes`);
 for(let y=0;y<7;y++)for(let x=0;x<7;x++){
 if(y%2===0&&x%2===0){const dot=el('span','•','dots-dot');dot.setAttribute('aria-hidden','true');grid.append(dot);}
 else if(y%2&&x%2){const owner=state.boxes[Math.floor(y/2)*3+Math.floor(x/2)],box=el('span',owner===1?'●':owner===2?'◆':'',`dots-box player-${owner}`);box.setAttribute('role','img');box.setAttribute('aria-label',`Box ${Math.floor(y/2)+1}, ${Math.floor(x/2)+1}: ${owner?name(g.players[owner-1]):'unclaimed'}`);grid.append(box);}
 else{const horizontal=y%2===0,edge=horizontal?(y/2)*3+Math.floor(x/2):12+Math.floor(y/2)*4+x/2,b=button(horizontal?'━':'┃',()=>act('game-move',{game:g.id,edge,expectedMoves:g.moves.length}));b.className=`dots-edge ${horizontal?'horizontal':'vertical'} ${state.edges[edge]?'drawn':''}`;b.setAttribute('aria-label',`${horizontal?'Horizontal':'Vertical'} edge row ${Math.floor(y/2)+1}, column ${Math.floor(x/2)+1}${state.edges[edge]?' drawn':''}`);b.disabled=!connected||state.status!=='active'||g.players[state.turn]!==actor||!!state.edges[edge];columns.push(b);grid.append(b);}}card.append(grid);
 }else{
 const board=el('div',undefined,'four-board');board.setAttribute('role','group');board.setAttribute('aria-label',`Match ${g.id} board, six rows and seven columns`);
 for(let col=0;col<7;col++){const b=button(`↓ ${col+1}`,()=>act('game-move',{game:g.id,column:col,expectedMoves:g.moves.length}));b.setAttribute('aria-label',`Drop disc in column ${col+1} for match ${g.id}`);b.disabled=!connected||state.status!=='active'||g.players[state.turn]!==actor||!!state.board[0][col];columns.push(b);board.append(b);}
 for(let row=0;row<6;row++)for(let col=0;col<7;col++){const piece=state.board[row][col],cell=el('span',piece===1?'●':piece===2?'◆':'·',`four-cell player-${piece}`);if(state.winning.some(([y,x])=>y===row&&x===col))cell.classList.add('winning');cell.setAttribute('role','img');cell.setAttribute('aria-label',`Row ${row+1}, column ${col+1}: ${piece?name(g.players[piece-1]):'empty'}`);board.append(cell);}card.append(board);}
 if(state.status==='active'&&connected)card.append(button(`Resign match ${g.id}`,()=>{const dialog=el('dialog');dialog.setAttribute('aria-label','Resign match');dialog.append(el('h2','Resign this match?'),el('p','Your opponent will win. You can invite them to a rematch.'),button('Keep playing',()=>dialog.close()),button('Resign',()=>{dialog.close();act('game-resign',{game:g.id});}));dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();}));
 const timer=setInterval(()=>{const s=describe();if(s.status!=='active')columns.forEach(b=>b.disabled=true);},30000);cleanup.push(()=>clearInterval(timer));
 }
 if(connected&&!['active','invited'].includes(state.status)&&!games.some(x=>['active','invited'].includes(gameState(x).status)))card.append(button(`Rematch ${g.id}`,()=>act('game-invite',{rematch:g.id})));
 card.append(el('p',`${g.moves.length} moves · Updated ${new Date(g.updatedAt).toLocaleString()} · Seven-day inactivity limit`,'hint'));section.append(card);
 }
 panel.append(section);
}
