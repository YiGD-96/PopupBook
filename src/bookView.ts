export const BOOK_FRAME_WIDTH = 8.8;
export const BOOK_FRAME_HEIGHT = 6.6;
export const BOOK_TARGET_Y = 1.421;
export const BOOK_CAMERA_POSITION = [0,5.431,11.645] as const;
export const BOOK_CAMERA_DISTANCE = Math.hypot(BOOK_CAMERA_POSITION[1]-BOOK_TARGET_Y,BOOK_CAMERA_POSITION[2]);

/** Pixels per world unit on the target plane, so the frame always fits the viewport. */
export function bookZoom(width:number,height:number){
 return Math.min(width/BOOK_FRAME_WIDTH,height/BOOK_FRAME_HEIGHT);
}
/** Vertical field of view that keeps the frame at bookZoom scale; the intro video is the same centred crop. */
export function bookFov(width:number,height:number){
 return 2*Math.atan(height/bookZoom(width,height)/2/BOOK_CAMERA_DISTANCE)*180/Math.PI;
}

/** The desktop intro film reaches past the frame on every side (the desk around the book) so it fills wide and tall canvases. It is
 *  shown at the frame's scale and centred like the live camera, so the book keeps its size and place. */
export const FILM_SPAN={x:1.75,y:1.3} as const;
/** The film camera's field of view: the frame's height times FILM_SPAN.y. */
export function filmFov(){return 2*Math.atan(BOOK_FRAME_HEIGHT*FILM_SPAN.y/2/BOOK_CAMERA_DISTANCE)*180/Math.PI;}
