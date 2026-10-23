import type { MouseEvent } from 'react';
/**
 * Whether a click on a story book's backdrop landed outside the book: on the dimmed backdrop, or on the bare space the book's own box
 * spans around its page (on phones that box is nearly the whole screen, so a tap beside the page used to do nothing). The page itself,
 * its buttons and links, and the page numbers keep their clicks.
 */
export function tappedOutside(e:MouseEvent){
 return !(e.target as Element).closest('.wz-sheet,.pb-sheet,.detail-book,button,a,input,label,.wz-nav>span');
}
