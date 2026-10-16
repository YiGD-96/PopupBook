import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,OrthographicCamera} from 'three';
import {BOOK_FRAME_WIDTH,BOOK_FRAME_HEIGHT,BOOK_TARGET_Y,BOOK_CAMERA_POSITION,bookZoom} from '../src/bookView.ts';
import {paperPoint} from '../src/paperGeometry.ts';
import {scenes} from '../src/story.ts';
import {splitPaperArt,attachedPaperPose,popupFoldAngle} from '../src/paperAttachments.ts';
import {BOOK_BOARD} from '../src/bookStructure.ts';

test('the same fixed front camera contains raised pages and attached popup cards in either direction',()=>{
 const camera=new OrthographicCamera(-BOOK_FRAME_WIDTH/2,BOOK_FRAME_WIDTH/2,BOOK_FRAME_HEIGHT/2,-BOOK_FRAME_HEIGHT/2,.1,70);
 camera.position.set(...BOOK_CAMERA_POSITION);camera.lookAt(0,BOOK_TARGET_Y,0);camera.updateMatrixWorld();
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

test('the hardback bottom edge has visible breathing room in the desktop framing',()=>{
 const camera=new OrthographicCamera(-BOOK_FRAME_WIDTH/2,BOOK_FRAME_WIDTH/2,BOOK_FRAME_HEIGHT/2,-BOOK_FRAME_HEIGHT/2,.1,70);
 camera.position.set(...BOOK_CAMERA_POSITION);camera.lookAt(0,BOOK_TARGET_Y,0);camera.updateMatrixWorld();
 const bottom=new Vector3(0,BOOK_BOARD.y-BOOK_BOARD.thickness/2,BOOK_BOARD.depth/2).project(camera);
 assert.ok((bottom.y+1)/2*720>=40,'desktop book should float at least 40px above the bottom');
 assert.ok(BOOK_BOARD.thickness>=.16);
});
