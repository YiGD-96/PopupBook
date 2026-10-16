import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape, Vector3 } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BOOK_BOARD, BOOK_PAGES, BOOK_RIBBON, BOOK_SPINE } from './bookStructure.ts';
import { PAGE_BASE_Y, PAGE_HEIGHT } from './paperGeometry.ts';

/** One fixed light, baked into vertex colours: unlit materials keep a single cheap shader yet edges still read as rounded. */
const LIGHT=new Vector3(-.25,1,.35).normalize();
export function lightShade(nx:number,ny:number,nz:number){return .7+.3*Math.max(0,nx*LIGHT.x+ny*LIGHT.y+nz*LIGHT.z);}
const linear=(value:number)=>Math.pow(value,2.2);
export function bakeLight(geometry:BufferGeometry,tint:(index:number)=>readonly [number,number,number]=()=>[1,1,1]){
 const normals=geometry.getAttribute('normal'),colors=new Float32Array(normals.count*3);
 for(let i=0;i<normals.count;i++){const s=lightShade(normals.getX(i),normals.getY(i),normals.getZ(i)),t=tint(i);for(let k=0;k<3;k++)colors[i*3+k]=linear(s*t[k]);}
 geometry.setAttribute('color',new Float32BufferAttribute(colors,3));return geometry;
}
/** Planar (x, z) texture coordinates over a footprint, far edge at v = 1 like the printed art. */
function planarUv(geometry:BufferGeometry,width:number,depth:number,centerX=0){
 const position=geometry.getAttribute('position'),uv=new Float32Array(position.count*2);
 for(let i=0;i<position.count;i++){uv[i*2]=(position.getX(i)-centerX+width/2)/width;uv[i*2+1]=(depth/2-position.getZ(i))/depth;}
 geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
}
/** Welds coincident vertices so the bevel shades smoothly, then sorts faces into material groups by facing. */
function weld(geometry:BufferGeometry,classify:(nx:number,ny:number,nz:number)=>number,groups:number){
 geometry.deleteAttribute('normal');const welded=mergeVertices(geometry,1e-4);geometry.dispose();welded.computeVertexNormals();
 const index=welded.getIndex()!,position=welded.getAttribute('position'),buckets:number[][]=Array.from({length:groups},()=>[]);
 const a=new Vector3(),b=new Vector3(),c=new Vector3();
 for(let i=0;i<index.count;i+=3){
  a.fromBufferAttribute(position,index.getX(i));b.fromBufferAttribute(position,index.getX(i+1));c.fromBufferAttribute(position,index.getX(i+2));
  const n=b.sub(a).cross(c.sub(a)).normalize();buckets[classify(n.x,n.y,n.z)].push(index.getX(i),index.getX(i+1),index.getX(i+2));
 }
 welded.setIndex(buckets.flat());welded.clearGroups();let start=0;buckets.forEach((bucket,material)=>{welded.addGroup(start,bucket.length,material);start+=bucket.length;});
 return welded;
}
/** A hardback board: rounded outer corners and a cloth-wrapped rounded edge; the inner edge (local −x) runs square into the spine.
 * `flipped` turns it face down about the binding axis (how the front cover lies open on the left), with the light baked after the turn.
 * Material groups: 0 face looking up, 1 face looking down, 2 edge. */
