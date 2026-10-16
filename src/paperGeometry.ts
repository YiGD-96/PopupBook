import { BufferGeometry, Float32BufferAttribute } from 'three';
export const PAGE_WIDTH=3.55, PAGE_HEIGHT=4.75, PAGE_BASE_Y=.13;
/** Resting sheet profile: sinks into the gutter, swells, then settles toward the fore-edge. */
export function pageRestLift(u:number){return .15*(1-Math.exp(-u*8))*(1-.85*u)-.04*Math.exp(-u*14);}
/** Baked light as a display-space multiplier: the gutter falls into shade and a sheet turned away from the reader dims. */
export function pageShade(u:number,facing=1){return (1-.3*Math.exp(-u*10)-.04*Math.pow(u,4))*(.8+.2*Math.min(1,Math.abs(facing)));}
const linear=(shade:number)=>Math.pow(shade,2.2);
/** In an open book the sheets below the top one reach further out, so the stack's outer edge leans in toward the top. The printed top
 * sheet keeps its full size (its art, popups and shadows stay aligned); only the foot of the stack spreads out by this much. */
export const FORE_EDGE_PULL=.1;
const smoothstep=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
/** How far the foot of the stack spreads beyond the top sheet: only the outer fifth, so the gutter side stays straight. */
export function forePull(u:number,swell=1){return FORE_EDGE_PULL*swell*smoothstep(.8,1,u);}
/** Lean of the stack's outer walls from the block's foot (t = 0) to the top sheet (t = 1): steepest near the top, like fanned paper. */
export const stackLean=(t:number)=>Math.pow(t,1.6);
/** `swell` scales the resting profile: 0 is a sheet pressed flat in the closed book, 1 the open book (the default everywhere live). */
export function paperPoint(u:number,v:number,progress:number,direction:1|-1=1,swell=1):[number,number,number]{
 const p=Math.max(0,Math.min(1,progress));const angle=(direction===1?p:1-p)*Math.PI;
 const curl=Math.sin(p*Math.PI)*.95*direction;
 const distance=u*PAGE_WIDTH;
 const x=Math.abs(curl)<.00001?distance*Math.cos(angle):PAGE_WIDTH/curl*(Math.sin(angle)-Math.sin(angle-curl*u));
 const y=Math.abs(curl)<.00001?distance*Math.sin(angle):PAGE_WIDTH/curl*(Math.cos(angle-curl*u)-Math.cos(angle));
 const corner=Math.sin(p*Math.PI)*Math.pow(u,2)*Math.sin(v*Math.PI)*.12;
 return [x,PAGE_BASE_Y+y+swell*pageRestLift(u)+corner,(v-.5)*PAGE_HEIGHT];
}
export function createPaperGeometry(columns=48,rows=12,swell=1){
 const geometry=new BufferGeometry();const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){positions.push(...paperPoint(c/columns,r/rows,0,1,swell));uv.push(c/columns,1-r/rows);const s=linear(pageShade(c/columns));colors.push(s,s,s);}
 for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=r*(columns+1)+c,b=a+1,d=a+columns+2,e=a+columns+1;indices.push(a,e,b,b,e,d);}
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function updatePaperGeometry(geometry:BufferGeometry,progress:number,direction:1|-1=1,columns=48,rows=12){
 const positions=geometry.getAttribute('position');for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){const point=paperPoint(c/columns,r/rows,progress,direction);positions.setXYZ(r*(columns+1)+c,...point);}positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const normals=geometry.getAttribute('normal'),colors=geometry.getAttribute('color');
 for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){const i=r*(columns+1)+c,s=linear(pageShade(c/columns,normals.getY(i)));colors.setXYZ(i,s,s,s);}colors.needsUpdate=true;
}
/** The stack's page edges as one wall from the resting sheet down to the foot of the block, so the swell and the stack read as one thick
 * body without a seam. The foot spreads out by forePull, so the walls lean in toward the top; each carries the baked light of its outward normal. */
export function createPageSkirt(bottom:number,shade:(nx:number,ny:number,nz:number)=>number,columns=24,swell=1,rows=6){
 const geometry=new BufferGeometry();const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 // tops: points along the top sheet's edge; feet: the matching points at the foot (the unpulled footprint).
 const wall=(tops:[number,number,number][],feet:number[],normal:(i:number)=>[number,number,number])=>{
  const start=positions.length/3;
  tops.forEach((top,i)=>{const s=linear(shade(...normal(i)));for(let r=0;r<=rows;r++){const t=r/rows;positions.push(feet[i]+(top[0]-feet[i])*stackLean(t),bottom+(top[1]-bottom)*t,top[2]);uv.push(i/(tops.length-1),t);colors.push(s,s,s);}});
  for(let i=0;i<tops.length-1;i++)for(let r=0;r<rows;r++){const a=start+i*(rows+1)+r,b=a+rows+1;indices.push(a,b,a+1,a+1,b,b+1);}
 };
 const edge=(v:number)=>Array.from({length:columns+1},(_,c)=>paperPoint(c/columns,v,0,1,swell));
 const feet=Array.from({length:columns+1},(_,c)=>c/columns*PAGE_WIDTH+forePull(c/columns,swell));
 wall(edge(0),feet,()=>[0,0,-1]);wall(edge(1),feet,()=>[0,0,1]);
 const fore=Array.from({length:5},(_,r)=>paperPoint(1,r/4,0,1,swell)),lean=forePull(1,swell)/Math.max(.01,fore[0][1]-bottom);
 wall(fore,fore.map(()=>PAGE_WIDTH+forePull(1,swell)),()=>{const l=Math.hypot(1,lean);return [1/l,lean/l,0];});
 geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.setIndex(indices);return geometry;
}
