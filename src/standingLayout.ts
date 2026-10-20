/**
 * The standing book for phones (portrait): the book opens to 90° with its binding running across the screen. The upper half stands
 * upright with the spread's backdrop printed on it; the lower page lies flat and carries the pop-up cards (like a vintage carousel book).
 * World frame: binding along x at z = 0, the flat page reaching toward the reader (+z), the upright page rising (+y).
 * Everything here is pure, so the layout, the turn and the camera framing are testable without a renderer.
 */
import { PAGE_BASE_Y, PAGE_HEIGHT, PAGE_WIDTH, pageRestLift } from './paperGeometry.ts';
import { BOOK_HINGE_Y } from './bookGeometry.ts';
import type { Layer } from './story.ts';

/** The flat page: as wide as the binding is long, as deep as a page is wide. Cards keep a little margin from its edges. */
export const STAGE={halfWidth:PAGE_HEIGHT/2,depth:PAGE_WIDTH,margin:.06};
/** `lift`: how far the card's foot stands above the page (a dish set on the table card in front of it). */
export type Placement={x:number;z:number;size:[number,number];lift?:number};
/** The spread's backdrop is printed on the upright page instead of standing as a card. */
export const isBackdrop=(layer:Layer)=>layer.id==='back';
/** Where a card stands on the flat page: its hand-made phone placement, or one derived from the open-book layout (narrower, the
 *  open book's depth spread over the page). */
export function standingPlacement(layer:Layer):Placement{
 if(layer.phone)return layer.phone;
 const scale=.62,size:[number,number]=[layer.size[0]*scale,layer.size[1]*scale];
 const limit=STAGE.halfWidth-STAGE.margin-size[0]/2;
 return {x:Math.max(-limit,Math.min(limit,layer.position[0]*.62)),z:.3+(layer.position[2]+2.3)/4.6*2.8,size};
}
/** Height of the flat page's surface at depth z (the open sheet's resting curve), plus the card's hinge lift. */
export function surfaceY(z:number){return PAGE_BASE_Y+pageRestLift(Math.max(0,Math.min(1,z/PAGE_WIDTH)))+.02;}

const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** One turn (progress 0 → 1): the cards fold back flat, the sheet swings 90°, the next cards pop up once the sheet stands clear. */
export const STANDING_TURN={foldOut:.26,sheetStart:.26,sheetEnd:.82,popIn:.8};
export function standingFoldOut(p:number){return -Math.PI/2*smooth(p/STANDING_TURN.foldOut);}
export function standingFoldIn(p:number){return -Math.PI/2*(1-smooth((p-STANDING_TURN.popIn)/(1-STANDING_TURN.popIn)));}
export function standingSheetProgress(p:number){return smooth((p-STANDING_TURN.sheetStart)/(STANDING_TURN.sheetEnd-STANDING_TURN.sheetStart));}

/**
 * The points below are in the open book's own frame (as src/paperGeometry: x outward from the binding, y up, z along the binding); the
 * standing book turns that frame by −90° about y, so this x becomes the world's depth (z) and this z the world's −x.
 * The upright page is the open book's left page, shortened to UPRIGHT_SCALE and turned up about the binding: a point u along it stands
 * u·UPRIGHT_SCALE·PAGE_WIDTH above the hinge, bulging toward the reader by the sheet's resting curve.
 */
/** The upright half (board, text block and page) is drawn this much shorter than a real page, so its painting does not tower over the
 *  stage on a phone; the flat page keeps its full depth. */
export const UPRIGHT_SCALE=.7;
/** How far the upright half leans back past 90° on the live phone book: the camera's pitch (34°, src/standingView.ts), so the standing
 *  page faces the camera squarely and its side edges rise straight up the screen instead of flaring out (the book reads as fully open,
 *  about 124°). The phone intro film still stands it at 90°; the live book settles into the lean just after the film hands over. */
export const UPRIGHT_LEAN=34*Math.PI/180;
export function uprightPagePoint(u:number,v:number):[number,number,number]{
 return [PAGE_BASE_Y+pageRestLift(u)-BOOK_HINGE_Y,BOOK_HINGE_Y+u*UPRIGHT_SCALE*PAGE_WIDTH,(v-.5)*PAGE_HEIGHT];
}
/** The turning sheet at q (0 lying flat as the lower page, 1 standing as the upright page, a hair in front of it). The free edge lags a
 *  little while the sheet moves, its curve flips from the flat page's to the upright page's, and it shortens to the upright page's height. */
export function standingSheetPoint(u:number,v:number,q:number,open=Math.PI/2):[number,number,number]{
 const angle=q*open-Math.sin(q*Math.PI)*.28*u*u,lift=pageRestLift(u)*Math.cos(Math.PI*q);
 const rx=u*PAGE_WIDTH*(1-(1-UPRIGHT_SCALE)*smooth(q)),ry=PAGE_BASE_Y-BOOK_HINGE_Y+lift+.003;
 return [rx*Math.cos(angle)-ry*Math.sin(angle)+.004*q,BOOK_HINGE_Y+rx*Math.sin(angle)+ry*Math.cos(angle),(v-.5)*PAGE_HEIGHT];
}
/** Texture repeat/offset that covers the upright page (PAGE_HEIGHT × UPRIGHT_SCALE·PAGE_WIDTH) with a backdrop of the given aspect, trimming its
 *  printed border; `shift` moves the crop left (−) or right (+) within the painting. */
export function backdropCrop(aspect:number,shift=0){
 const page=PAGE_HEIGHT/(UPRIGHT_SCALE*PAGE_WIDTH),trim=.035;
 const repeatY=1-trim*2,repeatX=Math.min(1-trim*2,page/aspect*repeatY);
 const room=(1-repeatX)/2;
 return {repeat:[repeatX,repeatY] as [number,number],offset:[room+Math.max(-1,Math.min(1,shift))*Math.max(0,room-trim),trim] as [number,number]};
}
