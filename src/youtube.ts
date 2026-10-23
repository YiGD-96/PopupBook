import { track } from './analytics.ts';
/**
 * Watching a YouTube Short in a recipe poster book (src/PosterBook.tsx): the player is our own iframe (youtube-nocookie, enablejsapi=1),
 * and YouTube's IFrame API, loaded only once a reader has pressed play, reports what happens in it: video_start, video_progress at 25, 50
 * and 75 %, video_complete, video_pause (GA4's video event names and parameters). If the API cannot load, the video still plays; it is just
 * not measured beyond the press of the play button (shorts_play).
 */
type Player={getCurrentTime():number;getDuration():number;destroy():void};
type YT={Player:new(element:HTMLIFrameElement,options:{events:{onStateChange:(e:{data:number})=>void}})=>Player;PlayerState:{PLAYING:number;PAUSED:number;ENDED:number}};
declare global{interface Window{YT?:YT;onYouTubeIframeAPIReady?:()=>void}}

let api:Promise<YT>|null=null;
function loadApi(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 api??=new Promise<YT>((resolve,reject)=>{
  const before=window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady=()=>{before?.();if(window.YT)resolve(window.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  script.onerror=()=>{api=null;reject(new Error('YouTube API'));};document.head.append(script);
 });
 return api;
}
/** The embed address with the API switched on for this page (the player only answers pages it names as its origin). */
export const measuredEmbed=(embed:string)=>`${embed}&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;

/** Starts measuring the player in `frame`; returns a function that stops (call it when the frame goes away). */
export function measureShort(frame:HTMLIFrameElement,info:{videoId:string;title:string;contentId:string}){
 let player:Player|null=null,timer=0,started=false,stopped=false;const reached=new Set<number>();
 const base=()=>({video_provider:'youtube',video_title:info.title,video_url:`https://www.youtube.com/shorts/${info.videoId}`,content_id:info.contentId,
  video_duration:player?Math.round(player.getDuration()):undefined,video_current_time:player?Math.round(player.getCurrentTime()):undefined});
 const progress=()=>{
  if(!player)return;const duration=player.getDuration();if(!duration)return;
  const percent=player.getCurrentTime()/duration*100;
  for(const mark of [25,50,75])if(percent>=mark&&!reached.has(mark)){reached.add(mark);track('video_progress',{...base(),video_percent:mark});}
 };
 loadApi().then(YT=>{
  if(stopped)return;
  player=new YT.Player(frame,{events:{onStateChange:({data})=>{
   if(data===YT.PlayerState.PLAYING){
    if(!started){started=true;track('video_start',{...base(),video_percent:0});}
    window.clearInterval(timer);timer=window.setInterval(progress,1000);
   }else{
    window.clearInterval(timer);
    if(data===YT.PlayerState.PAUSED)track('video_pause',{...base(),video_percent:player?Math.round(player.getCurrentTime()/Math.max(1,player.getDuration())*100):undefined});
    if(data===YT.PlayerState.ENDED){reached.add(100);track('video_complete',{...base(),video_percent:100});}
   }
  }}});
 }).catch(()=>{});
 return()=>{stopped=true;window.clearInterval(timer);};
}
