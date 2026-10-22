/**
 * The phone intro film (film.html?mode=standing), staged with the standing book's own parts (src/standingBook.tsx) under its camera
 * (src/standingView.ts). The closed book stands facing the reader with the magazine's cover moving on it, lies down with its binding
 * across the screen, opens its first half to 90° and the lean that makes it face the camera (UPRIGHT_LEAN), a few sheets swing up onto the upright page and the first spread's cards rise:
 * its last frame is the live standing book.
 */
import { useEffect, useMemo, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { BackSide, CanvasTexture, Color, DoubleSide, Euler, Matrix4, Quaternion, SRGBColorSpace, Vector3, type PerspectiveCamera, type Texture } from 'three';
import { loadScene, loadTexture } from './assets';
import { scenes, type Layer } from './story';
import { flatLift, gluedParent, riseOrder, stackRanks } from './popupStack';
import { SITE } from './site';
import { BOOK_BOARD, BOOK_PAGES, BOOK_SPINE } from './bookStructure';
import { BOOK_HINGE_Y, createBoardGeometry, createPaperBlockGeometry } from './bookGeometry';
import { BLOCK_X, BindingDetails, Board, DESK, Desk, DeskFog, PaperBlock, PrintedPage, Surface, createCardGeometry, useDisposable, type BookMaterials } from './bookParts';
import { INTRO_COVER_HOLD, INTRO_PAGES_START, INTRO_PAGE_TURN, STANDING_INTRO_DURATION, STANDING_INTRO_PAGE_COUNT, STANDING_INTRO_PAGE_STAGGER, STANDING_INTRO_UI_AT } from './introPlayback';
import { cropBackdrop, createStandingPage, createStandingSheetGeometry, createStandingSkirt, createStandingSpine, poseStandingSheet, thinStack } from './standingBook';
import { UPRIGHT_LEAN, UPRIGHT_SCALE, isBackdrop, standingPlacement, surfaceY } from './standingLayout';
/** The upright half's final turn from closed: 90° and the live book's lean (it faces the camera squarely). */
const OPEN_TO=Math.PI/2+UPRIGHT_LEAN;
import { STANDING_CAMERA_POSITION, STANDING_TARGET, standingFov, standingWholeFov } from './standingView';
import { STANDING_FILM_ASPECT } from './standingMedia';
import { FILM_FONT, TurnedMesh, ease, smooth } from './filmParts';

/** Everything the film shows at time t (seconds): the same hold and opening as the open book's film, the first half stopping at 90°. */
export function standingTimeline(t:number){
 const moving=t-INTRO_COVER_HOLD,lowering=ease(moving/1.4),open=ease((moving-.12)/1.43);
 // Pressed-flat sheets relax into their open swell once the halves are far enough apart.
 // The closed book is shown larger; it shrinks back early and dips a little more while it swings diagonally across the portrait frame.
 // The camera starts on the whole book (standingWholeFov) and closes in to the live book's view (standingFov) while the book opens,
 // done just before the cards rise, where the live book takes over (src/Intro.tsx pauses the film just before STANDING_INTRO_UI_AT).
 const zoom=smooth(moving/(STANDING_INTRO_UI_AT-.12-INTRO_COVER_HOLD));
 return {lowering,open,zoom,shrink:smooth(moving/.75),swell:smooth(open/.6),
  sheets:Array.from({length:STANDING_INTRO_PAGE_COUNT},(_,i)=>smooth((t-INTRO_PAGES_START-i*STANDING_INTRO_PAGE_STAGGER)/INTRO_PAGE_TURN)),
  cards:t>=STANDING_INTRO_UI_AT?t-STANDING_INTRO_UI_AT:-1};
}
/** The closed book standing on its tail, cover to the reader and spine on the left (so the cover art reads upright), leaning back a
 *  little and turned a touch: lying, its art runs up along world +x and its cover faces +y; standing, up is +y and the cover faces +z. */
const STAND_UP=new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0,1,0),new Vector3(0,0,1),new Vector3(1,0,0)));
const STAND_POSE=new Quaternion().setFromEuler(new Euler(-.48,-.15,0,'YXZ')).multiply(STAND_UP);
const LIE_POSE=new Quaternion();
/** The closed book's size (it is still shown larger than the open one: it stands nearer the camera). */
const STAND_SCALE=1;
/** The book turns about its second board's centre: where that lies in the live book, and where it stands while closed. Standing, its
 *  tail rests on the desk (lower, its bottom third sank under the desk and the cover read cut off), and it stands nearer the camera, on
 *  the line through the frame's centre: the whole cover sits mid-frame, well inside the band every phone shows of the 9:20 film. */
