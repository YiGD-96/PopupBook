import { create } from 'zustand';
import data from './zine-data.json' with { type: 'json' };
import { url } from './base.ts';
/**
 * The recipes behind the fridge on the third spread, from the team's 3D-character webzine (scripts/import-zine.mjs → src/zine-data.json):
 * the ingredient dictionary, 15 recipes and the planner's rules, ported from its js/data.js. Shown by src/FridgeBook.tsx.
 *
 * Its views keep the webzine's page names as the story part of the link: #recipes/recipes (recipes.html), #recipes/recipe-<id>
 * (recipe-<id>.html), #recipes/planner (planner.html).
 */
export type Ingredient={name:string;cat:string;count?:boolean};
export type RecipeIngredient={id:string;label:string;qty:string;req:boolean;sub?:boolean};
export type Recipe={id:string;name:string;meal:'meal'|'side'|'snack';source:'original'|'draft';desc:string;tags:string[];servings:string;
 photo:string;photoW:number;photoH:number;ingredients:RecipeIngredient[];subs?:Record<string,string[]>;steps:string[];tip:string|null;
 video?:{id:string;title:string;duration:string};related:string[]};
export const CATEGORIES=data.categories as {id:string;name:string;basic?:boolean}[];
export const INGREDIENTS=data.ingredients as Record<string,Ingredient>;
export const PREFS=data.prefs as {id:string;label:string}[];
export const MEALS=data.meals as Record<string,string>;
export const RECIPES=(data.recipes as Recipe[]).map(recipe=>({...recipe,photo:url(recipe.photo)}));
export const PREF_LABEL=Object.fromEntries(PREFS.map(pref=>[pref.id,pref.label]));
export const findRecipe=(id:string)=>RECIPES.find(recipe=>recipe.id===id)??null;
export const PONY=url('/media/zine/pony.webp');

/** The fridge's views, as the story part of the hash. */
export type ZineView={kind:'recipes'}|{kind:'planner'}|{kind:'recipe';recipe:Recipe};
export function zineView(id:string|null|undefined):ZineView|null{
 if(id==='recipes')return {kind:'recipes'};
 if(id==='planner')return {kind:'planner'};
 const recipe=id?.startsWith('recipe-')?findRecipe(id.slice(7)):null;
 return recipe?{kind:'recipe',recipe}:null;
}
export const ZINE_VIEW_IDS=['recipes','planner',...RECIPES.map(recipe=>'recipe-'+recipe.id)];

/** The ingredients a recipe needs (each once; water and optional garnishes do not count). */
export function requiredIds(recipe:Recipe){
 return [...new Set(recipe.ingredients.filter(i=>i.req&&INGREDIENTS[i.id]&&INGREDIENTS[i.id].count!==false).map(i=>i.id))];
}
/** Has it: in the fridge, or a substitute this recipe confirms (the gnocchi's potato starch ↔ flour). */
export function hasIngredient(recipe:Recipe,id:string,fridge:string[]):{has:boolean;via?:string}{
 if(fridge.includes(id))return {has:true};
 const via=(recipe.subs?.[id]??[]).find(sub=>fridge.includes(sub));
 return via?{has:true,via}:{has:false};
}
export type Verdict={recipe:Recipe;required:string[];have:string[];missing:string[];via:Record<string,string>;group:'ready'|'almost'|'other'};
/** The planner's verdict, as on the webzine: nothing missing → ready, one or two → almost, more → other. */
export function evaluate(recipe:Recipe,fridge:string[]):Verdict{
 const required=requiredIds(recipe),have:string[]=[],missing:string[]=[],via:Record<string,string>={};
 for(const id of required){const h=hasIngredient(recipe,id,fridge);if(h.has){have.push(id);if(h.via)via[id]=h.via;}else missing.push(id);}
 return {recipe,required,have,missing,via,group:missing.length===0?'ready':missing.length<=2?'almost':'other'};
}
export function evaluateAll(fridge:string[]){
 return RECIPES.map(recipe=>evaluate(recipe,fridge)).sort((a,b)=>a.missing.length-b.missing.length||a.recipe.name.localeCompare(b.recipe.name,'ko'));
}
/** The eight ingredients most recipes need (seasonings aside), offered first. */
export function frequentIds(n=8){
 const count:Record<string,number>={};
 for(const recipe of RECIPES)for(const id of requiredIds(recipe))count[id]=(count[id]??0)+1;
 return Object.keys(count).filter(id=>INGREDIENTS[id].cat!=='season')
  .sort((a,b)=>count[b]-count[a]||INGREDIENTS[a].name.localeCompare(INGREDIENTS[b].name,'ko')).slice(0,n);
}
export const idsInCategory=(cat:string)=>Object.keys(INGREDIENTS).filter(id=>INGREDIENTS[id].cat===cat);

/**
 * What the reader has in the fridge, shared by the planner and every recipe's ingredient list, and the list filters; kept in this browser.
 */
const KEY='gujwa:fridge';
type Saved={fridge:string[];meal:string;pref:string;searched:boolean};
function saved():Saved{
 try{const value=JSON.parse(localStorage.getItem(KEY)??'null');if(value&&Array.isArray(value.fridge))return {fridge:value.fridge.filter((id:string)=>INGREDIENTS[id]),meal:value.meal??'all',pref:value.pref??'all',searched:!!value.searched};}catch{ /* fall through */ }
 return {fridge:[],meal:'all',pref:'all',searched:false};
}
type FridgeState=Saved&{toggle:(id:string)=>void;clear:()=>void;set:(patch:Partial<Saved>)=>void};
export const useFridge=create<FridgeState>((set,get)=>{
 const keep=(patch:Partial<Saved>)=>{set(patch);const {fridge,meal,pref,searched}=get();try{localStorage.setItem(KEY,JSON.stringify({fridge,meal,pref,searched}));}catch{ /* private mode: lasts the visit */ }};
 return {...saved(),
  toggle:id=>{const fridge=get().fridge;keep({fridge:fridge.includes(id)?fridge.filter(other=>other!==id):[...fridge,id]});},
  clear:()=>keep({fridge:[],searched:false}),
  set:keep};
});
