import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Play, X } from 'lucide-react';
import { track } from './analytics';
import { useT } from './i18n';
import { posterSrc, posters, shortsEmbed, shortsThumb, shortsUrl } from './posters';
import { measureShort, measuredEmbed } from './youtube';
import { CATEGORIES, INGREDIENTS, MEALS, PONY, POSTER_OF, PREFS, PREF_LABEL, RECIPES, evaluate, evaluateAll, findRecipe, frequentIds, idsInCategory,
 useFridge, zineView, type Recipe, type Verdict } from './zine';
import './fridge.css';

/**
 * The fridge on the third spread, opened: every carrot recipe of the team's 3D-character webzine (src/zine.ts), drawn as a page of the book
 * (cream paper, hand-lettered headings like the recipe posters). The left page names it, holds the pony, the two ways in (all 15 recipes,
 * or "what's in your fridge?") and the list's filters; the right page shows the list, one recipe, or the planner. On phones the two run on
 * as one page that scrolls.
 * Its views are the webzine's pages, kept as the story part of the link (#recipes/recipes, #recipes/recipe-<id>, #recipes/planner): moving
 * between them goes through `onOpen`, so the address and the back-link follow, and the book stays up (App keeps one FridgeBook mounted).
 * The planner and each recipe's ingredient list share one fridge, kept in this browser (useFridge). The three recipes made for real keep
 * their Shorts (a still until pressed, as in src/PosterBook.tsx); the three with a hand-drawn poster show it as their 만드는 법.
 */
