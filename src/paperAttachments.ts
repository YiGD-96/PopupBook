import { PAGE_BASE_Y, PAGE_HEIGHT, PAGE_WIDTH, pageRestLift, paperPoint } from './paperGeometry.ts';
export type PageSide='left'|'right';
export type PaperPiece={center:number;width:number;u0:number;u1:number;side:PageSide};
export function splitPaperArt(center:number,width:number,side:PageSide):PaperPiece|null{
 const start=center-width/2,end=center+width/2;
 const a=Math.max(start,side==='left'?-PAGE_WIDTH:0),b=Math.min(end,side==='left'?0:PAGE_WIDTH);
 return b-a>.0001?{center:(a+b)/2,width:b-a,u0:(a-start)/width,u1:(b-start)/width,side}:null;
}
export function attachedPaperPose(x:number,y:number,z:number,progress:number,direction:1|-1,face:1|-1){
 const p=Math.max(0,Math.min(1,progress)),u=Math.min(1,Math.abs(x)/PAGE_WIDTH),v=z/PAGE_HEIGHT+.5;
 const angle=(direction===1?p:1-p)*Math.PI-Math.sin(p*Math.PI)*.95*direction*u;
 const point=paperPoint(u,v,p,direction);const offset=y-PAGE_BASE_Y-pageRestLift(u);
 const normal:[number,number,number]=[-Math.sin(angle)*face,Math.cos(angle)*face,0];
 return {position:[point[0]+normal[0]*offset,point[1]+normal[1]*offset+.018,z] as [number,number,number],rotation:angle+(face===-1?Math.PI:0),normal};
}
export function pageReveal(progress:number,start:number,end:number){const t=Math.max(0,Math.min(1,(progress-start)/(end-start)));return t*t*(3-2*t);}
/** The turning sheet stands upright at this point of a turn (its angle is progress × π). */
export const PAGE_UPRIGHT=.5;
/** The spread being left folds its cards flat by this point, before the sheet stands upright and its other side comes into view. */
export const FOLDED_BY=.42;
/** A card's fold during a turn (0 standing, −π/2 flat on its page). The spread being left folds flat by FOLDED_BY; the next spread's
 *  cards lie flat until the sheet is upright and rise as it lands, so the two spreads' cards never stand at once (the old ones used to
 *  stand until 70% of the turn and the new ones to show from 35%, so both showed around the upright sheet, the old ones from behind). */
export function popupFoldAngle(progress:number,incoming=false){
 const p=Math.max(0,Math.min(1,progress));
 return -Math.PI/2*(incoming?1-Math.max(0,(p-PAGE_UPRIGHT)/(1-PAGE_UPRIGHT)):Math.min(p/FOLDED_BY,1));
}
