export function dragProgress(dx:number,width:number,direction:1|-1){return Math.max(0,Math.min(1,-dx*direction/Math.min(340,Math.max(150,width*.42))));}
export function commitDrag(progress:number,velocity:number){return progress>=.42||(progress>=.14&&velocity>=.65);}
export function wheelDelta(deltaX:number,deltaY:number,deltaMode:number,height:number){const value=Math.abs(deltaX)>Math.abs(deltaY)?deltaX:deltaY;return value*(deltaMode===1?16:deltaMode===2?height:1);}