export default function FridgeBook({id,onClose,onOpen}:{id:string;onClose:()=>void;onOpen:(id:string)=>void}){
 const {t}=useT();const view=zineView(id);
 const [open,setOpen]=useState(false);const closing=useRef(0);const page=useRef<HTMLElement>(null);const heading=useRef<HTMLHeadingElement>(null);
 const meal=useFridge(s=>s.meal),pref=useFridge(s=>s.pref),setFridge=useFridge(s=>s.set);
 // Mounted lying back, then raised on the next frame so the transition runs; closing lowers it again before it goes.
 useEffect(()=>{const frame=requestAnimationFrame(()=>setOpen(true));return()=>{cancelAnimationFrame(frame);window.clearTimeout(closing.current);};},[]);
 useEffect(()=>{if(open)heading.current?.focus({preventScroll:true});},[open]);
 // Each view starts at its top (on phones the whole sheet scrolls, on wide screens the right page).
 useEffect(()=>{page.current?.scrollTo({top:0});page.current?.closest('.fb-sheet')?.scrollTo({top:0});},[id]);
 useEffect(()=>{if(view?.kind==='recipe')track('recipe_view',{recipe_id:view.recipe.id,source_type:view.recipe.source});},[id]);
 const close=()=>{setOpen(false);closing.current=window.setTimeout(onClose,matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);};
 // Escape closes; the arrow keys stay here instead of turning the pop-up book's pages behind it.
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.key==='Escape'){e.stopPropagation();close();}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft')e.stopPropagation();
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);});
 if(!view)return null;
 const tab=view.kind==='planner'?'planner':'recipes';
 const filter=(kind:'meal'|'pref',value:string)=>{setFridge(kind==='meal'?{meal:value}:{pref:value});track('recipe_filter',{filter_type:kind,filter_value:value});if(view.kind!=='recipes')onOpen('recipes');};
 // Only the X (or Escape) closes it: a tap beside the page used to close it too, and readers lost their place by accident.
 return <div className={'detail-book-backdrop'+(open?' is-open':'')}>
  <div className="fridge-book" role="dialog" aria-modal="true" aria-labelledby="fb-title">
   <button className="wz-close" onClick={close} aria-label={t('책 닫기')}><X size={20}/></button>
   <article className="fb-sheet">
    <aside className="fb-side" aria-label={t('왼쪽 쪽')}>
     <p className="fb-kicker">03 · MENU &amp; RECIPE</p>
     <h2 id="fb-title" ref={heading} tabIndex={-1}><span className="fb-mark">{t('구좌 당근')}</span><br/>{t('냉장고 레시피')}</h2>
     <div className="fb-hello"><img className="fb-pony" src={PONY} alt="" width={320} height={400} decoding="async" draggable={false}/>
      <p>{t('당근 요리 15가지,')}<br/>{t('냉장고 재료로도 찾아요.')}</p></div>
     <div className="fb-tabs" role="tablist" aria-label={t('레시피 보기 방식')}>
      <button type="button" role="tab" aria-selected={tab==='recipes'} onClick={()=>onOpen('recipes')}>{t('레시피 15가지')}</button>
      <button type="button" role="tab" aria-selected={tab==='planner'} onClick={()=>onOpen('planner')}>{t('냉장고 재료로 찾기')}</button>
     </div>
     {tab==='recipes'&&<div className="fb-filters">
      <p>{t('어떤 요리를 찾으세요?')}</p>
      <div className="fb-chips">{[['all','모두'],...Object.entries(MEALS)].map(([value,label])=><button key={value} type="button" aria-pressed={meal===value} onClick={()=>filter('meal',value)}>{t(label)}</button>)}</div>
      <p>{t('어떤 맛을 찾으세요?')}</p>
      <div className="fb-chips">{PREFS.map(p=><button key={p.id} type="button" aria-pressed={pref===p.id} onClick={()=>filter('pref',p.id)}>{t(p.label)}</button>)}</div>
     </div>}
     <button type="button" className="fb-share" onClick={()=>onOpen('recipe-share')}><span>{t('우리 집 당근 요리가 있나요?')}</span>{t('나만의 레시피 보내기')}<ArrowRight size={16}/></button>
    </aside>
    <main className="fb-page" ref={page} aria-label={t('오른쪽 쪽')}>
     {view.kind==='recipes'&&<RecipeList meal={meal} pref={pref} onOpen={onOpen}/>}
     {view.kind==='planner'&&<Planner onOpen={onOpen}/>}
     {view.kind==='recipe'&&<RecipePage recipe={view.recipe} onOpen={onOpen}/>}
     {/* On phones the call for recipes comes after the recipes, not before them. */}
     <button type="button" className="fb-share is-foot" onClick={()=>onOpen('recipe-share')}><span>{t('우리 집 당근 요리가 있나요?')}</span>{t('나만의 레시피 보내기')}<ArrowRight size={16}/></button>
    </main>
   </article>
  </div>
 </div>;
}

/** A recipe as a card: its photo as a polaroid, the name, one line, its kind and taste. */
function RecipeCard({recipe,onOpen,note}:{recipe:Recipe;onOpen:(id:string)=>void;note?:React.ReactNode}){
 const {t}=useT();
 return <li><button type="button" className="fb-card" onClick={()=>onOpen('recipe-'+recipe.id)}>
  <span className="fb-photo"><img src={recipe.photo} alt="" width={recipe.photoW} height={recipe.photoH} loading="lazy" decoding="async" draggable={false}/></span>
  <span className="fb-card-text"><strong>{t(recipe.name)}</strong><span className="fb-card-desc">{t(recipe.desc)}</span>
   <span className="fb-tags"><em>{t(MEALS[recipe.meal])}</em>{recipe.tags.map(tag=><em key={tag} className="is-taste">{t(PREF_LABEL[tag])}</em>)}{recipe.source==='original'&&<em className="is-made">{t('직접 만든')}</em>}</span>
   {note}</span>
 </button></li>;
}

function RecipeList({meal,pref,onOpen}:{meal:string;pref:string;onOpen:(id:string)=>void}){
 const {t}=useT();
 const shown=RECIPES.filter(recipe=>(meal==='all'||recipe.meal===meal)&&(pref==='all'||recipe.tags.includes(pref)));
 return <section className="fb-list">
  <header className="fb-head"><h3>{t('당근으로 무엇을 만들어볼까요?')}</h3><p>{t('15가지 중')} {shown.length}{t('가지')}</p></header>
  {shown.length?<ul className="fb-cards">{shown.map(recipe=><RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen}/>)}</ul>
   :<p className="fb-empty">{t('고른 조건에 맞는 요리가 없어요. 다른 맛이나 종류를 골라 보세요.')}</p>}
 </section>;
}

