/** What the intro screen needs to show the phone film (no three.js, so it stays out of the first download). */
/** Phones held upright get the standing book; everything else the open book. */
export const STANDING_QUERY='(max-width: 760px) and (orientation: portrait)';
/** The phone intro film is portrait 9:20, taller than phone canvases (about 9:19.5 with the browser's bars gone), so it covers them top to
 *  bottom (at 9:16 it left an empty band above and below). */
export const STANDING_FILM_ASPECT=9/20;
/** How far the standing camera must reach sideways for every frame point, relative to how far up and down (src/standingView.ts). On any
 *  canvas narrower than this ratio (every portrait one) the width sets the field of view. tests/standing-book.test.mjs keeps this in step. */
export const STANDING_FRAME_REACH=1.09896;
/** On-screen size of the phone film on a width×height canvas. The film and the live book share the camera's position and direction and
 *  differ only in field of view (standingFov), so the film lines up when scaled about the centre by the ratio of the focal lengths. */
export function standingMediaSize(width:number,height:number){
 const reach=(aspect:number)=>Math.max(1,STANDING_FRAME_REACH/aspect),size=height*reach(STANDING_FILM_ASPECT)/reach(width/height);
 return {width:size*STANDING_FILM_ASPECT,height:size};
}
/** How far below the canvas's centre the phone's standing book (and its film, by the same amount) is drawn, in CSS pixels: room under the
 *  chapter title. Where the moved film no longer reaches the canvas's top, the strip left is the page's own dark, the colour the film's
 *  top already is (the room's fog), so no edge shows. */
export const STANDING_DROP=36;
