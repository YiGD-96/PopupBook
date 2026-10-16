export const COVER_HOLD_MS = 1000;
export const INTRO_UI_AT = 2.8;
export const INTRO_DURATION = 4.6;

// Start the clock after the cover image has painted, not at application startup.
export function coverTimeRemaining(shownAt:number,now:number){
  return Math.max(0,COVER_HOLD_MS-Math.max(0,now-shownAt));
}

export function canRevealReader(videoFinished:boolean,scenePrepared:boolean){
  return videoFinished&&scenePrepared;
}
