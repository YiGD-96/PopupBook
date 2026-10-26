import { create } from 'zustand';
/**
 * Whether the book makes its sounds (page turns, the intro's riffle, the chime as a story opens): on unless the reader turns it off in
 * the settings (src/TopControls.tsx). Kept in this browser. src/story.ts playSound checks it before each sound.
 */
const KEY='gujwa:sound-off';
function saved(){try{return localStorage.getItem(KEY)!=='1';}catch{return true;}}
type SoundPref={on:boolean;setOn:(on:boolean)=>void};
export const useSoundPref=create<SoundPref>(set=>({on:saved(),setOn:on=>{
 try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'1');}catch{ /* private mode: lasts the visit */ }
 set({on});
}}));
