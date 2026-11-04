/**
 * The carrot-field game's screens (/game): the title with the story and how to play, the character choice, the farm notebook of lasting
 * upgrades, and the run itself — a canvas (src/game/render.ts) with the level-up, chest, shop, pause and result panels over it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_STATS, CHARACTERS, EVOLVE_PASSIVE_LEVEL, PASSIVES, POWERUPS, RUN_SECONDS, SHOPS, WEAPONS, WEAPON_MAX_LEVEL, powerUpCost, type CharId, type PassiveId, type ShopId, type WeaponId } from './content.ts';
import { Game, type ChestReward, type Choice, type RunResult } from './engine.ts';
import { render, type Stick } from './render.ts';
import { art, iconUrl, loadSprites, ROOT, type Sprites } from './sprites.ts';
import { loadMeta, metaBonus, saveMeta, type MetaSave } from './save.ts';
import { playSfx, unlockSfx } from './sfx.ts';
import { useSoundPref } from '../soundPref.ts';

declare global { interface Window { dataLayer?: unknown[] } }
/** Game events for Google Tag Manager (the same container as the book, index.html). */
function track(event:string,params:Record<string,string|number|boolean>={}){try{(window.dataLayer=window.dataLayer||[]).push({event,...params});}catch{ /* no GTM */ }}
const clock=(t:number)=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
type Screen='title'|'help'|'chars'|'notebook'|'play';
/** The particle that fits the word's last syllable: josa('장갑','과','와') → '장갑과'. `ro` treats a final ㄹ as no batchim (으로/로). */
function josa(word:string,withBatchim:string,without:string,ro=false){
 const code=word.charCodeAt(word.length-1)-0xac00;const last=code>=0&&code<11172?code%28:0;
 return word+(last&&!(ro&&last===8)?withBatchim:without);
}

export default function GameApp(){
 const [sprites,setSprites]=useState<Sprites|null>(null);
 const [meta,setMeta]=useState<MetaSave>(loadMeta);
 const [screen,setScreen]=useState<Screen>('title');
 const [char,setChar]=useState<CharId>('farmer');
 const [run,setRun]=useState(0);
 useEffect(()=>{void loadSprites().then(setSprites);},[]);
 const updateMeta=(next:MetaSave)=>{saveMeta(next);setMeta(next);};
 const start=()=>{unlockSfx();setRun(r=>r+1);setScreen('play');track('game_start',{game_char:char});};
 return <div className="gm-root">
  {screen==='title'&&<Title meta={meta} sprites={sprites} onStart={()=>{unlockSfx();setScreen('chars');}} onNotebook={()=>setScreen('notebook')} onHelp={()=>setScreen('help')}/>}
  {screen==='help'&&<Help sprites={sprites} onBack={()=>setScreen('title')}/>}
  {screen==='chars'&&<Chars sprites={sprites} char={char} setChar={setChar} onBack={()=>setScreen('title')} onStart={start}/>}
  {screen==='notebook'&&<Notebook meta={meta} update={updateMeta} onBack={()=>setScreen('title')}/>}
  {screen==='play'&&(sprites?<Play key={run} sprites={sprites} char={char} meta={meta}
   onEnd={result=>{const next:MetaSave={...meta,coins:meta.coins+result.coins,clears:meta.clears+(result.win?1:0),
     best:{time:Math.max(meta.best.time,result.time),kills:Math.max(meta.best.kills,result.kills),level:Math.max(meta.best.level,result.level)}};updateMeta(next);
     track('game_end',{game_char:result.char,game_win:result.win,game_time:Math.round(result.time),game_level:result.level,game_kills:result.kills});}}
   onRetry={start} onTitle={()=>setScreen('title')}/>:<div className="gm-loading">밭으로 가는 중…</div>)}
 </div>;
}

