/** One cover board, centred x from the binding; its inner edge leaves room for the spine. Rounded corners and a soft wrapped edge. */
export const BOOK_BOARD={width:3.5,depth:5.02,thickness:.1,x:1.95,y:-.28,radius:.08,bevel:.035};
/** The text block is a hidden filler inside the page-edge walls: from the gutter to just inside the top sheet's fore-edge (the walls only
 * spread outward below it) and just inside the printed sheet's 4.75 depth, so no face of it ever shows. */
export const BOOK_PAGES={width:3.536,depth:4.742,thickness:.32,y:-.07};
/** Where the ribbon marker comes out between the pages: just right of the gutter, in the second half that never turns and clear of the
 * spine band (|x| ≤ 0.25), so neither the opening half nor the folding spine ever passes through it. */
export const BOOK_RIBBON={x:.35,width:.07};
/** The cloth spine of the open book: it spans the gap between the boards and dips slightly under the gutter (grooves: bookGeometry). */
export const BOOK_SPINE={halfWidth:.2,sag:.012};
/** Baked floor shadow plane per board half; nudged toward the reader as if lit from behind. */
export const BOOK_FLOOR_SHADOW={width:4.79,depth:6.42,y:-.334,z:.12};
/** Popup cards cast a soft baked shadow forward onto the page, as a fraction of card height. */
export const POPUP_SHADOW={length:.34,opacity:.36,mipBias:2,color:[.36,.27,.18] as const};
