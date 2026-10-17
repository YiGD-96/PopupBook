/** The standing book's camera (phones in portrait): fixed, in front of the book and a little above, framing the whole stage. */
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { BOOK_BOARD } from './bookStructure.ts';
import { PAGE_WIDTH, PAGE_HEIGHT } from './paperGeometry.ts';
import { BOOK_HINGE_Y } from './bookGeometry.ts';
import { UPRIGHT_SCALE } from './standingLayout.ts';

/** Looking down at 34° from a little way back (gentler perspective, so the near edge does not take the width from the stage), aimed so
 *  the book, with its shortened upright half (UPRIGHT_SCALE), sits in the middle of the frame. */
export const STANDING_TARGET:[number,number,number]=[0,.94,1.5];
const DISTANCE=14,ELEVATION=34*Math.PI/180;
export const STANDING_CAMERA_POSITION:[number,number,number]=[0,STANDING_TARGET[1]+DISTANCE*Math.sin(ELEVATION),STANDING_TARGET[2]+DISTANCE*Math.cos(ELEVATION)];
/** What the frame must hold (world): the lower board's corners, the upright board's and page's top corners. Cards stand inside these. */
const edge=BOOK_BOARD.depth/2,front=BOOK_BOARD.x+BOOK_BOARD.width/2,inner=BOOK_BOARD.x-BOOK_BOARD.width/2,floor=BOOK_BOARD.y-BOOK_BOARD.thickness/2;
const top=BOOK_HINGE_Y+front*UPRIGHT_SCALE+.02;
export const STANDING_FRAME_POINTS:[number,number,number][]=[-1,1].flatMap(side=>[
 [side*edge,floor,front],[side*edge,floor,inner],[side*edge,top,-(BOOK_HINGE_Y-floor)],[side*PAGE_HEIGHT/2,BOOK_HINGE_Y+PAGE_WIDTH*UPRIGHT_SCALE,0]] as [number,number,number][]);
/** The narrowest vertical field of view (degrees) that keeps every frame point inside `margin` of the canvas edges. */
export function standingFov(width:number,height:number,margin=.9){
 const camera=new PerspectiveCamera(30,width/height,.1,70);camera.position.set(...STANDING_CAMERA_POSITION);camera.lookAt(...STANDING_TARGET);camera.updateMatrixWorld();
 const view=new Matrix4().copy(camera.matrixWorld).invert(),aspect=width/height;let need=0;
 for(const point of STANDING_FRAME_POINTS){const v=new Vector3(...point).applyMatrix4(view);need=Math.max(need,Math.abs(v.y)/-v.z,Math.abs(v.x)/-v.z/aspect);}
 return 2*Math.atan(need/margin)*180/Math.PI;
}
export { STANDING_QUERY } from './standingMedia.ts';