/** The main menu: the field painting behind, the title, and three equal buttons in the thumb's reach; leaving for the book sits apart. */
function Title({meta,sprites,onStart,onNotebook,onHelp}:{meta:MetaSave;sprites:Sprites|null;onStart:()=>void;onNotebook:()=>void;onHelp:()=>void}){
 return <main className="gm-title">
  <div className="gm-title-art" style={{backgroundImage:`url(${art('farm-back')})`}}/>
  <img className="gm-title-farmer" src={art('char-farmer')} alt=""/>
  <a className="gm-back" href={ROOT}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>팝업북</a>
  <div className="gm-title-logo">
   <h1>당근밭을<br/><span>지켜라</span></h1>
   <p>메뚜기 떼 서바이벌 · 한 판 10분</p>
  </div>
  <div className="gm-title-menu">
   {meta.best.time>0&&<p className="gm-best"><span>최고 기록</span><b>{clock(meta.best.time)}</b><span>Lv</span><b>{meta.best.level}</b><span>잡은 벌레</span><b>{meta.best.kills}</b></p>}
   <button className="gm-mbtn gm-mbtn-main" onClick={onStart} disabled={!sprites}><span>{sprites?'시작하기':'밭을 준비하는 중'}</span>{sprites&&<Chevron/>}</button>
   <button className="gm-mbtn" onClick={onNotebook}><span>농사 수첩</span><em>코인 {meta.coins}</em></button>
   <button className="gm-mbtn" onClick={onHelp}><span>하는 법 · 진화 조합</span><Chevron/></button>
  </div>
 </main>;
}
function Chevron(){return <svg className="gm-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>;}
function Help({sprites,onBack}:{sprites:Sprites|null;onBack:()=>void}){
 return <main className="gm-screen">
  <div className="gm-sheet gm-help">
   <div className="gm-head"><h2>하는 법</h2><button className="gm-text" onClick={onBack}>닫기</button></div>
   <dl>
    <dt>이동</dt><dd>방향키나 WASD. 휴대폰은 화면을 누른 채 끌어요. 공격은 저절로 나가요.</dd>
    <dt>레벨 업</dt><dd>메뚜기가 떨어뜨린 당근을 주우면 올라요. 새 무기나 강화를 하나 골라요. 무기와 도구는 5칸씩.</dd>
    <dt>짚단</dt><dd>부수면 당근 주스, 코인, 돌풍, 한파, 밤샘 랜턴이 나와요.</dd>
    <dt>가게</dt><dd>화면 가장자리 표시를 따라가면 소농로드, 마노아, 버거캐럿. 코인으로 회복하고 강화해요. 다녀오면 70초 쉬어요.</dd>
    <dt>당근 상자</dt><dd>장수메뚜기가 떨어뜨려요. 무기 {WEAPON_MAX_LEVEL}레벨과 짝 도구 {EVOLVE_PASSIVE_LEVEL}레벨을 갖추고 열면 진화해요.</dd>
    <dt>농사 수첩</dt><dd>남은 코인이 모여요. 영구 강화를 사요.</dd>
   </dl>
   <h3>진화 조합</h3>
   <EvolutionTree sprites={sprites}/>
  </div>
 </main>;
}
/** Every weapon's evolution: the weapon at its last level plus its paired passive, opened in a chest. During a run (`game`) each row shows how far
 *  the player has got, and the weapons they carry come first. */
function EvolutionTree({sprites,game}:{sprites:Sprites|null;game?:Game}){
 const rows=Object.values(WEAPONS).filter(w=>w.evolve).map(w=>{
  const e=w.evolve!,evolved=!!game?.hasWeapon(e.into),owned=game?.weapons.find(x=>x.id===w.id),passive=game?.passives.find(p=>p.id===e.with);
  const ready=!!owned&&owned.level>=WEAPON_MAX_LEVEL&&!!passive&&passive.level>=EVOLVE_PASSIVE_LEVEL;
  return {w,e,evolved,owned,passive,ready,rank:evolved?0:ready?1:owned?2:passive?3:4};
 });
 if(game)rows.sort((a,b)=>a.rank-b.rank);
 return <ul className="gm-evos">{rows.map(({w,e,evolved,owned,passive,ready})=><li key={w.id} className={evolved?'is-done':ready?'is-ready':''}>
  <span className={`gm-evo-part${game&&!owned&&!evolved?' is-missing':''}`}><img src={iconUrl(sprites,w.id)} alt=""/>{w.name}{game?<small>{evolved?'완료':owned?`Lv ${owned.level}/${WEAPON_MAX_LEVEL}`:'없음'}</small>:<small>{WEAPON_MAX_LEVEL}레벨</small>}</span>
  <span className="gm-evo-plus">+</span>
  <span className={`gm-evo-part${game&&!passive&&!evolved?' is-missing':''}`}><img src={iconUrl(sprites,e.with)} alt=""/>{PASSIVES[e.with].name}{game?<small>{evolved?'완료':passive?`Lv ${passive.level}/${EVOLVE_PASSIVE_LEVEL}`:'없음'}</small>:<small>{EVOLVE_PASSIVE_LEVEL}레벨</small>}</span>
  <span className="gm-evo-plus">→</span>
  <span className="gm-evo-part gm-evo-into"><img src={iconUrl(sprites,e.into)} alt=""/><b>{WEAPONS[e.into].name}</b>{game&&(evolved||ready)&&<small>{evolved?'진화함':'상자를 열면 진화!'}</small>}</span>
 </li>)}</ul>;
}

/** What a character starts with, as bars against the plain farmer stats (BASE_STATS). */
function charStats(c:typeof CHARACTERS[CharId]){
 const b=c.bonus;
 return [
  {label:'최대 체력',value:BASE_STATS.maxHp+(b.maxHp??0),max:150,text:String(BASE_STATS.maxHp+(b.maxHp??0)),up:!!b.maxHp},
  {label:'방어',value:b.armor??0,max:3,text:String(b.armor??0),up:!!b.armor},
  {label:'이동 속도',value:1+(b.moveSpeed??0),max:1.5,text:`${Math.round((1+(b.moveSpeed??0))*100)}%`,up:!!b.moveSpeed},
  {label:'줍는 거리',value:1+(b.magnet??0),max:1.6,text:`${Math.round((1+(b.magnet??0))*100)}%`,up:!!b.magnet},
 ];
}
/** Character select: the chosen one large on the field, the roster under it, what they start with, and the start button pinned at the bottom.
 *  ←/→ switch, Enter starts. */
function Chars({sprites,char,setChar,onBack,onStart}:{sprites:Sprites|null;char:CharId;setChar:(c:CharId)=>void;onBack:()=>void;onStart:()=>void}){
 const ids=Object.keys(CHARACTERS) as CharId[],c=CHARACTERS[char],weapon=WEAPONS[c.weapon];
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   const i=ids.indexOf(char);
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){setChar(ids[(i+(e.key==='ArrowRight'?1:ids.length-1))%ids.length]);e.preventDefault();}
   else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement))onStart();
   else if(e.key==='Escape')onBack();
  };
  window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 });
 return <main className="gm-select">
  <header className="gm-select-bar">
   <button className="gm-icon-btn" onClick={onBack} aria-label="뒤로"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg></button>
   <h2>캐릭터 선택</h2>
  </header>
  <section className="gm-stage" style={{backgroundImage:`url(${art('farm-back')})`}}>
   <img key={c.id} className="gm-stage-hero" src={art(c.img)} alt={c.name}/>
   <div className="gm-stage-name"><h3>{c.name}</h3></div>
  </section>
  <div className="gm-select-body">
   <div className="gm-roster" role="radiogroup" aria-label="캐릭터">{ids.map(id=>{const o=CHARACTERS[id];
    return <button key={id} role="radio" aria-checked={id===char} className="gm-portrait" onClick={()=>setChar(id)}>
     <span className="gm-portrait-img"><img src={art(o.img)} alt=""/></span><span className="gm-portrait-name">{o.name}</span>
    </button>;})}</div>
   <p className="gm-select-desc">{c.desc}</p>
   <div className="gm-weapon">
    <span className="gm-tile"><img src={iconUrl(sprites,c.weapon)} alt=""/></span>
    <span><small>시작 무기</small><b>{weapon.name}</b><span>{weapon.desc}</span></span>
   </div>
   <dl className="gm-statbars">{charStats(c).map(r=><div key={r.label}>
    <dt>{r.label}</dt><dd><span className="gm-statbar"><i className={r.up?'up':''} style={{width:`${Math.min(1,r.value/r.max)*100}%`}}/></span><b className={r.up?'up':''}>{r.text}</b></dd>
   </div>)}</dl>
  </div>
  <div className="gm-select-cta"><button className="gm-mbtn gm-mbtn-main" onClick={onStart}><span>{josa(c.name,'으로','로',true)} 시작</span><Chevron/></button></div>
 </main>;
}

