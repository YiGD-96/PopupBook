/** One cover board, centred x from the binding; its inner edge leaves room for the spine. Rounded corners and a soft wrapped edge. */
export const BOOK_BOARD={width:3.42,depth:5.02,thickness:.1,x:1.99,y:-.28,radius:.08,bevel:.035};
/** The text block is a hidden filler inside the page-edge walls: from the gutter to just inside the top sheet's fore-edge (the walls only
 * spread outward below it) and just inside the printed sheet's 4.75 depth, so no face of it ever shows. */
export const BOOK_PAGES={width:3.536,depth:4.742,thickness:.31,y:-.076};
/** Where the ribbon marker comes out between the pages: just right of the gutter, in the second half that never turns and clear of the
 * spine band (|x| ≤ 0.33), so neither the opening half nor the folding spine ever passes through it. */
export const BOOK_RIBBON={x:.42,width:.07};
/** The cloth spine of the open book: it spans the gap between the boards and dips slightly under the gutter (grooves: bookGeometry).
 * Wide enough to read as the spine of a book this thick (closed, the halves stack about 0.82). */
export const BOOK_SPINE={halfWidth:.28,sag:.016};