const PIVOT_LYING=new Vector3(0,BOOK_HINGE_Y,BOOK_BOARD.x),PIVOT_STANDING=new Vector3(.1,2.15,3.07);

/** `zoom` 0 frames the whole book (as the phone book used to be), 1 the live book's view; the film eases from one to the other. */
export function StandingFilmCamera({width,height,zoom=1}:{width:number;height:number;zoom?:number}){
 const {camera,scene}=useThree();
 const [whole,close]=useMemo(()=>[standingWholeFov(width,height),standingFov(width,height)],[width,height]);
 useEffect(()=>{const cam=camera as PerspectiveCamera;cam.aspect=width/height;cam.fov=whole+(close-whole)*zoom;cam.position.set(...STANDING_CAMERA_POSITION);cam.lookAt(...STANDING_TARGET);cam.updateProjectionMatrix();},[camera,scene,width,height,whole,close,zoom]);
 return null;
}
/** The first half turning about the binding from closed (−π) to standing (−π/2), shortening from the closed book's full size to the
 *  upright half's (`height`, along its outward axis): standing, exactly the live StandingHalf. */
function FilmStandingHalf({materials,angle,swell,page,height,thin}:{materials:BookMaterials;angle:number;swell:number;page:Texture;height:number;thin:number}){
 const board=useDisposable(()=>createBoardGeometry(true),[]),block=useDisposable(()=>createPaperBlockGeometry(),[]);
 const sheet=useDisposable(()=>createStandingPage(swell),[swell]),skirt=useDisposable(()=>createStandingSkirt(swell),[swell]);
 // Its page stack thins as it opens, to the live book's (src/standingBook.tsx thinStack).
 const bases=useMemo(()=>[board,block].map(g=>Float32Array.from(g.getAttribute('position').array as Float32Array)),[board,block]);
 thinStack(board,bases[0],[-BOOK_BOARD.x,BOOK_BOARD.y],thin);thinStack(block,bases[1],[-BLOCK_X,BOOK_PAGES.y],thin);
 const skirtBase=useMemo(()=>Float32Array.from(skirt.getAttribute('position').array as Float32Array),[skirt]);thinStack(skirt,skirtBase,[0,0],thin);
 const edge=materials['paper-edge'],endpaper=materials.endpaper;
 return <group position={[0,BOOK_HINGE_Y,0]} rotation={[0,0,angle]} scale={[height,1,1]}><group position={[0,-BOOK_HINGE_Y,0]}>
  <TurnedMesh geometry={board} angle={angle} position={[-BOOK_BOARD.x,BOOK_BOARD.y,0]} maps={[materials.inside,materials.cover,materials['cloth-side']]}/>
  <TurnedMesh geometry={block} angle={angle} position={[-BLOCK_X,BOOK_PAGES.y,0]} maps={[edge,edge,endpaper,endpaper,edge,edge]}/>
  <mesh geometry={sheet}><Surface map={endpaper}/></mesh><mesh geometry={sheet} renderOrder={1}><meshBasicMaterial map={page} vertexColors transparent side={DoubleSide} depthWrite={false}/></mesh><mesh geometry={skirt}><Surface map={edge} fallback="#e8dbc2"/></mesh>
 </group></group>;
}
function FoldingSpine({materials,fold}:{materials:BookMaterials;fold:number}){
 const geometry=useDisposable(()=>createStandingSpine(fold),[fold]);
 return <mesh geometry={geometry}><Surface map={materials['cloth-side']} fallback="#ac705b"/></mesh>;
}
/** A sheet swinging up as in the live standing turn: paper while it lies, its painting on the face that ends up upright. */
function FilmSheet({paper,paperTint,backdrop,q,lift}:{paper?:Texture;paperTint?:string;backdrop:Texture;q:number;lift:number}){
 const geometry=useDisposable(createStandingSheetGeometry,[]);poseStandingSheet(geometry,q,OPEN_TO);
 return <group position={[0,lift,0]}><mesh geometry={geometry} renderOrder={4}><meshBasicMaterial map={paper} color={paperTint??'#ffffff'} vertexColors side={DoubleSide}/></mesh><mesh geometry={geometry} renderOrder={5}><meshBasicMaterial map={backdrop} vertexColors transparent side={BackSide} depthWrite={false}/></mesh></group>;
}
/** A card rising on the flat page, built like the live StandingLayer. */
function StandingPopupFace({layer,texture}:{layer:Layer;texture:Texture}){
 const place=standingPlacement(layer);
 const card=useDisposable(()=>createCardGeometry({center:0,width:place.size[0],u0:0,u1:1,side:'right'},place.size[1]),[place.size[0],place.size[1]]);
 return <mesh geometry={card} position={[0,place.size[1]/2,0]}><meshBasicMaterial map={texture} transparent alphaTest={.025} side={DoubleSide} depthWrite/></mesh>;
}
/** A card rising on the flat page, stacked while folded and carrying its glued cards, like the live StandingLayer. */
function StandingPopup({layer,texture,rise,rank,children}:{layer:Layer;texture:Texture;rise:number;rank:number;children?:ReactNode}){
 const place=standingPlacement(layer),hinge=-(1-rise)*Math.PI/2;
 return <group position={[place.x,surfaceY(place.z)+(place.lift??0)+flatLift(rank,hinge),place.z]}><group rotation={[hinge,0,0]}><StandingPopupFace layer={layer} texture={texture}/>{children}</group></group>;
}
function StandingPopups({cards,scenery,time}:{cards:Layer[];scenery:Record<string,Texture>;time:number}){
 const ranks=stackRanks(cards,layer=>standingPlacement(layer).z);
 return <>{cards.map(layer=>{
  if(gluedParent(layer,cards))return null;const base=standingPlacement(layer);
  const glued=cards.filter(child=>gluedParent(child,cards)===layer).map(child=>{const place=standingPlacement(child);return <group key={child.id} position={[place.x-base.x,surfaceY(place.z)+(place.lift??0)-surfaceY(base.z)-(base.lift??0),place.z-base.z]}><StandingPopupFace layer={child} texture={scenery[child.src]}/></group>;});
  return <StandingPopup key={layer.id} layer={layer} texture={scenery[layer.src]} rise={smooth((time-riseOrder(ranks.get(layer.id)??0,cards.length)*.075)/.85)} rank={ranks.get(layer.id)??0}>{glued}</StandingPopup>;
 })}</>;
}
/** The title, printed on the first half's page (landscape, as the upright page reads), seen as the book opens. */
async function titlePage(){
 await Promise.all(['400','700'].map(weight=>document.fonts.load(`${weight} 30px ${FILM_FONT}`,'제주')));
 // The page is PAGE_HEIGHT × PAGE_WIDTH (4.75 × 3.55); the text sits on the endpaper, so the canvas is otherwise clear.
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1196;const c=canvas.getContext('2d')!;
 c.textAlign='center';c.textBaseline='alphabetic';
 c.fillStyle='rgba(150,140,110,.85)';c.font=`400 27px Georgia,serif`;c.fillText(SITE.label.split('').join(String.fromCharCode(8202)),800,500);
 c.fillStyle='rgba(84,74,58,.85)';c.font=`700 72px ${FILM_FONT}`;c.fillText(SITE.title,800,618);
 c.fillStyle='rgba(150,140,110,.55)';c.fillRect(760,668,80,3);
 c.fillStyle='rgba(84,74,58,.7)';c.font=`400 35px ${FILM_FONT}`;c.fillText(SITE.name,800,748);
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture;
}
export type StandingAssets={scenery:Record<string,Texture>;title:Texture;backs:Texture[];chapters:number[]};
/** The first spread's art, the title page and the paintings on the swinging sheets: the last chapter's first, so the last sheet to land
 *  carries the first spread's backdrop, which the live book shows on its upright page. */