function Notebook({meta,update,onBack}:{meta:MetaSave;update:(m:MetaSave)=>void;onBack:()=>void}){
 const spent=POWERUPS.reduce((sum,p)=>{let s=0;for(let l=0;l<(meta.power[p.id]??0);l++)s+=powerUpCost(p,l);return sum+s;},0);
 return <main className="gm-screen">
  <div className="gm-sheet">
   <div className="gm-head"><h2>농사 수첩</h2><span className="gm-figure">코인 {meta.coins}</span></div>
   <p className="gm-note">판이 끝나고 남은 코인으로 사는 영구 강화예요.</p>
   <ul className="gm-table">{POWERUPS.map(p=>{const level=meta.power[p.id]??0,cost=powerUpCost(p,level),maxed=level>=p.max;
    return <li key={p.id}>
     <span><b>{p.name}</b><small>{p.desc}</small></span>
     <span className="gm-pips" aria-label={`${level}/${p.max}`}>{Array.from({length:p.max},(_,i)=><i key={i} className={i<level?'on':''}/>)}</span>
     <button className="gm-buy" disabled={maxed||meta.coins<cost} onClick={()=>update({...meta,coins:meta.coins-cost,power:{...meta.power,[p.id]:level+1}})}>{maxed?'완료':cost}</button>
    </li>;})}</ul>
   <div className="gm-row">
    <button className="gm-btn" onClick={onBack}>뒤로</button>
    <button className="gm-text" disabled={!spent} onClick={()=>update({...meta,coins:meta.coins+spent,power:{}})}>모두 되돌리기{spent?` (+${spent})`:''}</button>
   </div>
  </div>
 </main>;
}