/** "What's in your fridge?": the reader ticks what they have, then sees what they can make now, what is one or two short, and the rest. */
function Planner({onOpen}:{onOpen:(id:string)=>void}){
 const {t}=useT();
 const fridge=useFridge(s=>s.fridge),toggle=useFridge(s=>s.toggle),clear=useFridge(s=>s.clear),searched=useFridge(s=>s.searched),setFridge=useFridge(s=>s.set);
 const [cheer,setCheer]=useState(0);const results=useRef<HTMLDivElement>(null);
 const frequent=useMemo(()=>frequentIds(8),[]);
 const verdicts=useMemo(()=>evaluateAll(fridge),[fridge]);
 const groups={ready:verdicts.filter(v=>v.group==='ready'),almost:verdicts.filter(v=>v.group==='almost'),other:verdicts.filter(v=>v.group==='other')};
 const search=()=>{setFridge({searched:true});setCheer(n=>n+1);
  track('fridge_search',{ingredient_count:fridge.length,ready_count:groups.ready.length,almost_count:groups.almost.length});
  requestAnimationFrame(()=>results.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));};
 const chip=(id:string)=><button key={id} type="button" aria-pressed={fridge.includes(id)} onClick={()=>toggle(id)}>{fridge.includes(id)&&<Check size={13} strokeWidth={3}/>}{t(INGREDIENTS[id].name)}</button>;
 const missingLine=(v:Verdict)=><span className="fb-missing">{t('없는 재료')}: {v.missing.map(id=>t(INGREDIENTS[id].name)).join(', ')}</span>;
 return <section className="fb-planner">
  <header className="fb-head"><h3>{t('냉장고에 뭐가 있나요?')}</h3><p>{t('있는 재료를 골라 보세요. 오늘 만들 수 있는 당근 요리를 찾아 드릴게요.')}</p></header>
  <div className="fb-picked"><span>{fridge.length?<>{t('고른 재료')} <b>{fridge.length}</b>{t('개')}</>:t('아직 고른 재료가 없어요.')}</span>{fridge.length>0&&<button type="button" onClick={()=>{clear();track('fridge_clear');}}>{t('모두 지우기')}</button>}</div>
  <div className="fb-pantry">
   <p className="fb-label">{t('자주 쓰는 재료')}</p><div className="fb-chips">{frequent.map(chip)}</div>
   {CATEGORIES.filter(c=>!c.basic).map(c=>{const ids=idsInCategory(c.id).filter(id=>!frequent.includes(id));return ids.length>0&&<details key={c.id} className="fb-cat">
    <summary>{t(c.name)}<span>{ids.length}{t('개')}</span><ChevronDown size={16}/></summary><div className="fb-chips">{ids.map(chip)}</div></details>;})}
   <div className="fb-basic"><p className="fb-label">{t('기본 양념')}<small>{t('자동으로 있다고 보지 않아요')}</small></p><div className="fb-chips">{idsInCategory('season').map(chip)}</div></div>
  </div>
  <button type="button" className="fb-go" onClick={search}>{t('만들 수 있는 요리 보기')}<ArrowRight size={18}/></button>
  <div ref={results} className="fb-results">
   {searched&&(fridge.length===0?<p className="fb-empty">{t('먼저 재료를 골라 주세요. 기본 양념도 따로 체크해야 해요.')}</p>:<>
    <div className="fb-result-head"><img key={cheer} className="fb-pony is-cheer" src={PONY} alt="" width={320} height={400} decoding="async" draggable={false}/><h3>{t('이런 요리를 만들 수 있어요')}</h3></div>
    <h4><b>①</b> {t('지금 만들 수 있어요')}</h4>
    {groups.ready.length?<ul className="fb-cards is-compact">{groups.ready.map(v=><RecipeCard key={v.recipe.id} recipe={v.recipe} onOpen={onOpen}/>)}</ul>
     :<p className="fb-empty">{t('재료를 조금 더 고르거나, 부족한 재료가 적은 요리를 확인해 보세요.')}</p>}
    {groups.almost.length>0&&<><h4><b>②</b> {t('재료 1~2개만 더 있으면 돼요')}</h4>
     <ul className="fb-cards is-compact">{groups.almost.map(v=><RecipeCard key={v.recipe.id} recipe={v.recipe} onOpen={onOpen} note={missingLine(v)}/>)}</ul></>}
    {groups.other.length>0&&<details className="fb-more"><summary><b>③</b> {t('다른 당근 요리도 둘러보기')} ({groups.other.length})<ChevronDown size={16}/></summary>
     <ul className="fb-cards is-compact">{groups.other.map(v=><RecipeCard key={v.recipe.id} recipe={v.recipe} onOpen={onOpen} note={missingLine(v)}/>)}</ul></details>}
   </>)}
  </div>
 </section>;
}

