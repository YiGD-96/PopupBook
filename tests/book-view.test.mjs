import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,PerspectiveCamera} from 'three';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,BOOK_TARGET_Y,BOOK_CAMERA_POSITION,BOOK_CAMERA_DISTANCE,bookZoom,bookFov} from '../src/bookView.ts';
import {paperPoint} from '../src/paperGeometry.ts';
import {scenes} from '../src/story.ts';
import {splitPaperArt,attachedPaperPose,popupFoldAngle} from '../src/paperAttachments.ts';
import {BOOK_BOARD,BOOK_PAGES} from '../src/bookStructure.ts';

function frameCamera(width,height){
 const camera=new PerspectiveCamera(bookFov(width,height),width/height,.1,70);
 camera.position.set(...BOOK_CAMERA_POSITION);camera.lookAt(0,BOOK_TARGET_Y,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();return camera;
}

test('the same fixed front camera contains raised pages and attached popup cards in either direction',()=>{
 const camera=frameCamera(BOOK_FRAME_WIDTH*100,BOOK_FRAME_HEIGHT*100);
 const inside=point=>{const v=new Vector3(...point).project(camera);assert.ok(Math.abs(v.x)<=1&&Math.abs(v.y)<=1,'paper or popup clipped: '+JSON.stringify(v));};
 for(let i=0;i<=20;i++){
  const p=i/20;
  for(const u of [0,.5,1])for(const v of [0,.5,1]){const point=paperPoint(u,v,p,1);point[1]+=.09;inside(point);}
  for(const direction of [1,-1])for(const incoming of [false,true])for(const scene of scenes)for(const layer of scene.layers)for(const side of ['left','right']){
   const piece=splitPaperArt(layer.position[0],layer.size[0],side);if(!piece||incoming&&p<.35)continue;
   const moving=direction===1?'right':'left';const rides=incoming?side!==moving:side===moving;
   const pose=rides?attachedPaperPose(piece.center,layer.position[1],layer.position[2],p,direction,side==='right'?1:-1):{position:[piece.center,layer.position[1]+.018,layer.position[2]],rotation:0};
   for(const x of [-piece.width/2,piece.width/2])for(const y of [0,layer.size[1]]){
    const vertex=new Vector3(x,y,0).applyAxisAngle(new Vector3(1,0,0),popupFoldAngle(p,incoming)).applyAxisAngle(new Vector3(0,0,1),pose.rotation).add(new Vector3(...pose.position));inside(vertex.toArray());
   }
  }
 }
 assert.ok(bookZoom(390,487)>0);assert.ok(bookZoom(1181,564)>0);assert.equal(BOOK_CAMERA_POSITION[0],0);
});

test('the whole hardback, including its wider near edge, fits a width-limited phone',()=>{
 const camera=frameCamera(390,600);
 for(const x of [-1,1])for(const z of [-1,1]){const v=new Vector3(x*(BOOK_BOARD.x+BOOK_BOARD.width/2),BOOK_BOARD.y-BOOK_BOARD.thickness/2,z*BOOK_BOARD.depth/2).project(camera);assert.ok(Math.abs(v.x)<=1,'book corner clipped on a phone: '+v.x);}
});

test('perspective makes the near edge of the book wider than the far edge',()=>{
 const camera=frameCamera(1280,720),edge=z=>{const a=new Vector3(-BOOK_BOARD.width,BOOK_BOARD.y,z).project(camera),b=new Vector3(BOOK_BOARD.width,BOOK_BOARD.y,z).project(camera);return b.x-a.x;};
 assert.ok(edge(BOOK_BOARD.depth/2)>edge(-BOOK_BOARD.depth/2)*1.2);
});

test('the frame keeps the same on-screen scale at the target plane as the intro video',()=>{
 for(const [w,h] of [[1280,720],[390,600],[1181,564]]){
  const camera=frameCamera(w,h),top=new Vector3(0,BOOK_TARGET_Y,0).add(new Vector3(0,1,0).applyQuaternion(camera.quaternion)).project(camera);
  // One world unit on the target plane spans bookZoom pixels, the scale the intro video is laid out with.
  assert.ok(Math.abs(top.y*h/2-bookZoom(w,h))<1e-6*bookZoom(w,h)+1e-6,`${w}×${h}`);
 }
 assert.ok(BOOK_CAMERA_DISTANCE>10);
});

test('the hardback bottom edge has visible breathing room in the desktop framing',()=>{
 const camera=frameCamera(1280,720);
 const bottom=new Vector3(0,BOOK_BOARD.y-BOOK_BOARD.thickness/2,BOOK_BOARD.depth/2).project(camera);
 assert.ok((bottom.y+1)/2*720>=40,'desktop book should float at least 40px above the bottom');
 assert.ok(BOOK_BOARD.thickness<BOOK_PAGES.thickness/2,'boards read as thin cloth-covered card against the text block');
});
