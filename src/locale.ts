import { create } from 'zustand';
/**
 * The reader's language: Korean, English or Chinese. Only the choice exists for now (the menu at the top right, src/LanguageMenu.tsx);
 * the book's wording is not translated yet. Chosen once by the reader it is kept (localStorage); otherwise it follows the country the
 * reader connects from (detectLanguage), and until that is known, the browser's language.
 */
export type Lang='ko'|'en'|'zh';
export const LANGUAGES:readonly {code:Lang;label:string;short:string}[]=[{code:'ko',label:'한국어',short:'KO'},{code:'en',label:'English',short:'EN'},{code:'zh',label:'中文',short:'ZH'}];
const KEY='book-language';
const isLang=(value:unknown):value is Lang=>LANGUAGES.some(l=>l.code===value);
/** The language a country reads in: Korea Korean, the Chinese-speaking countries and regions Chinese, everywhere else English. */
export function countryLanguage(country:string|null|undefined):Lang|null{
 if(!country)return null;const code=country.toUpperCase();
 return code==='KR'?'ko':['CN','TW','HK','MO','SG'].includes(code)?'zh':'en';
}
/** The browser's language, as the first guess. */
export function browserLanguage(language=typeof navigator==='undefined'?'ko':navigator.language):Lang{
 const tag=language.toLowerCase();return tag.startsWith('ko')?'ko':tag.startsWith('zh')?'zh':'en';
}
function saved():Lang|null{try{const value=localStorage.getItem(KEY);return isLang(value)?value:null;}catch{return null;}}
type LocaleState={lang:Lang;/** Chosen by the reader (kept), not detected. */chosen:boolean;source:'saved'|'browser'|'ip';choose:(lang:Lang)=>void};
export const useLocale=create<LocaleState>(set=>{
 const kept=saved();
 return {lang:kept??browserLanguage(),chosen:kept!==null,source:kept?'saved':'browser',
  choose:lang=>{try{localStorage.setItem(KEY,lang);}catch{ /* private mode: the choice lasts the visit */ }set({lang,chosen:true,source:'saved'});}};
});
if(typeof document!=='undefined'){const apply=(lang:Lang)=>{document.documentElement.lang=lang;};apply(useLocale.getState().lang);useLocale.subscribe(s=>apply(s.lang));}
/**
 * The country the reader connects from: the site's own endpoint (api/geo.js, which reads the country Vercel attaches to every request)
 * and, where that endpoint does not exist (a dev server), a public lookup. Either answers in well under a second or is given up.
 */
async function ipCountry():Promise<string|null>{
 const get=async(url:string,pick:(json:Record<string,unknown>)=>unknown)=>{
  const control=new AbortController(),timer=window.setTimeout(()=>control.abort(),2500);
  try{const response=await fetch(url,{signal:control.signal});if(!response.ok)return null;const value=pick(await response.json() as Record<string,unknown>);return typeof value==='string'&&value.length===2?value:null;}
  catch{return null;}finally{window.clearTimeout(timer);}
 };
 return await get('/api/geo',json=>json.country)??await get('https://ipapi.co/json/',json=>json.country_code);
}
/** Sets the language from the reader's country, once, unless they have chosen one. Call it once the first picture is up: it is not urgent. */
export async function detectLanguage(lookup=ipCountry){
 if(useLocale.getState().chosen)return;
 const country=await lookup();const lang=countryLanguage(country);
 if(lang&&!useLocale.getState().chosen)useLocale.setState({lang,source:'ip'});
}
