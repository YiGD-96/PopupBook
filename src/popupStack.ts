/**
 * How pop-up cards lie when folded, shared by the live book, the phone book and both intro films.
 *
 * Stacking: a folded card lies flat toward the back. Folded together, cards that stood one behind another would lie in the same
 * plane and cut through each other, so a folding card is lifted by its place in the scene, front cards on top, like the layers of a
 * real closed pop-up. The lift grows with the fold and is zero upright: a standing spread looks exactly as before.
 *
 * Rising: folded, a front card lies on top of the cards behind it, so the front card must stand first. Cards rise in turn from the
 * front (riseOrder): each one is at least as upright as every card behind it, so no card ever swings up through another. (Rising back
 * to front, the field passed up through the pony and the farmer still lying on it.)
 *
 * Gluing: a card can stand on another card (`on` in src/story.ts: a dish on the table). It is drawn inside that card's hinge, so it
 * folds with it and lies on it, instead of folding around its own hinge in mid-air. Only the relation is data; moving either card
 * keeps it working.
 */
import type { Layer } from './story.ts';

export const FLAT_STACK=.012;
/** Place of each card from back (0) to front, by depth (the open book's z, or the phone layout's). */
export function stackRanks(layers:Layer[],depth:(layer:Layer)=>number=layer=>layer.position[2]):Map<string,number>{
 return new Map(layers.map((layer,index)=>({layer,index})).sort((a,b)=>depth(a.layer)-depth(b.layer)||a.index-b.index).map(({layer},rank)=>[layer.id,rank]));
}
/** Lift of a card at stack place `rank` folded by `angle` (0 upright, ±π/2 flat). */
export function flatLift(rank:number,angle:number){return rank*FLAT_STACK*Math.min(1,Math.abs(angle)/(Math.PI/2));}
/** When a card starts to rise, in steps: 0 for the frontmost card, then one step per card toward the back. */
export function riseOrder(rank:number,count:number){return Math.max(0,count-1-rank);}
/** The card this one stands on, if any (and if it is in the same spread). */
export function gluedParent(layer:Layer,layers:Layer[]){return layer.on?layers.find(other=>other.id===layer.on&&other!==layer)??null:null;}
