export const BOOK_FRAME_WIDTH = 8;
export const BOOK_FRAME_HEIGHT = 7.6;
export const BOOK_TARGET_Y = 1.95;
export const BOOK_CAMERA_POSITION = [0,8.7,12] as const;

export function bookZoom(width:number,height:number){
 return Math.min(width/BOOK_FRAME_WIDTH,height/BOOK_FRAME_HEIGHT);
}