type Panel={kind:'levelup';choices:Choice[]}|{kind:'chest';rewards:ChestReward[]}|{kind:'shop';id:ShopId}|{kind:'end';result:RunResult}|null;
function Play({sprites,char,meta,onEnd,onRetry,onTitle}:{sprites:Sprites;char:CharId;meta:MetaSave;onEnd:(r:RunResult)=>void;onRetry:()=>void;onTitle:()=>void}){
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [panel,setPanel]=useState<Panel>(null);
 const [paused,setPaused]=useState<false|'bag'|'tree'>(false);
 const [,refresh]=useState(0);
 const ended=useRef(false);
 const game=useMemo(()=>new Game({char,meta:metaBonus(meta),events:{
  levelUp:choices=>setPanel({kind:'levelup',choices}),chest:rewards=>setPanel({kind:'chest',rewards}),shop:id=>setPanel({kind:'shop',id}),
  end:result=>{setPanel({kind:'end',result});if(!ended.current){ended.current=true;onEnd(result);}},sfx:playSfx}}),[]); // eslint-disable-line react-hooks/exhaustive-deps
 // Dev builds only: the running game on window.__game, to poke at from the console.
 useEffect(()=>{if(import.meta.env.DEV)(window as unknown as {__game?:Game}).__game=game;},[game]);
 const stick=useRef<Stick>({active:false,ox:0,oy:0,x:0,y:0});
 const keys=useRef(new Set<string>());
 const pause=(on:false|'bag'|'tree')=>{game.userPaused=!!on;setPaused(on);};

 useEffect(()=>{
  const canvas=canvasRef.current!,ctx=canvas.getContext('2d',{alpha:false})!;
  let raf=0,last=performance.now(),w=0,h=0,dpr=1;
  const size=()=>{dpr=Math.min(2,window.devicePixelRatio||1);w=canvas.clientWidth;h=canvas.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);};
  size();
  const frame=(now:number)=>{
   const dt=(now-last)/1000;last=now;
   if(canvas.clientWidth!==w||canvas.clientHeight!==h)size();
   const k=keys.current,s=stick.current;
   let ix=(k.has('ArrowRight')||k.has('KeyD')?1:0)-(k.has('ArrowLeft')||k.has('KeyA')?1:0),iy=(k.has('ArrowDown')||k.has('KeyS')?1:0)-(k.has('ArrowUp')||k.has('KeyW')?1:0);
   if(s.active){const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy);ix=d>6?dx/Math.max(d,40):0;iy=d>6?dy/Math.max(d,40):0;}
   game.input.x=ix;game.input.y=iy;
   game.update(dt);
   render(game,ctx,sprites,w,h,dpr,s);
   raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  const down=(e:KeyboardEvent)=>{
   if(e.code==='Escape'||e.code==='KeyP'){if(!game.modal)pause(game.userPaused?false:'bag');return;}
   if(e.code==='KeyE'&&!game.modal){pause(game.userPaused?false:'tree');return;}
   if(game.modal==='levelup'&&/^Digit[1-4]$/.test(e.code)){game.choose(Number(e.code.slice(5))-1);if(game.modal!=='levelup')setPanel(null);return;}
   keys.current.add(e.code);if(e.code.startsWith('Arrow'))e.preventDefault();
  };
  const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
  const hide=()=>{if(document.hidden&&!game.modal&&!game.over&&!game.userPaused)pause('bag');keys.current.clear();};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);document.addEventListener('visibilitychange',hide);window.addEventListener('blur',hide);
  return ()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',hide);};
 },[game,sprites]);

 const pointer={
  onPointerDown:(e:React.PointerEvent)=>{unlockSfx();if(game.modal||game.userPaused)return;(e.target as Element).setPointerCapture(e.pointerId);stick.current={active:true,ox:e.clientX,oy:e.clientY,x:e.clientX,y:e.clientY};},
  onPointerMove:(e:React.PointerEvent)=>{const s=stick.current;if(!s.active)return;s.x=e.clientX;s.y=e.clientY;
   // The base follows a thumb that drags far, so turning back is immediate.
   const dx=s.x-s.ox,dy=s.y-s.oy,d=Math.hypot(dx,dy);if(d>60){s.ox=s.x-dx/d*60;s.oy=s.y-dy/d*60;}},
  onPointerUp:()=>{stick.current.active=false;},onPointerCancel:()=>{stick.current.active=false;},
 };
 const close=()=>{setPanel(null);};
 return <div className="gm-play">
  <canvas ref={canvasRef} className="gm-canvas" {...pointer}/>
  <button className="gm-hudbtn gm-pause" onClick={()=>pause('bag')} aria-label="일시정지" disabled={!!panel}><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12"/><rect x="9.5" y="2" width="3.5" height="12"/></svg></button>
  <button className="gm-hudbtn gm-tree-btn" onClick={()=>pause('tree')} aria-label="진화 트리 보기" disabled={!!panel}>진화</button>
  {panel?.kind==='levelup'&&<LevelUp sprites={sprites} game={game} choices={panel.choices} pick={i=>{game.choose(i);if(game.modal!=='levelup')close();}}/>}
  {panel?.kind==='chest'&&<Chest sprites={sprites} rewards={panel.rewards} done={()=>{game.closeChest();close();}}/>}
  {panel?.kind==='shop'&&<Shop game={game} id={panel.id} refresh={()=>refresh(n=>n+1)} leave={()=>{game.leaveShop();close();}}/>}
  {panel?.kind==='end'&&<End sprites={sprites} result={panel.result} onRetry={onRetry} onTitle={onTitle}/>}
  {paused&&!panel&&<Pause sprites={sprites} game={game} tab={paused} setTab={pause} resume={()=>pause(false)} quit={()=>{pause(false);game.userPaused=false;game.player.hp=0;game.player.revivals=0;}}/>}
 </div>;
}

