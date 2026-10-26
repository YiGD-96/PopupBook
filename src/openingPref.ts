import { create } from 'zustand';
/**
 * Whether the opening (the intro film, the prologue and the reading guide) is skipped on each visit: set by "다음부터 보지 않기" next to
 * 건너뛰기 during the opening, and by "시작 영상 보기" in the settings (src/TopControls.tsx), which turns it back on. Kept in this browser.
 */
const KEY='gujwa:skip-opening';
function saved(){try{return localStorage.getItem(KEY)==='1';}catch{return false;}}
type OpeningPref={skip:boolean;setSkip:(skip:boolean)=>void};
export const useOpeningPref=create<OpeningPref>(set=>({skip:saved(),setSkip:skip=>{
 try{if(skip)localStorage.setItem(KEY,'1');else localStorage.removeItem(KEY);}catch{ /* private mode: lasts the visit */ }
 set({skip});
}}));