function RecipePage({recipe,onOpen}:{recipe:Recipe;onOpen:(id:string)=>void}){
 const {t,lang}=useT();
 const fridge=useFridge(s=>s.fridge),toggle=useFridge(s=>s.toggle);const verdict=evaluate(recipe,fridge);
 // A dish with a hand-drawn recipe (src/posters.ts) shows it as its 만드는 법, in the reader's language; 글로만 보기 switches to the steps as text.
 const poster=POSTER_OF[recipe.id]?posters[POSTER_OF[recipe.id]]:undefined;const [textOnly,setTextOnly]=useState(false);
 const [playing,setPlaying]=useState(false);const player=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{setPlaying(false);setTextOnly(false);},[recipe.id]);
 useEffect(()=>{const frame=player.current;if(!playing||!frame||!recipe.video)return;return measureShort(frame,{videoId:recipe.video.id,title:recipe.video.title,contentId:'recipe-'+recipe.id});},[playing,recipe]);
 const seen=new Set<string>();
 return <section className="fb-recipe">
  <button type="button" className="fb-back" onClick={()=>onOpen('recipes')}><ArrowLeft size={16}/>{t('레시피 15가지')}</button>
  <div className="fb-recipe-top">
   <figure className="fb-polaroid"><img src={recipe.photo} alt={t(recipe.name)} width={recipe.photoW} height={recipe.photoH} decoding="async" draggable={false}/><figcaption>{t(recipe.name)}</figcaption></figure>
   <div className="fb-recipe-intro">
    <p className="fb-tags"><em>{t(MEALS[recipe.meal])}</em>{recipe.tags.map(tag=><em key={tag} className="is-taste">{t(PREF_LABEL[tag])}</em>)}{recipe.source==='draft'?<em className="is-new">{t('새 레시피')}</em>:<em className="is-made">{t('직접 만든')}</em>}</p>
    <h3>{t(recipe.name)}</h3><p>{t(recipe.desc)}</p>
    <p className="fb-meta">{t('분량')} {t(recipe.servings)} · {t('필수 재료')} {verdict.required.length}{t('가지')}{recipe.video?<> · {t('영상')} {recipe.video.duration}</>:null}</p>
    {fridge.length===0?<p className="fb-verdict">{t('있는 재료에 체크하면, 없는 재료를 바로 알려 드려요.')}</p>
     :<p className={'fb-verdict is-'+verdict.group}>{verdict.missing.length===0?t('지금 만들 수 있어요'):<>{t('없는 재료')} {verdict.missing.length}{t('개')}: {verdict.missing.map(id=>t(INGREDIENTS[id].name)).join(', ')}</>}</p>}
   </div>
  </div>
  <h4>{t('필요한 재료와 분량')}</h4>
  <p className="fb-note">{t('있는 재료에 체크하면 냉장고 목록에 저장돼요. ‘선택’ 재료는 없어도 만들 수 있어요.')}</p>
  <ul className="fb-ingredients">{recipe.ingredients.map((ing,i)=>{
   const counts=INGREDIENTS[ing.id]?.count!==false,have=counts&&(fridge.includes(ing.id)||!!verdict.via[ing.id]),first=!seen.has(ing.id);seen.add(ing.id);
   // Marked missing only once the reader has ticked something: an empty fridge would flag every line.
   const missing=fridge.length>0&&ing.req&&counts&&!have;
   return <li key={i} className={missing?'is-missing':''}>
    {counts&&first?<label><input type="checkbox" checked={fridge.includes(ing.id)} onChange={()=>toggle(ing.id)}/><span>{t(ing.label)}</span></label>:<span className="fb-ing-name">{t(ing.label)}</span>}
    {!ing.req&&<em>{t('선택')}</em>}{missing&&first&&<em className="is-missing">{t('없음')}</em>}{verdict.via[ing.id]&&first&&<em>{t(INGREDIENTS[verdict.via[ing.id]].name)} {t('대신')}</em>}
    <span className="fb-qty">{t(ing.qty)}</span></li>;})}
  </ul>
  <h4 className="fb-steps-head">{t('만드는 법')}{poster&&<button type="button" className="fb-view" aria-pressed={textOnly} onClick={()=>setTextOnly(v=>!v)}>{textOnly?t('그림으로 보기'):t('글로만 보기')}</button>}</h4>
  {poster&&!textOnly?<figure className="fb-steps-poster"><img src={posterSrc(poster,lang)} alt={t(recipe.name)+' — '+t('그림 레시피')} width={1024} height={1536} loading="lazy" decoding="async" draggable={false}/></figure>
   :<ol className="fb-steps">{recipe.steps.map((step,i)=><li key={i}><b>{i+1}</b><span>{t(step)}</span></li>)}</ol>}
  {recipe.tip&&(!poster||textOnly)&&<p className="fb-tip"><strong>{t('팁')}</strong> {t(recipe.tip)}</p>}
  {recipe.video&&<><h4>{t('영상으로 보기')} <small>{recipe.video.duration}</small></h4>
   <figure className="fb-video"><div className="pb-shorts-frame">
    {playing?<iframe ref={player} src={measuredEmbed(shortsEmbed(recipe.video.id))} title={`${recipe.video.title} — YouTube Shorts`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
     :<button type="button" className="pb-shorts-cover" onClick={()=>{setPlaying(true);track('shorts_play',{story:'recipe-'+recipe.id});}} aria-label={t('쇼츠로 만드는 과정 보기')}>
      <img src={shortsThumb(recipe.video.id)} alt="" decoding="async" draggable={false}/><span className="pb-shorts-tag">Shorts</span><span className="pb-play" aria-hidden="true"><Play size={26} fill="currentColor"/></span></button>}
   </div><figcaption><a href={shortsUrl(recipe.video.id)} target="_blank" rel="noopener" referrerPolicy="strict-origin-when-cross-origin" onClick={()=>track('shorts_open',{story:'recipe-'+recipe.id})}>{t('YouTube에서 보기')}<ArrowUpRight size={13}/></a></figcaption></figure></>}
  {recipe.related.length>0&&<><h4>{t('이어서 읽기')}</h4><ul className="fb-cards is-compact">{recipe.related.map(findRecipe).filter((r):r is Recipe=>!!r).map(r=><RecipeCard key={r.id} recipe={r} onOpen={onOpen}/>)}</ul></>}
  <div className="fb-recipe-foot"><button type="button" className="fb-back" onClick={()=>onOpen('recipes')}><ArrowLeft size={16}/>{t('레시피 목록으로')}</button><button type="button" className="fb-back" onClick={()=>onOpen('planner')}>{t('냉장고 재료로 다시 찾기')}<ArrowRight size={16}/></button></div>
 </section>;
}