/** The level-up choices. Their evolution routes stay folded until the player opens them with the button under the list. */
function LevelUp({sprites,game,choices,pick}:{sprites:Sprites;game:Game;choices:Choice[];pick:(i:number)=>void}){
 const [routes,setRoutes]=useState(false);
 const hasRoute=choices.some(c=>c.kind==='weapon'?!!WEAPONS[c.id as WeaponId].evolve:c.kind==='passive'&&Object.values(WEAPONS).some(x=>x.evolve?.with===c.id));
 return <div className="gm-modal" role="dialog" aria-label="레벨 업">
  <div className="gm-panel">
   <div className="gm-head"><h2>레벨 업</h2><span className="gm-figure">Lv {game.level-game.pendingLevels+1}</span></div>
   <div className="gm-choices">{choices.map((c,i)=>{
    const w=c.kind==='weapon'?WEAPONS[c.id as WeaponId]:null,p=c.kind==='passive'?PASSIVES[c.id as PassiveId]:null;
    return <button key={c.id} className="gm-choice" onClick={()=>pick(i)}>
     <span className="gm-tile"><img src={iconUrl(sprites,c.kind==='heal'?'juice':c.kind==='coins'?'coin':c.id)} alt=""/></span>
     <span className="gm-choice-text">
      <span className="gm-choice-name">{c.name}{c.isNew?<small className="is-new">{w?'새 무기':'새 도구'}</small>:c.level?<small>Lv {c.level}</small>:null}</span>
      <span className="gm-choice-desc">{c.desc}</span>
      {c.isNew&&(w||p)&&<span className="gm-choice-story">{(w??p)!.story}</span>}
      {routes&&(w||p)&&<EvoRoute sprites={sprites} game={game} choice={c}/>}
     </span>
    </button>;})}</div>
   {hasRoute&&<button className="gm-route-toggle" onClick={()=>setRoutes(!routes)} aria-expanded={routes}>
    {routes?'진화 루트 접기':'진화 루트 보기'}<svg viewBox="0 0 16 16" aria-hidden="true"><path d={routes?'m3 10 5-5 5 5':'m3 6 5 5 5-5'}/></svg>
   </button>}
  </div>
 </div>;
}
/** Under a level-up choice: the evolution it leads to — weapon (its level after this pick) + paired passive → evolved weapon — and whether
 *  taking it makes that evolution ready for the next chest. */
