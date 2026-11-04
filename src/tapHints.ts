import { create } from 'zustand';
/**
 * The stories whose card has been pressed at least once: their tap hint (the white glove on the phone's clickable cards, src/standingBook.tsx)
 * is gone for good. Kept in this browser, so a returning reader is not shown it again.
 */
const KEY='gujwa:tapped';
function saved():string[]{try{const value=JSON.parse(localStorage.getItem(KEY)??'[]');return Array.isArray(value)?value.filter((id:unknown)=>typeof id==='string'):[];}catch{return [];}}
type TapHints={pressed:string[];press:(id:string)=>void};
export const useTapHints=create<TapHints>((set,get)=>({pressed:saved(),press:id=>{
 if(get().pressed.includes(id))return;const pressed=[...get().pressed,id];
 try{localStorage.setItem(KEY,JSON.stringify(pressed));}catch{ /* private mode: lasts the visit */ }
 set({pressed});
}}));
