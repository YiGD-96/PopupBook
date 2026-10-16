export const COVER_HOLD_MS = 1000;
/** Pages fanned in the intro film: each turn starts PAGE_STAGGER after the previous one and lasts PAGE_TURN. */
export const INTRO_PAGE_COUNT = 6;
export const INTRO_PAGES_START = 1;
export const INTRO_PAGE_STAGGER = .14;
export const INTRO_PAGE_TURN = .62;
/** The scenery rises (and the reader UI appears) as soon as the last fanned page has landed. */
export const INTRO_UI_AT = +(INTRO_PAGES_START+(INTRO_PAGE_COUNT-1)*INTRO_PAGE_STAGGER+INTRO_PAGE_TURN-.08).toFixed(2);
export const INTRO_DURATION = +(INTRO_UI_AT+1.8).toFixed(2);

// Start the clock after the cover image has painted, not at application startup.
export function coverTimeRemaining(shownAt:number,now:number){
  return Math.max(0,COVER_HOLD_MS-Math.max(0,now-shownAt));
}

export function canRevealReader(videoFinished:boolean,scenePrepared:boolean){
  return videoFinished&&scenePrepared;
}