function EvoRoute({sprites,game,choice}:{sprites:Sprites;game:Game;choice:Choice}){
 const route=choice.kind==='weapon'?WEAPONS[choice.id as WeaponId]:Object.values(WEAPONS).find(x=>x.evolve?.with===choice.id);
 const e=route?.evolve;if(!route||!e)return null;
 const weaponLevel=choice.kind==='weapon'?choice.level:game.weapons.find(x=>x.id===route.id)?.level??0;
 const passiveLevel=choice.kind==='passive'?choice.level:game.passives.find(x=>x.id===e.with)?.level??0;
 const hasPassive=passiveLevel>=EVOLVE_PASSIVE_LEVEL;
 const ready=weaponLevel>=WEAPON_MAX_LEVEL&&hasPassive;
 const part=(id:string,label:string,state:string,ok:boolean,current:boolean)=><span className={`gm-route-part${ok?'':' is-missing'}${current?' is-this':''}`}>
  <img src={iconUrl(sprites,id)} alt=""/>{label}<small>{state}</small></span>;
 return <span className={`gm-route${ready?' is-ready':''}`}>
  {part(route.id,route.name,weaponLevel?`Lv ${weaponLevel}/${WEAPON_MAX_LEVEL}`:'없음',weaponLevel>=WEAPON_MAX_LEVEL,choice.kind==='weapon')}
  <i>+</i>
  {part(e.with,PASSIVES[e.with].name,passiveLevel?`Lv ${Math.min(passiveLevel,EVOLVE_PASSIVE_LEVEL)}/${EVOLVE_PASSIVE_LEVEL}`:'필요',hasPassive,choice.kind==='passive')}
  <i>→</i>
  <span className="gm-route-part gm-route-into"><img src={iconUrl(sprites,e.into)} alt=""/>{WEAPONS[e.into].name}</span>
  {ready&&<em>고르면 진화 준비 완료 · 다음 당근 상자에서 진화</em>}
 </span>;
}
function Chest({sprites,rewards,done}:{sprites:Sprites;rewards:ChestReward[];done:()=>void}){
 const evo=rewards.find(r=>r.kind==='evolve');
 return <div className="gm-modal" role="dialog" aria-label="당근 상자">
  <div className="gm-panel">
   <img className="gm-chest-img" src={art('farm-crate')} alt=""/>
   <div className="gm-head"><h2>{evo?`${josa(evo.name,'으로','로',true)} 진화`:'당근 상자'}</h2></div>
   <ul className="gm-rewards">{rewards.map((r,i)=><li key={i} className={r.kind==='evolve'?'is-evo':''}><img src={iconUrl(sprites,r.kind==='coins'?'coin':r.id)} alt=""/><b>{r.name}</b><span>{r.desc}</span></li>)}</ul>
   <div className="gm-row"><button className="gm-btn gm-primary" onClick={done} autoFocus>받기</button></div>
  </div>
 </div>;
}
function Shop({game,id,refresh,leave}:{game:Game;id:ShopId;refresh:()=>void;leave:()=>void}){
 const s=SHOPS[id];const [receipt,setReceipt]=useState('');
 const hp=Math.round(game.player.hp),max=game.stats.maxHp;
 return <div className="gm-modal" role="dialog" aria-label={s.name}>
  <div className="gm-panel gm-shop" style={{['--shop' as string]:s.color}}>
   <div className="gm-shop-head"><img src={art(s.img)} alt=""/><div><h2>{s.name}</h2><p>{s.tagline}</p>
    <p className="gm-shop-status">체력 {hp}/{max} · 코인 {game.coins}</p></div></div>
   <div className="gm-items">{s.items.map(item=>{const why=game.cannotBuy(id,item),price=game.price(id,item);
    return <button key={item.id} className="gm-item" disabled={!!why} onClick={()=>{const r=game.buy(id,item.id);if(r)setReceipt(r);refresh();}}>
     <span className="gm-item-name">{item.name}</span><span className="gm-item-desc">{item.desc}</span>
     <span className="gm-item-price">{why&&why!=='코인이 모자라요'?why:price}</span>
    </button>;})}</div>
   {receipt&&<p className="gm-receipt" aria-live="polite">{receipt}</p>}
   <button className="gm-btn gm-primary" onClick={leave}>가게 나서기</button>
  </div>
 </div>;
}
function Build({sprites,game}:{sprites:Sprites;game:Game}){
 return <ul className="gm-build">
  {game.weapons.map(w=><li key={w.id}><img src={iconUrl(sprites,w.id)} alt=""/><b>{WEAPONS[w.id].name}</b><span>{WEAPONS[w.id].evolved?'진화':`Lv ${w.level}`}</span></li>)}
  {game.passives.map(p=><li key={p.id}><img src={iconUrl(sprites,p.id)} alt=""/><b>{PASSIVES[p.id].name}</b><span>Lv {p.level}</span></li>)}
 </ul>;
}
function Pause({sprites,game,tab,setTab,resume,quit}:{sprites:Sprites;game:Game;tab:'bag'|'tree';setTab:(t:'bag'|'tree')=>void;resume:()=>void;quit:()=>void}){
 const sound=useSoundPref();
 return <div className="gm-modal" role="dialog" aria-label="일시정지">
  <div className="gm-panel">
   <div className="gm-head"><h2>일시정지</h2><span className="gm-figure">{clock(game.time)}</span></div>
   <p className="gm-note">Lv {game.level} · {game.kills}마리 · 코인 {game.coins}</p>
   <div className="gm-tabs" role="tablist">
    <button role="tab" aria-selected={tab==='bag'} onClick={()=>setTab('bag')}>가진 것</button>
    <button role="tab" aria-selected={tab==='tree'} onClick={()=>setTab('tree')}>진화 트리</button>
   </div>
   {tab==='bag'?<Build sprites={sprites} game={game}/>:<EvolutionTree sprites={sprites} game={game}/>}
   <div className="gm-row">
    <button className="gm-btn gm-primary" onClick={resume} autoFocus>계속</button>
    <button className="gm-btn" onClick={()=>sound.setOn(!sound.on)} aria-pressed={sound.on}>소리 {sound.on?'끄기':'켜기'}</button>
    <button className="gm-text" onClick={quit}>그만하기</button>
   </div>
  </div>
 </div>;
}
function End({sprites,result,onRetry,onTitle}:{sprites:Sprites;result:RunResult;onRetry:()=>void;onTitle:()=>void}){
 const top=Math.max(1,...result.weapons.map(w=>w.damage));
 return <div className="gm-modal" role="dialog" aria-label="결과">
  <div className="gm-panel">
   <div className="gm-head"><h2>{result.win?'이번 철 수확은 지켰어요':'밭을 내줬어요'}</h2></div>
   <dl className="gm-stats"><div><dt>버틴 시간</dt><dd>{clock(result.time)}</dd></div><div><dt>레벨</dt><dd>{result.level}</dd></div><div><dt>잡은 벌레</dt><dd>{result.kills}</dd></div><div><dt>수첩으로 간 코인</dt><dd>{result.coins}</dd></div></dl>
   <ul className="gm-damage">{result.weapons.map(w=><li key={w.id}><img src={iconUrl(sprites,w.id)} alt=""/><b>{WEAPONS[w.id].name}</b><span className="gm-bar"><i style={{width:`${w.damage/top*100}%`}}/></span><span>{w.damage.toLocaleString()}</span></li>)}</ul>
   <div className="gm-row"><button className="gm-btn gm-primary" onClick={onRetry} autoFocus>다시</button><button className="gm-btn" onClick={onTitle}>처음으로</button></div>
   {/* Back to the pop-up book, where the farmer's and the shops' real stories are. */}
   <a className="gm-booklink" href={ROOT} onClick={()=>track('game_book_link',{game_win:result.win})}>
    <img src={art('char-farmer')} alt=""/>
    <span><small>구좌 당근, 몬딱 담았수다</small><b>농부님과 세 가게의 진짜 이야기 보러 가기</b></span>
    <Chevron/>
   </a>
  </div>
 </div>;
}
