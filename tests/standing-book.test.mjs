import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,PerspectiveCamera} from 'three';
import {scenes} from '../src/story.ts';
import {UPRIGHT_SCALE,STAGE,isBackdrop,standingPlacement,surfaceY,standingFoldIn,standingFoldOut,standingSheetProgress,standingSheetPoint,uprightPagePoint,backdropCrop} from '../src/standingLayout.ts';
import {STANDING_CAMERA_POSITION,STANDING_TARGET,STANDING_FRAME_POINTS,standingFov} from '../src/standingView.ts';
import {paperPoint,PAGE_WIDTH,PAGE_HEIGHT} from '../src/paperGeometry.ts';
import {STANDING_FILM_ASPECT,STANDING_FRAME_REACH,standingMediaSize} from '../src/standingMedia.ts';

const near=(a,b,e=1e-3)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
const camera=(w,h)=>{const c=new PerspectiveCamera(standingFov(w,h),w/h,.1,70);c.position.set(...STANDING_CAMERA_POSITION);c.lookAt(...STANDING_TARGET);c.updateMatrixWorld();c.updateProjectionMatrix();return c;};

test('every standing card stays on the flat page, clear of its edges and in front of the upright page',()=>{
 for(const scene of scenes)for(const layer of scene.layers.filter(l=>!isBackdrop(l))){
  const {x,z,size}=standingPlacement(layer);
  assert.ok(Math.abs(x)+size[0]/2<=STAGE.halfWidth-STAGE.margin+1e-9,`${scene.id}/${layer.id} runs off the page`);
  assert.ok(z>=.3&&z<=STAGE.depth-.3,`${scene.id}/${layer.id} depth ${z}`);
 }
 // Each spread has a backdrop for the upright page.
 for(const scene of scenes)assert.ok(scene.layers.some(isBackdrop));
});
test('the phone camera holds the whole standing book and every card on common phone canvases',()=>{
 for(const [w,h] of [[426,600],[396,520],[466,720],[396,440]]){
  const c=camera(w,h),inside=(p,label)=>{const v=new Vector3(...p).project(c);assert.ok(Math.abs(v.x)<=.99&&Math.abs(v.y)<=.99,`${label} clipped at ${w}×${h}: ${v.x.toFixed(2)},${v.y.toFixed(2)}`);};
  STANDING_FRAME_POINTS.forEach((p,i)=>inside(p,'frame point '+i));
  for(const scene of scenes)for(const layer of scene.layers.filter(l=>!isBackdrop(l))){const {x,z,size}=standingPlacement(layer);for(const dx of [-.5,.5])inside([x+dx*size[0],surfaceY(z)+size[1],z],`${scene.id}/${layer.id}`);}
 }
});
test('a standing turn folds the cards away before the sheet moves and raises the next ones only once it stands',()=>{
 near(standingFoldOut(0),0);near(standingFoldOut(.26),-Math.PI/2);near(standingSheetProgress(.26),0);
 near(standingSheetProgress(.82),1);near(standingFoldIn(.8),-Math.PI/2);near(standingFoldIn(1),0);
});
test('the turning sheet starts as the flat page and ends just in front of the upright page',()=>{
 for(const u of [0,.3,1])for(const v of [0,.5,1]){
  const flat=paperPoint(u,v,0),start=standingSheetPoint(u,v,0),end=standingSheetPoint(u,v,1),upright=uprightPagePoint(u,v);
  near(start[0],flat[0],.005);near(start[1],flat[1],.005);near(start[2],flat[2]);
  near(end[1],upright[1],.005);assert.ok(end[0]>upright[0]&&end[0]-upright[0]<.012,'in front of the upright page, not through it');
 }
});
test('a backdrop is cropped to cover the upright page without its printed border',()=>{
 const crop=backdropCrop(2.535);assert.ok(crop.repeat[0]<.8&&crop.repeat[1]>.9);
 // The crop keeps the painting's proportions on the shortened upright page.
 near(crop.repeat[0]*2.535/crop.repeat[1],PAGE_HEIGHT/(UPRIGHT_SCALE*PAGE_WIDTH));near(crop.offset[0]*2+crop.repeat[0],1);
});
test('the phone film, scaled by standingMediaSize, lines up with the live standing camera on any canvas',()=>{
 // The three.js-free sizing uses the frame's reach ratio; it must be the one the camera framing actually has.
 const portrait=standingFov(100,1000),square=standingFov(1000,100),t=f=>Math.tan(f*Math.PI/360);
 near(t(portrait)/t(square)/10,STANDING_FRAME_REACH,2e-5);
 const film=[720,1280];
 for(const [w,h] of [[390,722],[375,551],[412,658],[736,598],[426,600]]){
  // A world point projects to the same canvas pixel whether drawn live or through the film shown at that size, centred.
  const live=camera(w,h),movie=camera(...film),size=standingMediaSize(w,h);near(size.width/size.height,STANDING_FILM_ASPECT,1e-9);
  for(const p of [[2.5,-.33,3.7],[-2.37,3.7,-.4],[0,1.6,1.2],[1.6,.2,2.8]]){
   const a=new Vector3(...p).project(live),b=new Vector3(...p).project(movie);
   near(a.x*w/2,b.x*size.width/2,.05);near(a.y*h/2,b.y*size.height/2,.05);
  }
 }
});