export function createBoardGeometry(flipped=false){
 const {width:w,depth:d,thickness:t,radius:r,bevel:b}=BOOK_BOARD,sw=w/2-b,sd=d/2-b,sr=Math.max(.005,r-b),core=t-2*b;
 const shape=new Shape();
 shape.moveTo(-sw,-sd);shape.lineTo(sw-sr,-sd);shape.absarc(sw-sr,-sd+sr,sr,-Math.PI/2,0,false);shape.lineTo(sw,sd-sr);shape.absarc(sw-sr,sd-sr,sr,0,Math.PI/2,false);shape.lineTo(-sw,sd);shape.lineTo(-sw,-sd);
 const extruded=new ExtrudeGeometry(shape,{depth:core,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:4});
 // The outline becomes the footprint (x, z) and the extrusion becomes the thickness (y).
 extruded.translate(0,0,-core/2);extruded.rotateX(Math.PI/2);planarUv(extruded,w,d);if(flipped)extruded.rotateZ(Math.PI);
 // Only the flat faces take the face textures; every bevel ring is wrapped cloth, so both boards edge alike.
 return bakeLight(weld(extruded,(_,ny)=>ny>.995?0:ny<-.995?1:2,3));
}
/** The hinge groove pressed into the cloth beside each board edge, measured along the band from its ends (which sit 0.05 inside the
 * boards), so it lies in the same place on the closed cover and on the open book. Wider than the edge rounding so the bevel softens it
 * instead of filling it; `shade` darkens the groove floor so it reads even under soft light. */
const JOINT_GROOVE={at:.094,width:.034,depth:.034,shade:.24};
const SPINE_END=BOOK_SPINE.halfWidth+.05;
const grooveWeight=(fromEnd:number,total:number)=>Math.exp(-Math.pow((fromEnd-JOINT_GROOVE.at)/JOINT_GROOVE.width,2))+Math.exp(-Math.pow((total-fromEnd-JOINT_GROOVE.at)/JOINT_GROOVE.width,2));
/** How far the open spine sags under the gutter at x (zero at the boards). */
const spineSag=(x:number)=>BOOK_SPINE.sag*Math.pow(1-Math.pow(Math.min(1,Math.abs(x)/BOOK_SPINE.halfWidth),2),2);
/** Top edge of the open spine: level with the boards, sagging a little under the gutter, with the hinge groove beside each board. */
export function spineTop(x:number){
 return BOOK_BOARD.y+BOOK_BOARD.thickness/2-spineSag(x)-JOINT_GROOVE.depth*grooveWeight(SPINE_END-x,2*SPINE_END);
}
/** Height at which the two halves of the closed book meet; the first half turns about this line on the binding. */
export const BOOK_HINGE_Y=PAGE_BASE_Y+.002;
/**
 * The cloth spine as one band from board to board. `fold` 1 is the open book (flat, with joint grooves); 0 is the closed book, where the band
 * wraps around the stacked halves like a C; values between follow the first half as it turns about the binding. The band runs a little
 * into each board, so the joints never open, and stays a hair inside the board faces so the surfaces do not fight.
 */
