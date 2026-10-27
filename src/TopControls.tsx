import { Languages, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { LANGUAGES, useLocale } from './locale';
import { useOpeningPref } from './openingPref';
import { useSoundPref } from './soundPref';
import { useT } from './i18n';
/**
 * The settings, out in the open at the top right beside the contents (always there, over the intro and the book alike), each one press
 * away: the book's language (src/locale.ts; one button that steps 한국어 → English → 中文, KO · EN · 中 on a phone), its sounds
 * (src/soundPref.ts) and whether the opening plays on each visit (src/openingPref.ts; "다음부터 보지 않기" during the opening turns it off, this turns it back on).
 */
export default function TopControls(){
 const lang=useLocale(s=>s.lang),choose=useLocale(s=>s.choose);
 const soundOn=useSoundPref(s=>s.on),setSoundOn=useSoundPref(s=>s.setOn);
 const skip=useOpeningPref(s=>s.skip),setSkip=useOpeningPref(s=>s.setSkip);const {t}=useT();
 const state=(on:boolean)=>t(on?'켜짐':'꺼짐');
 const at=Math.max(0,LANGUAGES.findIndex(l=>l.code===lang)),current=LANGUAGES[at],next=LANGUAGES[(at+1)%LANGUAGES.length];
 return <>
  <button type="button" className="top-pill lang-switch" lang={current.code} aria-label={`${t('언어')}: ${current.label}`} title={`${t('언어')}: ${current.label} → ${next.label}`} onClick={()=>choose(next.code)}>
   <Languages size={14} aria-hidden="true"/><span className="lang-full">{current.label}</span><span className="lang-short" aria-hidden="true">{current.code==='zh'?'中':current.short}</span>
  </button>
  <button type="button" className="top-pill icon-toggle" aria-pressed={soundOn} aria-label={`${t('효과음')}: ${state(soundOn)}`} title={`${t('효과음')}: ${state(soundOn)}`} onClick={()=>setSoundOn(!soundOn)}>
   {soundOn?<Volume2 size={16} aria-hidden="true"/>:<VolumeX size={16} aria-hidden="true"/>}
  </button>
  <button type="button" className="top-pill icon-toggle" aria-pressed={!skip} aria-label={`${t('시작 영상 보기')}: ${state(!skip)}`} title={`${t('시작 영상 보기')}: ${state(!skip)}`} onClick={()=>setSkip(!skip)}>
   {skip?<VideoOff size={16} aria-hidden="true"/>:<Video size={16} aria-hidden="true"/>}
  </button>
 </>;
}
