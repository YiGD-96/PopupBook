import { create } from 'zustand';
/**
 * The reader's language: Korean, English or Chinese, chosen in the settings (behind the gear at the top right, src/SettingsMenu.tsx).
 * Korean until the reader chooses another; a choice is kept in this browser (localStorage). The words follow it (src/i18n.ts), and so does
 * the page's language (<html lang>: Chinese glyph forms, English line breaking, a screen reader's voice).
 * The Korean fonts carry no simplified Chinese, so choosing Chinese also brings its fonts (named after the Korean ones in every stack;
 * Google Fonts serves only the slices of characters a page shows). A Korean or English reader never downloads them.
 */
export type Lang='ko'|'en'|'zh';
export const LANGUAGES:readonly {code:Lang;label:string;short:string}[]=[{code:'ko',label:'한국어',short:'KO'},{code:'en',label:'English',short:'EN'},{code:'zh',label:'中文',short:'ZH'}];
const KEY='book-language';
const isLang=(value:unknown):value is Lang=>LANGUAGES.some(l=>l.code===value);
function saved():Lang|null{try{const value=localStorage.getItem(KEY);return isLang(value)?value:null;}catch{return null;}}
type LocaleState={lang:Lang;/** Chosen by the reader (kept), not the default. */chosen:boolean;choose:(lang:Lang)=>void};
export const useLocale=create<LocaleState>(set=>{
 const kept=saved();
 return {lang:kept??'ko',chosen:kept!==null,
  choose:lang=>{try{localStorage.setItem(KEY,lang);}catch{ /* private mode: the choice lasts the visit */ }set({lang,chosen:true});}};
});
const PAGE_LANG:Record<Lang,string>={ko:'ko',en:'en',zh:'zh-Hans'};
const CHINESE_FONTS='https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800&family=Noto+Serif+SC:wght@400;700&display=swap';
function loadChineseFonts(){
 if(document.querySelector('link[data-chinese-fonts]'))return;
 const link=document.createElement('link');link.rel='stylesheet';link.href=CHINESE_FONTS;link.dataset.chineseFonts='';document.head.appendChild(link);
}
if(typeof document!=='undefined'){const apply=(lang:Lang)=>{document.documentElement.lang=PAGE_LANG[lang];if(lang==='zh')loadChineseFonts();};apply(useLocale.getState().lang);useLocale.subscribe(s=>apply(s.lang));}
