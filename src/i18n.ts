import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useLocale, type Lang } from './locale.ts';
/**
 * The book's words in the reader's language (src/locale.ts). Korean is the source: every Korean string a reader sees is also the key of
 * its English and Chinese versions (src/i18n/en.ts, zh.ts), so the data (chapters, stories, the webzine) keeps one structure and simply
 * passes through the dictionary. A string with no entry stays Korean. The dictionaries load only when a reader picks English or Chinese,
 * so a Korean reader downloads neither.
 */
type Dict=Record<string,string>;
const dictionaries:Partial<Record<Lang,Dict>>={ko:{}};
const loaders:Record<Exclude<Lang,'ko'>,()=>Promise<{default:Dict}>>={en:()=>import('./i18n/en'),zh:()=>import('./i18n/zh')};
/** Bumped as a dictionary arrives, so the words on screen follow. */
const useDictionaries=create<{version:number}>(()=>({version:0}));
const pending=new Set<Lang>();
export function loadDictionary(lang:Lang){
 if(dictionaries[lang]||pending.has(lang))return;pending.add(lang);
 void loaders[lang as Exclude<Lang,'ko'>]().then(module=>{dictionaries[lang]=module.default;pending.delete(lang);useDictionaries.setState(s=>({version:s.version+1}));},()=>pending.delete(lang));
}
const HANGUL=/[가-힣]/;
export function translate(text:string,lang:Lang){return lang==='ko'||!HANGUL.test(text)?text:dictionaries[lang]?.[text]??text;}
const reversed:Partial<Record<Lang,Map<string,string>>>={};
/** The Korean source of words shown in the reader's language, so a control is measured under one name in every language (src/analytics.ts).
 * A label put together from parts ("Language: English") is turned back part by part; words with no entry pass unchanged. */
export function toKorean(text:string,lang:Lang){
 const dict=dictionaries[lang];if(lang==='ko'||!dict)return text;
 const map=reversed[lang]??=new Map(Object.entries(dict).map(([korean,shown])=>[shown,korean]));
 return map.get(text)??text.split(/(: | — | → )/).map(part=>map.get(part)??part).join('');
}
/** Every string in a piece of data (a story, a webzine) in the reader's language; image paths and other Latin text pass unchanged. */
export function localize<T>(data:T,lang:Lang):T{
 if(lang==='ko')return data;
 const walk=(value:unknown):unknown=>typeof value==='string'?translate(value,lang):Array.isArray(value)?value.map(walk)
  :value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype?Object.fromEntries(Object.entries(value).map(([key,inner])=>[key,walk(inner)])):value;
 return walk(data) as T;
}
/** The reader's language and `t` for the words of a component; it re-renders once the dictionary has arrived. */
export function useT(){
 const lang=useLocale(s=>s.lang),version=useDictionaries(s=>s.version);
 useEffect(()=>{if(lang!=='ko')loadDictionary(lang);},[lang]);
 return useMemo(()=>({lang,t:(text:string)=>translate(text,lang)}),[lang,version]);
}
/** A piece of data in the reader's language (see localize), kept until the language or the dictionary changes. */
export function useLocalized<T>(data:T):T{
 const lang=useLocale(s=>s.lang),version=useDictionaries(s=>s.version);
 useEffect(()=>{if(lang!=='ko')loadDictionary(lang);},[lang]);
 return useMemo(()=>localize(data,lang),[data,lang,version]);
}