export function createSpineGeometry(fold=1,segments=96){
 const {thickness:t,depth:d,bevel:b,y}=BOOK_BOARD,end=SPINE_END,core=d-2*b,flat=Math.pow(fold,6);
 const angle=-(1-fold)*Math.PI,c=Math.cos(angle),s=Math.sin(angle);
 const turn=([px,py]:number[])=>[px*c-(py-BOOK_HINGE_Y)*s,px*s+(py-BOOK_HINGE_Y)*c+BOOK_HINGE_Y];
 // A cubic from the second board's inner end to the (turned) first board's inner end, leaving each along its board.
 const p0=[end,y],p3=turn([-end,y]),into=turn([1,0]).map((v,i)=>v-turn([0,0])[i]),reach=.53*Math.hypot(p3[0]-p0[0],p3[1]-p0[1]);
 const p1=[p0[0]-reach,p0[1]],p2=[p3[0]+into[0]*reach,p3[1]+into[1]*reach];
 const at=(u:number,k:number)=>(1-u)**3*p0[k]+3*(1-u)**2*u*p1[k]+3*(1-u)*u*u*p2[k]+u**3*p3[k];
 const tangent=(u:number,k:number)=>3*(1-u)**2*(p1[k]-p0[k])+6*(1-u)*u*(p2[k]-p1[k])+3*u*u*(p3[k]-p2[k]);
 const centre=Array.from({length:segments+1},(_,i)=>[at(i/segments,0),at(i/segments,1)]);
 const arc=[0];for(let i=1;i<=segments;i++)arc.push(arc[i-1]+Math.hypot(centre[i][0]-centre[i-1][0],centre[i][1]-centre[i-1][1]));
 const total=arc[segments],half=t/2-b-.002,inner:number[][]=[],outer:number[][]=[];
 centre.forEach(([cx,cy],i)=>{
  const u=i/segments,tx=tangent(u,0),ty=tangent(u,1),l=Math.hypot(tx,ty)||1,nx=ty/l,ny=-tx/l,groove=JOINT_GROOVE.depth*grooveWeight(arc[i],total);
  // Both faces carry the groove: the inside shows on the open book, the outside on the closed cover. The sag appears only lying flat.
  const sag=flat*spineSag(end-2*end*u);
  inner.push([cx+nx*(half-groove-sag),cy+ny*(half-groove-sag)]);outer.push([cx-nx*(half-groove),cy-ny*(half-groove)]);
 });
 const shape=new Shape();inner.forEach(([px,py],i)=>i?shape.lineTo(px,py):shape.moveTo(px,py));[...outer].reverse().forEach(([px,py])=>shape.lineTo(px,py));
 // The bevel grows the outline by b, which is why the band above is drawn b inside the board thickness.
 const extruded=new ExtrudeGeometry(shape,{depth:core,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:4});extruded.translate(0,0,-core/2);planarUv(extruded,2*end,d);
 const welded=weld(extruded,()=>0,1),position=welded.getAttribute('position');
 // Darken each vertex by how close it lies (along the band) to a groove floor.
 return bakeLight(welded,i=>{
  let best=0,dist=Infinity;const px=position.getX(i),py=position.getY(i);
  centre.forEach(([cx,cy],k)=>{const dd=(cx-px)**2+(cy-py)**2;if(dd<dist){dist=dd;best=k;}});
  const shade=1-JOINT_GROOVE.shade*Math.min(1,grooveWeight(arc[best],total));return [shade,shade,shade];
 });
}
/** The text block's box with its edge faces darker than the top, matching the board light. */
export function createPaperBlockGeometry(){return bakeLight(new BoxGeometry(BOOK_PAGES.width,BOOK_PAGES.thickness,BOOK_PAGES.depth));}
/** A ribbon marker coming out between the pages of the second half's tail edge, over the board's turn-in and down onto the table. */
export function createRibbonGeometry(width=BOOK_RIBBON.width){
 const x=BOOK_RIBBON.x,front=PAGE_HEIGHT/2,board=BOOK_BOARD.y+BOOK_BOARD.thickness/2,edge=BOOK_BOARD.depth/2,floor=BOOK_BOARD.y-BOOK_BOARD.thickness/2+.004;
 const path:[number,number,number][]=[[x,.03,front+.002],[x+.002,-.05,front+.012],[x+.004,board+.03,front+.016],[x+.006,board+.004,front+.04],[x+.008,board+.004,edge-.04],
  [x+.01,board-.012,edge+.012],[x+.012,board-.06,edge+.018],[x+.016,floor+.01,edge+.04],[x+.03,floor,edge+.16],[x+.05,floor,edge+.36]];
 const positions:number[]=[],normals:number[]=[],indices:number[]=[];
 path.forEach((p,i)=>{const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],ty=b[1]-a[1],tz=b[2]-a[2],l=Math.hypot(ty,tz)||1;
  positions.push(p[0]-width/2,p[1],p[2],p[0]+width/2,p[1],p[2]);normals.push(0,tz/l,-ty/l,0,tz/l,-ty/l);});
 for(let i=0;i<path.length-1;i++){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new Float32BufferAttribute(normals,3));
 // The ribbon samples one flat texel of the shared texture; its colour comes from the baked tint.
 geometry.setAttribute('uv',new Float32BufferAttribute(new Float32Array(positions.length/3*2).fill(.5),2));geometry.setIndex(indices);
 return bakeLight(geometry,()=>[.76,.36,.3]);
}
