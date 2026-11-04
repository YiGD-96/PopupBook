import { POWERUPS, type StatKey } from './content.ts';
/** What a reader keeps between runs, in this browser only: coins, the lasting upgrades bought with them, and the best run. */
export type MetaSave={coins:number;power:Partial<Record<StatKey,number>>;best:{time:number;kills:number;level:number};clears:number};
const KEY='gujwa-carrot-game-v1';
export const emptyMeta=():MetaSave=>({coins:0,power:{},best:{time:0,kills:0,level:0},clears:0});
export function loadMeta():MetaSave{
 try{const raw=localStorage.getItem(KEY);if(raw){const m=JSON.parse(raw) as Partial<MetaSave>;return {...emptyMeta(),...m,best:{...emptyMeta().best,...m.best},power:{...m.power}};}}
 catch{ /* Private windows and blocked storage start fresh every time. */ }
 return emptyMeta();
}
export function saveMeta(meta:MetaSave){try{localStorage.setItem(KEY,JSON.stringify(meta));}catch{ /* Not kept; the game still plays. */ }}
/** The lasting upgrades as stat additions (src/game/engine.ts adds them to the character's). */
export function metaBonus(meta:MetaSave):Partial<Record<StatKey,number>>{
 const out:Partial<Record<StatKey,number>>={};
 for(const p of POWERUPS){const level=meta.power[p.id]??0;if(level)out[p.id]=(out[p.id]??0)+p.per*level;}
 return out;
}
