/** The closed book stands for this long before it starts to move. The hold is part of the film, so the magazine's moving
 *  cover (scripts/capture-site-cover.mjs) plays on the book while it stands. */
export const COVER_HOLD_MS = 1000;
export const INTRO_COVER_HOLD = COVER_HOLD_MS/1000;
/** Pages fanned in the intro film: each turn starts PAGE_STAGGER after the previous one and lasts PAGE_TURN. */
export const INTRO_PAGE_COUNT = 6;
export const INTRO_PAGES_START = INTRO_COVER_HOLD+1;
export const INTRO_PAGE_STAGGER = .14;
export const INTRO_PAGE_TURN = .62;
/** The scenery rises (and the film pauses for the prologue) just after the last fanned page has landed, never while it is in the air. */
export const INTRO_UI_AT = +(INTRO_PAGES_START+(INTRO_PAGE_COUNT-1)*INTRO_PAGE_STAGGER+INTRO_PAGE_TURN+.04).toFixed(2);
export const INTRO_DURATION = +(INTRO_UI_AT+1.8).toFixed(2);
/** The phone film (standing book): the same hold and opening, then a few sheets swing up to the upright page, a little further apart
 *  than the fanned pages since each one shows a whole painting; the first spread's cards rise once the last has landed. */
export const STANDING_INTRO_PAGE_COUNT = 3;
export const STANDING_INTRO_PAGE_STAGGER = .16;
export const STANDING_INTRO_UI_AT = +(INTRO_PAGES_START+(STANDING_INTRO_PAGE_COUNT-1)*STANDING_INTRO_PAGE_STAGGER+INTRO_PAGE_TURN+.04).toFixed(2);
export const STANDING_INTRO_DURATION = +(STANDING_INTRO_UI_AT+1.8).toFixed(2);

export function canRevealReader(videoFinished:boolean,scenePrepared:boolean){
  return videoFinished&&scenePrepared;
}
