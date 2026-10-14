import { PAGE_HEIGHT, PAGE_WIDTH, paperPoint } from './paperGeometry.ts';
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
 const point=paperPoint(u,v,p,direction);const offset=y-.13-.055*Math.exp(-u*12);
 const normal:[number,number,number]=[-Math.sin(angle)*face,Math.cos(angle)*face,0];
 return {position:[point[0]+normal[0]*offset,point[1]+normal[1]*offset+.018,z] as [number,number,number],rotation:angle+(face===-1?Math.PI:0),normal};
}
export function pageReveal(progress:number,start:number,end:number){const t=Math.max(0,Math.min(1,(progress-start)/(end-start)));return t*t*(3-2*t);}
export function popupFoldAngle(progress:number,incoming=false){
 const p=Math.max(0,Math.min(1,progress));
 return -Math.PI/2*(incoming?1-p:p);
}