export async function loadStandingAssets():Promise<StandingAssets>{
 // The phone's own picture of a backdrop where it has one (`phoneSrc`), as the live standing book shows it.
 const backdrop=(chapter:number)=>{const layer=scenes[chapter].layers.find(isBackdrop)!;return loadTexture(layer.phoneSrc??layer.src);};
 const chapters=Array.from({length:STANDING_INTRO_PAGE_COUNT},(_,i)=>(STANDING_INTRO_PAGE_COUNT-1-i)%scenes.length);
 const [scenery,title,paintings]=await Promise.all([loadScene(0),titlePage(),Promise.all(chapters.map(backdrop))]);
 return {scenery,title,backs:paintings.map(cropBackdrop),chapters};
}
export function StandingFilm({materials,assets,t,width,height}:{materials:BookMaterials;assets:StandingAssets;t:number;width:number;height:number}){
 const f=standingTimeline(t),landed=f.sheets.filter(q=>q>=1).length;
 // The opening half rises up and to the left while the book still lies diagonally, so it drifts right a little to stay in frame.
 const pivot=PIVOT_STANDING.clone().lerp(PIVOT_LYING,f.lowering).setX(PIVOT_STANDING.x*(1-f.lowering)+.25*f.lowering**3*Math.sqrt(Math.sin(Math.PI*f.lowering))),turn=STAND_POSE.clone().slerp(LIE_POSE,f.lowering),scale=STAND_SCALE+(1-STAND_SCALE)*f.shrink-.15*Math.sqrt(Math.sin(Math.PI*f.lowering));
 // Each sheet lands as the upright page's picture, so the page never swaps what it shows.
 const upright=landed?assets.backs[landed-1]:assets.title;
 // Each sheet lifting uncovers its own spread's paper tone (src/story.ts `paper`), the live book's flat page once the first spread's lifts.
 const paperOf=(i:number)=>i<0?undefined:(scenes[assets.chapters[i]] as {paper?:string}).paper,started=f.sheets.filter(q=>q>0).length;
 const cards=scenes[0].layers.filter(layer=>!isBackdrop(layer)&&!layer.phoneHidden);
 // The first spread's own printed floor (src/story.ts `stage`), as the live book's flat page shows it, once its sheet has lifted off.
 const stageName=(scenes[0] as {stage?:string}).stage,floor=stageName&&started>0&&assets.chapters[started-1]===0?assets.scenery[stageName]:undefined;
 return <><StandingFilmCamera width={width} height={height} zoom={f.zoom}/><DeskFog background/><Desk materials={materials}/>
  <group position={pivot} quaternion={turn} scale={scale}><group position={[0,-BOOK_HINGE_Y,-BOOK_BOARD.x]}><group rotation={[0,-Math.PI/2,0]}>
   <Board materials={materials} x={BOOK_BOARD.x}/><PaperBlock materials={materials} x={BLOCK_X}/>
   {materials.endpaper&&<PrintedPage texture={floor??materials.endpaper} edge={materials['paper-edge']} swell={f.swell} tint={floor?undefined:paperOf(started-1)}/>}
   <BindingDetails materials={materials}/><FoldingSpine materials={materials} fold={f.open*OPEN_TO/Math.PI}/>
   <FilmStandingHalf materials={materials} angle={-Math.PI+f.open*OPEN_TO} swell={f.swell} page={upright} height={1+(UPRIGHT_SCALE-1)*f.open} thin={f.open}/>
   {f.sheets.map((q,i)=>q>0&&q<1?<FilmSheet key={i} paper={materials.endpaper} paperTint={paperOf(i-1)} backdrop={assets.backs[i]} q={q} lift={.008+(STANDING_INTRO_PAGE_COUNT-i)*.004}/>:null)}
  </group></group></group>
  {f.cards>=0&&<StandingPopups cards={cards} scenery={assets.scenery} time={f.cards}/>}
 </>;
}
/** What the renderer records next to the phone movie, read from the modules the live standing book uses. */
export function standingFilmMeta(width:number,height:number){
 return {mode:'standing',width,height,aspect:STANDING_FILM_ASPECT,duration:STANDING_INTRO_DURATION,coverHold:INTRO_COVER_HOLD,uiRevealAt:STANDING_INTRO_UI_AT,sceneryStartsAt:STANDING_INTRO_UI_AT,
  pageCount:STANDING_INTRO_PAGE_COUNT,camera:[...STANDING_CAMERA_POSITION],target:[...STANDING_TARGET],fov:standingFov(width,height),projection:'perspective',renderer:'three.js (src/standingFilm.tsx)',
  background:DESK.color,board:BOOK_BOARD,pages:BOOK_PAGES,spine:BOOK_SPINE,shadows:false,bakedShadows:false};
}
